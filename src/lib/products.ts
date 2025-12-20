'use client';
import {
  collection,
  addDoc,
  serverTimestamp,
} from 'firebase/firestore';
import { initializeFirebase } from '@/firebase';

type NewProductData = {
  nombre: string;
  sku: string;
  categoria: string;
  precioCompra: number;
  precioVenta: number;
  stock: number;
  stockMinimo: number;
  imageUrl: string;
  imageHint: string;
  creadoPor: string;
  actualizadoPor: string;
};

export async function addProduct(productData: Omit<NewProductData, 'image'>) {
  const { firestore } = initializeFirebase();
  try {
    const productsCollection = collection(firestore, 'productos');
    await addDoc(productsCollection, {
      ...productData,
      fechaCreacion: serverTimestamp(),
      fechaActualizacion: serverTimestamp(),
    });
  } catch (error) {
    console.error("Error al agregar producto: ", error);
    throw new Error("No se pudo agregar el producto a la base de datos.");
  }
}
