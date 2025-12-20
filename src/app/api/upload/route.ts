// app/api/upload/route.ts
import { NextRequest, NextResponse } from 'next/server';
import { getAdminStorage } from '@/lib/firebase-admin';
import { randomUUID } from 'crypto';

export async function POST(request: NextRequest) {
  console.log('📤 API /upload - Petición recibida');

  try {
    // Parsear FormData
    const formData = await request.formData();
    const file = formData.get('file') as File;
    const userId = formData.get('userId') as string;

    console.log('📦 Datos recibidos:', {
      hasFile: !!file,
      fileName: file?.name,
      fileSize: file?.size,
      fileType: file?.type,
      userId,
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

    console.log('✅ Validaciones pasadas');

    // Convertir File a Buffer
    const bytes = await file.arrayBuffer();
    const buffer = Buffer.from(bytes);
    console.log('✅ Buffer creado:', buffer.length, 'bytes');

    // Obtener Storage
    console.log('📁 Obteniendo Storage...');
    const storage = getAdminStorage();
    const bucket = storage.bucket();
    console.log('✅ Bucket obtenido:', bucket.name);

    // Crear nombre único
    const timestamp = Date.now();
    const safeName = file.name.replace(/[^a-zA-Z0-9.-]/g, '_');
    const fileName = `${timestamp}-${safeName}`;
    const filePath = `products/${userId}/${fileName}`;

    console.log('📤 Subiendo archivo a:', filePath);

    // Subir archivo
    const fileRef = bucket.file(filePath);

    await fileRef.save(buffer, {
      contentType: file.type,
      metadata: {
        // Generar un token de descarga para poder acceder a la URL
        metadata: {
          firebaseStorageDownloadTokens: randomUUID(),
        },
      },
    });

    console.log('✅ Archivo subido exitosamente');

    // Construir la URL pública manualmente
    const publicUrl = `https://firebasestorage.googleapis.com/v0/b/${bucket.name}/o/${encodeURIComponent(filePath)}?alt=media&token=${fileRef.metadata.metadata.firebaseStorageDownloadTokens}`;

    console.log('✅ Upload completado:', publicUrl);

    return NextResponse.json({
      url: publicUrl,
      message: 'Imagen subida exitosamente',
    });
  } catch (error: any) {
    console.error('❌ Error en API /upload:', {
      message: error.message,
      stack: error.stack,
      code: error.code,
    });

    return NextResponse.json(
      {
        error: error.message || 'Error al subir la imagen',
        details: process.env.NODE_ENV === 'development' ? error.stack : undefined,
      },
      { status: 500 }
    );
  }
}
