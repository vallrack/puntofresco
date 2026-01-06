'use client';
import { createUserWithEmailAndPassword, getAuth, signOut } from 'firebase/auth';
import { doc, setDoc } from 'firebase/firestore';
import { initializeFirebase } from '@/firebase';
import { initializeApp } from 'firebase/app';

type NewUserData = {
  nombre: string;
  email: string;
  telefono?: string;
  password?: string;
  rol: 'admin' | 'vendedor'; // Rol es requerido cuando lo crea un admin
};

// Crear un nuevo usuario en Auth y Firestore
export async function createUser(userData: NewUserData): Promise<any> {
  const { firestore, app } = initializeFirebase();

  if (!userData.password) {
    throw new Error('La contraseña es obligatoria para crear un nuevo usuario.');
  }
  
  // Obtener la configuración de Firebase desde la app principal
  const firebaseConfig = app.options;

  // Crear una instancia secundaria de Firebase SOLO para crear el usuario
  let secondaryApp;
  let secondaryAuth;


  try {
    // Usamos un nombre único para la app secundaria para evitar conflictos
    const appName = `secondary-auth-${Date.now()}`;
    secondaryApp = initializeApp(firebaseConfig, appName);
    secondaryAuth = getAuth(secondaryApp);

    // 1. Crear el usuario en Firebase Auth usando la instancia secundaria
    const userCredential = await createUserWithEmailAndPassword(secondaryAuth, userData.email, userData.password);
    const user = userCredential.user;

    // 2. Crear el documento del usuario en Firestore usando la instancia principal
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
      // 4. Asegurarse de cerrar la sesión en la instancia secundaria si existe
      if (secondaryAuth) {
         await signOut(secondaryAuth);
      }
  }
}
