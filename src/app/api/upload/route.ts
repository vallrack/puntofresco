// app/api/upload/route.ts
import { NextRequest, NextResponse } from 'next/server';
import { initializeApp, getApps, cert } from 'firebase-admin/app';
import { getStorage } from 'firebase-admin/storage';
import { randomUUID } from 'crypto';

// Verificar credenciales antes de inicializar
if (!process.env.FIREBASE_CLIENT_EMAIL || !process.env.FIREBASE_PRIVATE_KEY) {
  console.error('❌ Faltan las variables de entorno para las credenciales de Firebase Admin.');
}

// Inicializar Firebase Admin (solo una vez)
if (!getApps().length) {
  try {
    initializeApp({
      credential: cert({
        projectId: process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID,
        clientEmail: process.env.FIREBASE_CLIENT_EMAIL,
        privateKey: process.env.FIREBASE_PRIVATE_KEY?.replace(/\\n/g, '\n'),
      }),
      storageBucket: process.env.NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET,
    });
    console.log('Firebase Admin inicializado correctamente');
  } catch (error: any) {
    console.error('Error inicializando Firebase Admin:', error.message);
  }
}

export async function POST(request: NextRequest) {
  console.log('📤 Recibida petición de upload');
  
  if (!getApps().length) {
    return NextResponse.json(
      { error: 'Credenciales de servidor no configuradas correctamente.' },
      { status: 500 }
    );
  }

  try {
    // Parsear FormData
    const formData = await request.formData();
    const file = formData.get('file') as File;
    const userId = formData.get('userId') as string;
    
    console.log('📦 Datos recibidos:', {
      fileName: file?.name,
      fileSize: file?.size,
      fileType: file?.type,
      userId
    });

    // Validaciones
    if (!file) {
      console.error('❌ No se proporcionó archivo');
      return NextResponse.json(
        { error: 'No se proporcionó ningún archivo' },
        { status: 400 }
      );
    }

    if (!userId) {
      console.error('❌ No se proporcionó userId');
      return NextResponse.json(
        { error: 'No se proporcionó userId' },
        { status: 400 }
      );
    }

    // Validar tamaño (5MB max)
    if (file.size > 5 * 1024 * 1024) {
      console.error('❌ Archivo muy grande:', file.size);
      return NextResponse.json(
        { error: 'El archivo no debe superar los 5MB' },
        { status: 400 }
      );
    }

    // Validar tipo
    if (!file.type.startsWith('image/')) {
      console.error('❌ Tipo de archivo inválido:', file.type);
      return NextResponse.json(
        { error: 'Solo se permiten imágenes' },
        { status: 400 }
      );
    }

    console.log('✅ Validaciones pasadas, iniciando subida...');

    // Convertir File a Buffer
    const bytes = await file.arrayBuffer();
    const buffer = Buffer.from(bytes);

    // Obtener Storage bucket
    const storage = getStorage();
    const bucket = storage.bucket();

    // Crear nombre único
    const timestamp = Date.now();
    const safeName = file.name.replace(/[^a-zA-Z0-9.-]/g, '_');
    const fileName = `${timestamp}-${safeName}`;
    const filePath = `products/${userId}/${fileName}`;

    console.log('📁 Subiendo a:', filePath);

    // Crear referencia y subir
    const fileRef = bucket.file(filePath);
    
    await fileRef.save(buffer, {
      contentType: file.type,
      // Para generar URL pública firmada, se necesita un token.
      metadata: {
        metadata: {
          firebaseStorageDownloadTokens: randomUUID(),
        }
      },
    });

    console.log('✅ Archivo subido.');

    // Obtener URL firmada
    const [publicUrl] = await fileRef.getSignedUrl({
        action: 'read',
        expires: '01-01-2500', // Una fecha de expiración muy lejana
    });

    console.log('✅ URL firmada generada:', publicUrl);

    return NextResponse.json({ 
      url: publicUrl,
      message: 'Imagen subida exitosamente' 
    });

  } catch (error: any) {
    console.error('❌ Error en el endpoint /api/upload:', error);
    return NextResponse.json(
      { 
        error: error.message || 'Error interno del servidor al subir la imagen',
        details: error.stack 
      },
      { status: 500 }
    );
  }
}

// Configuración de Next.js para permitir el parseo de FormData
export const config = {
  api: {
    bodyParser: false,
  },
};