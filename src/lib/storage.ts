'use client';
import { ref, uploadBytes, getDownloadURL } from 'firebase/storage';
import { initializeFirebase } from '@/firebase';

// Subir imagen a Storage
export async function uploadImage(file: File, path: string): Promise<string> {
  const { storage } = initializeFirebase();
  if (!file) {
    throw new Error('No se proporcionó ningún archivo para subir.');
  }

  // Usamos el nombre original del archivo por simplicidad, pero en producción se recomienda un ID único.
  const storageRef = ref(storage, `${path}/${file.name}`);
  
  try {
    const snapshot = await uploadBytes(storageRef, file);
    const downloadURL = await getDownloadURL(snapshot.ref);
    return downloadURL;
  } catch (error) {
    console.error('Error detallado en uploadImage:', error);
    throw error;
  }
}
