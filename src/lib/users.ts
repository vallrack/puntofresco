'use client';
import { createUserWithEmailAndPassword } from 'firebase/auth';
import { doc, setDoc, getDoc } from 'firebase/firestore';
import { initializeFirebase } from '@/firebase';

type NewUserData = {
  email: string;
  password?: string;
  rol: 'admin' | 'vendedor';
};

// Crear solo el documento en Firestore
export async function createUserDocument(uid: string, email: string, rol: 'admin' | 'vendedor') {
  const { firestore } = initializeFirebase();
  const userDocRef = doc(firestore, 'usuarios', uid);
  
  const docSnap = await getDoc(userDocRef);
  if (docSnap.exists()) {
    throw new Error('Un perfil para este usuario ya existe en la base de datos.');
  }

  await setDoc(userDocRef, {
    email: email,
    rol: rol,
  });
}


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

    return user; // Devolver el objeto de usuario completo
  } catch (error: any) {
    console.error("Error creando usuario:", error);
    if (error.code === 'auth/email-already-in-use') {
       const newError: any = new Error('El correo electrónico ya está en uso por otra cuenta.');
       newError.code = 'auth/email-already-in-use';
       throw newError;
    }
     if (error.code === 'auth/weak-password') {
      throw new Error('La contraseña es demasiado débil.');
    }
    throw new Error('Ocurrió un error inesperado al crear el usuario.');
  }
}
