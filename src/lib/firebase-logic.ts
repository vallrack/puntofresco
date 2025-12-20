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
  console.log("uploadImage: Función iniciada.");
  const { storage } = initializeFirebase();
  if (!file) {
    console.error("uploadImage: No se proporcionó ningún archivo.");
    throw new Error('No se proporcionó ningún archivo.');
  }

  const fileExtension = file.name.split('.').pop();
  const uniqueFilename = `${uuidv4()}.${fileExtension}`;
  const storageRef = ref(storage, `${path}/${uniqueFilename}`);
  console.log(`uploadImage: Intentando subir el archivo a la ruta: ${storageRef.fullPath}`);

  try {
    // --- EL CÓDIGO SE DETIENE AQUÍ ---
    // El siguiente 'await' nunca se completa porque la red lo bloquea.
    const snapshot = await uploadBytes(storageRef, file);
    console.log("uploadImage: La subida del snapshot se completó.");
    
    const downloadURL = await getDownloadURL(snapshot.ref);
    console.log("uploadImage: URL de descarga obtenida:", downloadURL);
    return downloadURL;
  } catch (error) {
    console.error('Error detallado en uploadImage:', error);
    // Este error se muestra en la consola del navegador como "net::ERR_FAILED"
    // y es causado por el bloqueo de CORS.
    throw error;
  }
}

// Agregar producto a Firestore
export async function addProduct(productData: NewProductData) {
  console.log("addProduct: Función iniciada con datos:", productData);
  const { firestore } = initializeFirebase();
  try {
    const productsCollection = collection(firestore, 'productos');
    const docRef = await addDoc(productsCollection, {
      ...productData,
      fechaCreacion: serverTimestamp(),
      fechaActualizacion: serverTimestamp(),
    });
    console.log("addProduct: Producto agregado a Firestore con ID:", docRef.id);
    return docRef;
  } catch (error) {
    console.error("Error en addProduct:", error);
    throw error;
  }
}
