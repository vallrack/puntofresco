'use client';
import { ref, uploadBytes, getDownloadURL } from 'firebase/storage';
import { initializeFirebase } from '@/firebase';

export async function uploadImage(file: File, path: string): Promise<string> {
  const { storage } = initializeFirebase();
  
  if (!file) {
    throw new Error('No se proporcionó ningún archivo para subir.');
  }

  // Generar un nombre único para evitar colisiones
  const uniqueFileName = `${Date.now()}-${file.name}`;
  const storageRef = ref(storage, `${path}/${uniqueFileName}`);
  
  console.log('uploadImage: Iniciando subida...', {
    fileName: file.name,
    fileSize: file.size,
    fileType: file.type,
    path: `${path}/${uniqueFileName}`
  });

  try {
    // Validar el archivo antes de subirlo
    if (!file.type.startsWith('image/')) {
      throw new Error('El archivo debe ser una imagen');
    }

    if (file.size > 5 * 1024 * 1024) { // 5MB
      throw new Error('La imagen no debe superar los 5MB');
    }

    const snapshot = await uploadBytes(storageRef, file);
    console.log('uploadImage: Subida exitosa', snapshot);
    
    const downloadURL = await getDownloadURL(snapshot.ref);
    console.log('uploadImage: URL obtenida', downloadURL);
    
    return downloadURL;
  } catch (error: any) {
    console.error('Error detallado en uploadImage:', {
      error,
      code: error.code,
      message: error.message,
      serverResponse: error.serverResponse
    });
    
    // Mensajes de error más descriptivos
    if (error.code === 'storage/unauthorized') {
      throw new Error('No tienes permisos para subir imágenes. Verifica las reglas de Storage.');
    } else if (error.code === 'storage/canceled') {
      throw new Error('La subida fue cancelada.');
    } else if (error.code === 'storage/unknown' || error.code === 'storage/object-not-found') { // 'object-not-found' suele ser CORS
      throw new Error('Error de CORS o de red. Asegúrate de que la configuración CORS del bucket sea correcta.');
    }
    
    throw new Error(`Error al subir imagen: ${error.message}`);
  }
}
