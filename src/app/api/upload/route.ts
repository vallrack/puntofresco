// app/api/upload/route.ts
import { NextRequest, NextResponse } from 'next/server';
import { getAdminStorage } from '@/lib/firebase-admin';
import { randomUUID } from 'crypto';

export async function POST(request: NextRequest) {
  console.log('📤 API /upload - Petición recibida');

  try {
    const formData = await request.formData();
    const file = formData.get('file') as File;
    const userId = formData.get('userId') as string;

    if (!file) {
      console.error('❌ No se proporcionó archivo');
      return NextResponse.json({ error: 'No se proporcionó ningún archivo' }, { status: 400 });
    }
    if (!userId) {
      console.error('❌ No se proporcionó userId');
      return NextResponse.json({ error: 'No se proporcionó userId' }, { status: 400 });
    }

    const bytes = await file.arrayBuffer();
    const buffer = Buffer.from(bytes);
    
    console.log('✅ Validaciones pasadas');

    const storage = getAdminStorage();
    const bucket = storage.bucket();
    console.log('✅ Bucket obtenido:', bucket.name);

    const fileName = `${Date.now()}-${file.name.replace(/[^a-zA-Z0-9.-]/g, '_')}`;
    const filePath = `products/${userId}/${fileName}`;
    const fileRef = bucket.file(filePath);

    const downloadToken = randomUUID();

    console.log('📤 Subiendo archivo a:', filePath);
    await fileRef.save(buffer, {
      contentType: file.type,
      metadata: {
        metadata: {
          firebaseStorageDownloadTokens: downloadToken,
        },
      },
    });

    const publicUrl = `https://firebasestorage.googleapis.com/v0/b/${bucket.name}/o/${encodeURIComponent(filePath)}?alt=media&token=${downloadToken}`;

    console.log('✅ Upload completado:', publicUrl);

    return NextResponse.json({ url: publicUrl, message: 'Imagen subida exitosamente' });
  } catch (error: any) {
    console.error('❌ Error en API /upload:', {
      message: error.message,
      stack: error.stack,
    });
    return NextResponse.json(
      { error: 'Error interno del servidor al subir la imagen.', details: error.message },
      { status: 500 }
    );
  }
}