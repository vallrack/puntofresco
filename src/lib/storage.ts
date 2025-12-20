'use client';
import { getStorage, ref, uploadBytes, getDownloadURL } from "firebase/storage";
import { initializeFirebase } from "@/firebase";

/**
 * Sube una imagen a Firebase Storage directamente desde el cliente.
 */
export async function uploadImage(file: File, path: string): Promise<string> {
  console.log('🚀 uploadImage (client-side): Iniciando subida...', {
    fileName: file.name,
    fileSize: file.size,
    fileType: file.type,
    path
  });
  
  // Validaciones del cliente
  if (!file.type.startsWith('image/')) {
    throw new Error('El archivo debe ser una imagen (PNG, JPG, etc.)');
  }

  if (file.size > 5 * 1024 * 1024) {
    throw new Error('La imagen no debe superar los 5MB');
  }

  try {
    const { storage } = initializeFirebase();
    const storageRef = ref(storage, path);

    console.log('📡 Subiendo al bucket, ruta:', path);

    const snapshot = await uploadBytes(storageRef, file, {
      contentType: file.type,
    });
    
    console.log('✅ Archivo subido exitosamente:', snapshot.metadata.fullPath);

    const downloadUrl = await getDownloadURL(snapshot.ref);

    console.log('✅ URL de descarga obtenida:', downloadUrl);
    
    return downloadUrl;

  } catch (error: any) {
    console.error('❌ Error en uploadImage (client-side):', error);

    if (error.code === 'storage/unauthorized') {
      throw new Error('No tienes permiso para subir archivos. Revisa las reglas de Storage.');
    }
    
    throw new Error(error.message || 'Error desconocido al subir la imagen');
  }
}
