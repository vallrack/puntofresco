'use client';
import { initializeApp, getApp, getApps, type FirebaseApp } from 'firebase/app';
import { getAuth, type Auth } from 'firebase/auth';
import { getFirestore, type Firestore } from 'firebase/firestore';
import { getStorage, type FirebaseStorage } from "firebase/storage";
import { firebaseConfig } from './config';

// Provides a singleton pattern for firebase services.
const getFirebase = () => {
  const apps = getApps();
  if (apps.length > 0) {
    const app = getApp();
    const auth = getAuth(app);
    const firestore = getFirestore(app);
    const storage = getStorage(app);
    return { app, auth, firestore, storage };
  } else {
    const app = initializeApp(firebaseConfig);
    const auth = getAuth(app);
    const firestore = getFirestore(app);
    const storage = getStorage(app);
    return { app, auth, firestore, storage };
  }
};

let app: FirebaseApp;
let auth: Auth;
let firestore: Firestore;
let storage: FirebaseStorage;

export function initializeFirebase() {
  if (getApps().length) {
    app = getApp();
    auth = getAuth(app);
    firestore = getFirestore(app);
    storage = getStorage(app);
  } else {
    app = initializeApp(firebaseConfig);
    auth = getAuth(app);
    firestore = getFirestore(app);
    storage = getStorage(app);
  }

  return { app, auth, firestore, storage };
}

export {
  useUser,
} from './auth/use-user';
export {
  useCollection,
} from './firestore/use-collection';
export {
  useDoc,
} from './firestore/use-doc';
export {
  FirebaseProvider,
  useFirebaseApp,
  useFirestore,
  useAuth,
  useStorage,
} from './provider';
export { FirebaseClientProvider } from './client-provider';
