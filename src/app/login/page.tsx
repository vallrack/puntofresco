'use client';
import { Button } from '@/components/ui/button';
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { ShoppingBasket } from 'lucide-react';
import Link from 'next/link';
import { useState } from 'react';
import { signInWithEmailAndPassword } from 'firebase/auth';
import { doc, getDoc, setDoc } from 'firebase/firestore';
import { useRouter } from 'next/navigation';
import { useToast } from '@/hooks/use-toast';
import { initializeFirebase } from '@/firebase';
import AnimatedBackground from '@/components/animated-background';

export default function LoginPage() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const router = useRouter();
  const { toast } = useToast();

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');

    try {
      const { auth, firestore } = initializeFirebase();
      const userCredential = await signInWithEmailAndPassword(auth, email, password);
      const user = userCredential.user;

      const userDocRef = doc(firestore, 'usuarios', user.uid);
      const userDocSnap = await getDoc(userDocRef);

      const userData = userDocSnap.data();

      // Caso especial para el primer super_admin
      if (email === 'vallrack67@gmail.com' && !userDocSnap.exists()) {
        await setDoc(userDocRef, { 
            rol: 'super_admin', 
            email: user.email, 
            nombre: 'Super Admin' 
        });
      } else if (!userData || !userData.rol) {
        // Si el documento del usuario no existe o no tiene un rol asignado,
        // no tiene permisos para entrar.
        await auth.signOut();
        throw new Error('Tu cuenta está pendiente de aprobación por un administrador.');
      }
      
      // Si el usuario es el super_admin y no tiene nombre, se lo asignamos
      if (email === 'vallrack67@gmail.com' && userData && !userData.nombre) {
         await setDoc(userDocRef, { nombre: 'Super Admin' }, { merge: true });
      }

      toast({
        title: 'Inicio de sesión exitoso',
        description: 'Bienvenido de nuevo.',
      });
      router.push('/dashboard');

    } catch (err: any) {
      let errorMessage = 'Ocurrió un error al iniciar sesión.';
       if (err.message === 'Tu cuenta está pendiente de aprobación por un administrador.') {
          errorMessage = err.message;
       } else {
        switch (err.code) {
          case 'auth/user-not-found':
          case 'auth/wrong-password':
          case 'auth/invalid-credential':
            errorMessage = 'El correo electrónico o la contraseña son incorrectos.';
            break;
          case 'auth/invalid-email':
            errorMessage = 'El formato del correo electrónico no es válido.';
            break;
          case 'auth/user-disabled':
            errorMessage = 'Este usuario ha sido deshabilitado.';
            break;
          case 'auth/too-many-requests':
            errorMessage = 'Demasiados intentos de inicio de sesión. Inténtalo de nuevo más tarde.';
            break;
          case 'auth/configuration-not-found':
             errorMessage = 'El método de inicio de sesión no está habilitado en la consola de Firebase.';
             break;
          default:
            errorMessage = err.message || 'Ha ocurrido un problema inesperado. Por favor, inténtalo más tarde.';
            break;
        }
      }
      setError(errorMessage);
      toast({
        variant: 'destructive',
        title: 'Error al iniciar sesión',
        description: errorMessage,
      });
    }
  };

  return (
    <>
      <AnimatedBackground />
      <div className="flex items-center justify-center min-h-screen bg-transparent p-4 z-10 relative">
        <Card className="w-full max-w-sm mx-auto border-2 border-primary/20 shadow-lg shadow-primary/10">
          <CardHeader className="space-y-2 text-center">
            <div className="inline-block bg-primary p-3 rounded-full mx-auto shadow-md">
              <ShoppingBasket className="w-8 h-8 text-primary-foreground" />
            </div>
            <CardTitle className="text-2xl font-bold font-headline">
              Punto Fresco
            </CardTitle>
            <CardDescription>
              Ingresa tus credenciales para acceder al sistema.
            </CardDescription>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleLogin} className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="email">Email</Label>
                <Input
                  id="email"
                  type="email"
                  placeholder="tu@email.com"
                  required
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="password">Contraseña</Label>
                <Input
                  id="password"
                  type="password"
                  required
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                />
              </div>
              {error && (
                <p className="text-sm font-medium text-destructive">{error}</p>
              )}
              <Button type="submit" className="w-full font-semibold">
                Iniciar Sesión
              </Button>
            </form>
          </CardContent>
          <CardFooter className="flex flex-col gap-4 text-center text-sm">
             <p className="w-full">
              ¿Nuevo usuario?{" "}
              <Link href="/register" className="underline font-medium">
                Regístrate aquí
              </Link>
            </p>
            <Link
                href="#"
                className="text-sm underline text-muted-foreground"
              >
                ¿Olvidaste tu contraseña?
              </Link>
          </CardFooter>
        </Card>
      </div>
    </>
  );
}
