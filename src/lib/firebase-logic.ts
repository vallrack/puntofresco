
'use client';
import { collection, addDoc, serverTimestamp } from 'firebase/firestore';
import { ref, uploadBytes, getDownloadURL } from 'firebase/storage';
import { initializeFirebase } from '@/firebase';
import { v4 as uuidv4 } from 'uuid';

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

// Subir imagen a Storage
export async function uploadImage(file: File, path: string): Promise<string> {
  const { storage } = initializeFirebase();
  if (!file) throw new Error('No se proporcionó ningún archivo.');

  const fileExtension = file.name.split('.').pop();
  const uniqueFilename = `${uuidv4()}.${fileExtension}`;
  const storageRef = ref(storage, `${path}/${uniqueFilename}`);

  try {
    console.log("Iniciando subida a Firebase Storage...");
    const snapshot = await uploadBytes(storageRef, file);
    const downloadURL = await getDownloadURL(snapshot.ref);
    console.log("Subida completada. URL:", downloadURL);
    return downloadURL;
  } catch (error) {
    console.error('Error detallado en uploadImage:', error);
    throw error;
  }
}

// Agregar producto a Firestore
export async function addProduct(productData: NewProductData) {
  const { firestore } = initializeFirebase();
  try {
    console.log("Agregando producto a Firestore...");
    const productsCollection = collection(firestore, 'productos');
    const docRef = await addDoc(productsCollection, {
      ...productData,
      fechaCreacion: serverTimestamp(),
      fechaActualizacion: serverTimestamp(),
    });
    console.log("Producto agregado con ID:", docRef.id);
    return docRef;
  } catch (error) {
    console.error("Error detallado en addProduct:", error);
    throw error;
  }
}
