'use client';
import { createUserWithEmailAndPassword } from 'firebase/auth';
import { doc, setDoc } from 'firebase/firestore';
import { initializeFirebase } from '@/firebase';

type NewUserData = {
  nombre: string;
  email: string;
  telefono?: string;
  password?: string;
  rol: 'admin' | 'vendedor'; // Rol es requerido cuando lo crea un admin
};

// Crear un nuevo usuario en Auth y Firestore (solo para super_admin)
export async function createUser(userData: NewUserData): Promise<any> {
  const { auth, firestore } = initializeFirebase();

  if (!userData.password) {
    throw new Error('La contraseña es obligatoria para crear un nuevo usuario.');
  }

  try {
    // 1. Crear el usuario en Firebase Authentication
    // Esta llamada fallará si el email ya existe, lo cual es manejado en la UI
    const userCredential = await createUserWithEmailAndPassword(auth, userData.email, userData.password);
    const user = userCredential.user;

    // 2. Crear el documento del usuario en Firestore. 
    // Las reglas de seguridad se encargarán de validar si el rol es permitido.
    const userDocRef = doc(firestore, 'usuarios', user.uid);
    await setDoc(userDocRef, {
      nombre: userData.nombre,
      email: userData.email,
      telefono: userData.telefono || '',
      rol: userData.rol, // El rol es asignado directamente
    });

    return user; // Devuelve el objeto de usuario si todo fue exitoso
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
  }
}
