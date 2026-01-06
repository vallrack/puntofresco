'use client';
import { createUserWithEmailAndPassword, getAuth, signOut } from 'firebase/auth';
import { doc, setDoc } from 'firebase/firestore';
import { initializeFirebase } from '@/firebase';
import { initializeApp } from 'firebase/app';
import { firebaseConfig } from '@/firebase/config';

type NewUserData = {
  nombre: string;
  email: string;
  telefono?: string;
  password?: string;
  rol: 'admin' | 'vendedor'; // Rol es requerido cuando lo crea un admin
};

// Crear un nuevo usuario en Auth y Firestore
export async function createUser(userData: NewUserData): Promise<any> {
  const { firestore } = initializeFirebase(); // Instancia principal para Firestore

  if (!userData.password) {
    throw new Error('La contraseña es obligatoria para crear un nuevo usuario.');
  }

  // 1. Crear una instancia de app secundaria para no afectar la sesión del admin
  const secondaryApp = initializeApp(firebaseConfig, `secondary-auth-${Date.now()}`);
  const secondaryAuth = getAuth(secondaryApp);

  try {
    // 2. Crear el usuario en Firebase Auth usando la instancia secundaria
    const userCredential = await createUserWithEmailAndPassword(secondaryAuth, userData.email, userData.password);
    const user = userCredential.user;

    // 3. Crear el documento del usuario en Firestore usando la instancia principal
    // El admin sigue logueado en la instancia principal, por lo que tiene permisos
    const userDocRef = doc(firestore, 'usuarios', user.uid);
    await setDoc(userDocRef, {
      nombre: userData.nombre,
      email: userData.email,
      telefono: userData.telefono || '',
      rol: userData.rol,
    });
    
    // Devolvemos el objeto de usuario si todo fue exitoso
    return user;

  } catch (error: any) {
    console.error("Error creando usuario:", error);
    
    let friendlyMessage = 'Ocurrió un error inesperado al crear el usuario.';
    if (error.code === 'auth/email-already-in-use') {
        friendlyMessage = 'El correo electrónico ya está en uso por otra cuenta.';
    } else if (error.code === 'auth/weak-password') {
        friendlyMessage = 'La contraseña es demasiado débil (mínimo 6 caracteres).';
    }

    // Propaga un error con un mensaje amigable
    throw new Error(friendlyMessage);
  } finally {
      // 4. Asegurarse de cerrar la sesión en la instancia secundaria
      await signOut(secondaryAuth);
  }
}
