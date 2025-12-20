// lib/firebase-admin.ts
import { initializeApp, getApps, cert, App } from 'firebase-admin/app';
import { getStorage } from 'firebase-admin/storage';

let adminApp: App | undefined;

export function getAdminApp() {
  // Si ya existe, retornarlo
  if (adminApp) {
    return adminApp;
  }

  // Si ya hay apps inicializadas, usar la primera
  const existingApps = getApps();
  if (existingApps.length > 0) {
    adminApp = existingApps[0];
    return adminApp;
  }

  // Validar que existan las variables de entorno
  const projectId = process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID;
  const clientEmail = process.env.FIREBASE_CLIENT_EMAIL;
  const privateKey = process.env.FIREBASE_PRIVATE_KEY;
  const storageBucket = process.env.NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET;

  if (!projectId || !clientEmail || !privateKey || !storageBucket) {
    console.error('❌ Variables de entorno faltantes:', {
      projectId: !!projectId,
      clientEmail: !!clientEmail,
      privateKey: !!privateKey,
      storageBucket: !!storageBucket,
    });
    throw new Error(
      'Faltan variables de entorno para Firebase Admin. Verifica .env.local'
    );
  }

  try {
    console.log('🔧 Inicializando Firebase Admin...');
    
    adminApp = initializeApp({
      credential: cert({
        projectId,
        clientEmail,
        privateKey: privateKey.replace(/\\n/g, '\n'),
      }),
      storageBucket,
    });

    console.log('✅ Firebase Admin inicializado correctamente');
    return adminApp;
  } catch (error) {
    console.error('❌ Error inicializando Firebase Admin:', error);
    throw error;
  }
}

export function getAdminStorage() {
  const app = getAdminApp();
  return getStorage(app);
}
