'use client'
import {
  collection,
  doc,
  increment,
  runTransaction,
  serverTimestamp,
  writeBatch,
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
      // 1. Create a new sale document
      transaction.set(saleRef, {
        vendedorId: saleData.vendedorId,
        items: saleData.items,
        total: saleData.total,
        fecha: serverTimestamp(),
      });

      // 2. Update stock for each product in the sale
      for (const item of saleData.items) {
        const productRef = doc(firestore, 'productos', item.productId);
        
        // We read the document inside the transaction to ensure atomicity
        const productDoc = await transaction.get(productRef);
        if (!productDoc.exists()) {
            throw new Error(`El producto "${item.nombre}" no existe.`);
        }

        const newStock = productDoc.data().stock - item.quantity;
        if (newStock < 0) {
          throw new Error(`Stock insuficiente para "${item.nombre}".`);
        }
        
        transaction.update(productRef, { stock: newStock });
      }
    });
     return saleRef.id;
  } catch (error) {
    console.error('Error en la transacción de venta: ', error);
    // Re-throw the error to be caught by the calling function
    throw error;
  }
}
