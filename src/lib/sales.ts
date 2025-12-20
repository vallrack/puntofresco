'use client'
import {
  collection,
  doc,
  runTransaction,
  serverTimestamp,
  type Firestore,
} from 'firebase/firestore';
import type { Sale } from './types';

export async function processSale(firestore: Firestore, saleData: Sale): Promise<string> {
  if (!saleData.vendedorId) {
    throw new Error('ID de vendedor no válido.');
  }
  if (saleData.items.length === 0) {
    throw new Error('El carrito está vacío.');
  }
  
  const saleRef = doc(collection(firestore, 'ventas'));

  try {
    await runTransaction(firestore, async (transaction) => {
      // --- FASE DE LECTURA ---
      // Primero, lee todos los documentos de productos para verificar el stock.
      const productRefs = saleData.items.map(item => doc(firestore, 'productos', item.productId));
      const productDocs = await Promise.all(productRefs.map(ref => transaction.get(ref)));

      // --- FASE DE VALIDACIÓN ---
      for (let i = 0; i < productDocs.length; i++) {
        const productDoc = productDocs[i];
        const item = saleData.items[i];
        
        if (!productDoc.exists()) {
          throw new Error(`El producto "${item.nombre}" no existe.`);
        }

        const newStock = productDoc.data().stock - item.quantity;
        if (newStock < 0) {
          throw new Error(`Stock insuficiente para "${item.nombre}".`);
        }
      }

      // --- FASE DE ESCRITURA ---
      // Si todas las lecturas y validaciones son correctas, ahora realizamos todas las escrituras.

      // 1. Crear el nuevo documento de venta.
      transaction.set(saleRef, {
        vendedorId: saleData.vendedorId,
        items: saleData.items,
        total: saleData.total,
        fecha: serverTimestamp(),
        metodoPago: saleData.metodoPago,
      });

      // 2. Actualizar el stock de cada producto.
      for (let i = 0; i < productDocs.length; i++) {
        const productDoc = productDocs[i];
        const item = saleData.items[i];
        const newStock = productDoc.data().stock - item.quantity;
        transaction.update(productRefs[i], { stock: newStock });
      }
    });
     return saleRef.id;
  } catch (error) {
    console.error('Error en la transacción de venta: ', error);
    // Re-throw the error to be caught by the calling function
    throw error;
  }
}
