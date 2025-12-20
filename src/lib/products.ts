'use client';
import { collection, addDoc, serverTimestamp } from 'firebase/firestore';
import { initializeFirebase } from '@/firebase';

// Esta es una versión parcial del tipo, asegúrate de que coincida con tu tipo Product completo
type NewProductData = {
  nombre: string;
  sku: string;
  categoria: string;
  precioCompra: number;
  precioVenta: number;
  stock: number;
  stockMinimo: number;
  imageUrl: string; // Ahora es una cadena Base64
  imageHint: string;
  creadoPor: string;
  actualizadoPor: string;
};

// Agregar producto a Firestore
export async function addProduct(productData: NewProductData) {
  const { firestore } = initializeFirebase();
  try {
    const productsCollection = collection(firestore, 'productos');
    const docRef = await addDoc(productsCollection, {
      ...productData,
      fechaCreacion: serverTimestamp(),
      fechaActualizacion: serverTimestamp(),
    });
    return docRef;
  } catch (error) {
    console.error("Error en addProduct:", error);
    // Si el error es por el tamaño del documento, damos un mensaje más claro
    if (error instanceof Error && error.message.includes('exceeds the maximum size')) {
      throw new Error('La imagen es demasiado grande. Por favor, utiliza una imagen más pequeña.');
    }
    throw error;
  }
}
