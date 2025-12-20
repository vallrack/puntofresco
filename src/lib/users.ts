'use client';
import { createUserWithEmailAndPassword } from 'firebase/auth';
import { doc, setDoc, getDoc } from 'firebase/firestore';
import { initializeFirebase } from '@/firebase';

type NewUserData = {
  email: string;
  password?: string;
  rol: 'admin' | 'vendedor';
};

// Crear solo el documento en Firestore (esta función ahora es para casos de reparación)
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
export async function createUser(userData: NewUserData): Promise<any> {
  const { auth, firestore } = initializeFirebase();

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

    return user; // Devuelve el objeto de usuario si todo fue exitoso
  } catch (error: any) {
    console.error("Error creando usuario:", error);
    // Propaga el error para que el componente que llama lo maneje
    // El código de error será usado para mostrar un mensaje específico
    const newError: any = new Error(error.message);
    newError.code = error.code;
    throw newError;
  }
}
