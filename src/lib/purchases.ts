'use client'
import {
  collection,
  doc,
  runTransaction,
  serverTimestamp,
  type Firestore,
} from 'firebase/firestore';

export type PurchaseData = {
  proveedorId: string;
  proveedorNombre: string;
  items: {
    productId: string;
    nombre: string;
    cantidad: number;
    costoUnitario: number;
    subtotal: number;
  }[];
  total: number;
};

export async function processPurchase(firestore: Firestore, purchaseData: PurchaseData): Promise<string> {
  if (!purchaseData.proveedorId) throw new Error('ID de proveedor no válido.');
  if (purchaseData.items.length === 0) throw new Error('La compra está vacía.');
  
  const purchaseRef = doc(collection(firestore, 'compras'));

  try {
    await runTransaction(firestore, async (transaction) => {
      // 1. Validar existencia de productos y preparar actualizaciones
      const updates = await Promise.all(
        purchaseData.items.map(async (item) => {
          const ref = doc(firestore, 'productos', item.productId);
          const snap = await transaction.get(ref);
          if (!snap.exists()) throw new Error(`Producto ${item.nombre} no existe.`);
          return { ref, currentStock: snap.data().stock || 0, item };
        })
      );

      // 2. Registrar la compra con subtotales incluidos
      transaction.set(purchaseRef, {
        ...purchaseData,
        fecha: serverTimestamp(),
      });

      // 3. Actualizar stock y precio de compra en cada producto
      for (const update of updates) {
        transaction.update(update.ref, { 
          stock: update.currentStock + update.item.cantidad,
          precioCompra: update.item.costoUnitario,
          fechaActualizacion: serverTimestamp(),
        });
      }
    });
    return purchaseRef.id;
  } catch (error) {
    console.error('Error en transacción:', error);
    throw error;
  }
}
