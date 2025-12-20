'use client';

/**
 * Sube una imagen a Firebase Storage a través de una API route del servidor.
 * Esto evita problemas de CORS al hacer la petición desde el servidor.
 */
export async function uploadImage(file: File, path: string): Promise<string> {
  console.log('🚀 uploadImage: Iniciando subida...', {
    fileName: file.name,
    fileSize: file.size,
    fileType: file.type,
    path
  });

  // Extraer userId del path (formato: "products/USER_ID")
  const userId = path.split('/')[1];
  
  if (!userId) {
    throw new Error('No se pudo extraer el userId del path');
  }

  // Validaciones del cliente
  if (!file.type.startsWith('image/')) {
    throw new Error('El archivo debe ser una imagen (PNG, JPG, etc.)');
  }

  if (file.size > 5 * 1024 * 1024) {
    throw new Error('La imagen no debe superar los 5MB');
  }

  // Crear FormData
  const formData = new FormData();
  formData.append('file', file);
  formData.append('userId', userId);

  try {
    console.log('📡 Enviando petición a /api/upload...');
    
    const response = await fetch('/api/upload', {
      method: 'POST',
      body: formData,
    });

    console.log('📥 Respuesta recibida:', response.status, response.statusText);

    if (!response.ok) {
      const errorData = await response.json().catch(() => ({ error: 'Error desconocido del servidor' }));
      console.error('❌ Error del servidor:', errorData);
      throw new Error(errorData.error || `Error ${response.status}: ${response.statusText}`);
    }

    const data = await response.json();
    console.log('✅ Upload exitoso:', data);

    if (!data.url) {
      throw new Error('El servidor no devolvió una URL válida');
    }

    return data.url;

  } catch (error: any) {
    console.error('❌ Error en uploadImage:', error);
    
    // Mensajes de error más amigables
    if (error.message.includes('fetch')) {
      throw new Error('No se pudo conectar con el servidor. Verifica tu conexión.');
    }
    
    throw new Error(error.message || 'Error desconocido al subir la imagen');
  }
}
