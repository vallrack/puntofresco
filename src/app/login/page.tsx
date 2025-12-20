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

export default function LoginPage() {
  const [email, setEmail] = useState('vallrack67@gmail.com');
  const [password, setPassword] = useState('Agnusde9');
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

      // Check if user document exists, if not create it
      const userDocRef = doc(firestore, 'usuarios', user.uid);
      const userDocSnap = await getDoc(userDocRef);

      if (!userDocSnap.exists()) {
        // User document doesn't exist, create it.
        // Assign 'super_admin' role if the email matches.
        const userRole = email === 'vallrack67@gmail.com' ? 'super_admin' : 'empleado';
        await setDoc(userDocRef, {
          rol: userRole,
          email: user.email,
        });
        toast({
          title: 'Perfil creado',
          description: `Tu perfil ha sido creado con el rol: ${userRole}.`,
        });
      }
      
      toast({
        title: 'Inicio de sesión exitoso',
        description: 'Bienvenido de nuevo.',
      });
      router.push('/dashboard');

    } catch (err: any) {
      let errorMessage = 'Ocurrió un error al iniciar sesión.';
      switch (err.code) {
        case 'auth/user-not-found':
        case 'auth/wrong-password':
        case 'auth/invalid-credential':
          errorMessage = 'El correo electrónico o la contraseña son incorrectos.';
          break;
        case 'auth/invalid-email':
          errorMessage = 'El formato del correo electrónico no es válido.';
          break;
        case 'auth/configuration-not-found':
          errorMessage = 'El método de inicio de sesión no está habilitado. Contacta al administrador.';
          break;
        default:
          errorMessage = 'Ha ocurrido un problema inesperado. Por favor, inténtalo más tarde.';
          break;
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
    <div className="flex items-center justify-center min-h-screen bg-background p-4">
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
                placeholder="admin@puntofresco.com"
                required
                value={email}
                onChange={(e) => setEmail(e.target.value)}
              />
            </div>
            <div className="space-y-2">
              <div className="flex items-center">
                <Label htmlFor="password">Contraseña</Label>
                <Link
                  href="#"
                  className="ml-auto inline-block text-sm underline"
                >
                  ¿Olvidaste tu contraseña?
                </Link>
              </div>
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
        <CardFooter className="text-center text-sm">
          <p className="w-full">
            ¿No tienes una cuenta? Contacta al administrador.
          </p>
        </CardFooter>
      </Card>
    </div>
  );
}