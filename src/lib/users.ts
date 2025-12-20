'use client';
import { createUserWithEmailAndPassword } from 'firebase/auth';
import { doc, setDoc } from 'firebase/firestore';
import { initializeFirebase } from '@/firebase';

type NewUserData = {
  email: string;
  password?: string;
  rol: 'admin' | 'vendedor';
};

// Crear un nuevo usuario en Auth y Firestore
export async function createUser(userData: NewUserData) {
  const { auth, firestore } = initializeFirebase();

  // Es necesario un password para crear el usuario en Firebase Auth
  if (!userData.password) {
    throw new Error('La contraseña es obligatoria para crear un nuevo usuario.');
  }

  try {
    // 1. Crear el usuario en Firebase Authentication
    const userCredential = await createUserWithEmailAndPassword(auth, userData.email, userData.password);
    const user = userCredential.user;

    // 2. Crear el documento del usuario en Firestore
    const userDocRef = doc(firestore, 'usuarios', user.uid);
    await setDoc(userDocRef, {
      email: userData.email,
      rol: userData.rol,
    });

    return user.uid;
  } catch (error: any) {
    console.error("Error creando usuario:", error);
    if (error.code === 'auth/email-already-in-use') {
      throw new Error('El correo electrónico ya está en uso por otra cuenta.');
    }
     if (error.code === 'auth/weak-password') {
      throw new Error('La contraseña es demasiado débil.');
    }
    throw new Error('Ocurrió un error inesperado al crear el usuario.');
  }
}
