'use client'
import {
  collection,
  doc,
  runTransaction,
  serverTimestamp,
  type Firestore,
} from 'firebase/firestore';

// Definimos un tipo para los datos que llegan a esta función
type PurchaseData = {
  proveedorId: string;
  items: {
    productId: string;
    cantidad: number;
    costoUnitario: number;
  }[];
  total: number;
};


export async function processPurchase(firestore: Firestore, purchaseData: PurchaseData): Promise<string> {
  if (!purchaseData.proveedorId) {
    throw new Error('ID de proveedor no válido.');
  }
  if (purchaseData.items.length === 0) {
    throw new Error('La orden de compra está vacía.');
  }
  
  const purchaseRef = doc(collection(firestore, 'compras'));

  try {
    await runTransaction(firestore, async (transaction) => {
      // --- FASE DE LECTURA ---
      const productRefs = purchaseData.items.map(item => doc(firestore, 'productos', item.productId));
      const productDocs = await Promise.all(productRefs.map(ref => transaction.get(ref)));

      // --- FASE DE VALIDACIÓN ---
      for (let i = 0; i < productDocs.length; i++) {
        const productDoc = productDocs[i];
        if (!productDoc.exists()) {
          throw new Error(`El producto con ID "${purchaseData.items[i].productId}" no existe.`);
        }
      }

      // --- FASE DE ESCRITURA ---
      // 1. Crear el nuevo documento de compra, asegurando que el total esté incluido.
      transaction.set(purchaseRef, {
        ...purchaseData,
        fecha: serverTimestamp(),
      });

      // 2. Actualizar el stock y costo de cada producto.
      for (let i = 0; i < productDocs.length; i++) {
        const productDoc = productDocs[i];
        const item = purchaseData.items[i];
        const currentStock = productDoc.data().stock || 0;
        const newStock = currentStock + item.cantidad;
        
        // Aquí actualizamos el stock y el precio de compra del producto.
        transaction.update(productRefs[i], { 
            stock: newStock,
            precioCompra: item.costoUnitario, // Actualiza al costo más reciente
            fechaActualizacion: serverTimestamp(),
        });
      }
    });
     return purchaseRef.id;
  } catch (error) {
    console.error('Error en la transacción de compra: ', error);
    throw error;
  }
}
