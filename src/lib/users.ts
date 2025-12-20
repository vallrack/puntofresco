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
// Devuelve el objeto de usuario en caso de éxito, o un código de error en caso de fallo.
export async function createUser(userData: NewUserData): Promise<any> {
  const { auth, firestore } = initializeFirebase();

  if (!userData.password) {
    throw new Error('La contraseña es obligatoria para crear un nuevo usuario.');
  }

  try {
    const userCredential = await createUserWithEmailAndPassword(auth, userData.email, userData.password);
    const user = userCredential.user;

    const userDocRef = doc(firestore, 'usuarios', user.uid);
    await setDoc(userDocRef, {
      email: userData.email,
      rol: userData.rol,
    });

    return user; 
  } catch (error: any) {
    console.error("Error creando usuario:", error);
    // Devuelve el código de error para que el componente que llama lo maneje
    if (error.code === 'auth/email-already-in-use' || error.code === 'auth/weak-password') {
       const newError: any = new Error(error.message);
       newError.code = error.code;
       throw newError;
    }
    throw new Error('Ocurrió un error inesperado al crear el usuario.');
  }
}
