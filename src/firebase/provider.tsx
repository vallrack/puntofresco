'use client';
import {
  createContext,
  useContext,
  type ReactNode,
} from 'react';

import type { FirebaseApp } from 'firebase/app';
import type { Auth } from 'firebase/auth';
import type { Firestore } from 'firebase/firestore';

import { initializeFirebase } from './index';

// Create a client-side, initial-only, Firebase provider.
//
// Firebase should only be initialized once, so we need to guard against
// re-initialization. This is especially true in a Next.js app with RSC,
// where components can be rendered multiple times.
let firebaseInitialized = false;

type FirebaseContextValue = {
  app: FirebaseApp;
  auth: Auth;
  firestore: Firestore;
};

const FirebaseContext = createContext<FirebaseContextValue | undefined>(
  undefined,
);

/**
 * @name FirebaseProvider
 * @description A provider that initializes Firebase and makes it available to
 * all child components. This is a client-side only component.
 */
export function FirebaseProvider({ children }: { children: ReactNode }) {
  if (!firebaseInitialized) {
    initializeFirebase();
    firebaseInitialized = true;
  }

  const { app, auth, firestore } = initializeFirebase();

  return (
    <FirebaseContext.Provider value={{ app, auth, firestore }}>
      {children}
    </FirebaseContext.Provider>
  );
}

/**
 * @name useFirebase
 * @description A hook that returns the Firebase context value.
 * @returns The Firebase context value.
 */
export function useFirebase() {
  const context = useContext(FirebaseContext);

  if (context === undefined) {
    throw new Error('useFirebase must be used within a FirebaseProvider');
  }

  return context;
}

/**
 * @name useFirebaseApp
 * @description A hook that returns the Firebase app instance.
 * @returns The Firebase app instance.
 */
export function useFirebaseApp() {
  const { app } = useFirebase();

  return app;
}

/**
 * @name useAuth
 * @description A hook that returns the Firebase auth instance.
 * @returns The Firebase auth instance.
 */
export function useAuth() {
  const { auth } = useFirebase();

  return auth;
}

/**
 * @name useFirestore
 * @description A hook that returns the Firebase firestore instance.
 * @returns The Firebase firestore instance.
 */
export function useFirestore() {
  const { firestore } = useFirebase();

  return firestore;
}