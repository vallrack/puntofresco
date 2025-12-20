'use client';
import { getStorage, ref, uploadBytes, getDownloadURL } from "firebase/storage";
import { initializeFirebase } from "@/firebase";

/**
 * Sube una imagen a Firebase Storage directamente desde el cliente.
 * Este es el método recomendado y más robusto.
 */
export async function uploadImage(file: File, path: string): Promise<string> {
  console.log('🚀 uploadImage (client-side v2): Iniciando subida...', {
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
    // Usamos el nombre del bucket por defecto que Firebase configura
    const storageRef = ref(storage, path);

    console.log('📡 Subiendo al bucket usando el SDK de cliente. Ruta:', path);

    const snapshot = await uploadBytes(storageRef, file, {
      contentType: file.type,
    });
    
    console.log('✅ Archivo subido exitosamente a través del SDK de cliente.');

    const downloadUrl = await getDownloadURL(snapshot.ref);

    console.log('✅ URL de descarga obtenida:', downloadUrl);
    
    return downloadUrl;

  } catch (error: any) {
    console.error('❌ Error en uploadImage (client-side v2):', error);

    if (error.code === 'storage/unauthorized') {
      throw new Error('No tienes permiso para subir archivos. Revisa las reglas de Storage. Asegúrate de que el usuario esté autenticado y la ruta de subida sea correcta.');
    }
    
    throw new Error(error.message || 'Error desconocido al subir la imagen');
  }
}
