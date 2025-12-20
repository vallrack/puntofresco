'use client';
import { Button } from '@/components/ui/button';
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from '@/components/ui/form';
import { Input } from '@/components/ui/input';
import { ShoppingBasket } from 'lucide-react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { useToast } from '@/hooks/use-toast';
import AnimatedBackground from '@/components/animated-background';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import * as z from 'zod';
import { createUser } from '@/lib/users';

const registerSchema = z.object({
  nombre: z.string().min(3, 'El nombre debe tener al menos 3 caracteres.'),
  email: z.string().email('Por favor, introduce un email válido.'),
  telefono: z.string().optional(),
  password: z.string().min(6, 'La contraseña debe tener al menos 6 caracteres.'),
});

type RegisterFormValues = z.infer<typeof registerSchema>;

export default function RegisterPage() {
  const router = useRouter();
  const { toast } = useToast();

  const form = useForm<RegisterFormValues>({
    resolver: zodResolver(registerSchema),
    defaultValues: {
      nombre: '',
      email: '',
      telefono: '',
      password: '',
    },
  });

  const onSubmit = async (values: RegisterFormValues) => {
    try {
      await createUser({
        nombre: values.nombre,
        email: values.email,
        telefono: values.telefono,
        password: values.password,
        // El rol se asigna por defecto en la función `createUser`
      });
      
      toast({
        title: '¡Registro Exitoso!',
        description: 'Tu cuenta ha sido creada. Ahora puedes iniciar sesión.',
      });
      router.push('/login');

    } catch (error: any) {
      toast({
        variant: 'destructive',
        title: 'Error en el registro',
        description: error.message || 'No se pudo completar el registro.',
      });
    }
  };

  return (
    <>
      <AnimatedBackground />
      <div className="flex items-center justify-center min-h-screen bg-transparent p-4 z-10 relative">
        <Card className="w-full max-w-md mx-auto border-2 border-primary/20 shadow-lg shadow-primary/10">
          <CardHeader className="space-y-2 text-center">
            <div className="inline-block bg-primary p-3 rounded-full mx-auto shadow-md">
              <ShoppingBasket className="w-8 h-8 text-primary-foreground" />
            </div>
            <CardTitle className="text-2xl font-bold font-headline">
              Crear una Cuenta
            </CardTitle>
            <CardDescription>
              Regístrate para empezar a gestionar tu punto de venta.
            </CardDescription>
          </CardHeader>
          <CardContent>
            <Form {...form}>
              <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
                <FormField
                  control={form.control}
                  name="nombre"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Nombre Completo</FormLabel>
                      <FormControl>
                        <Input placeholder="Ej: Maria Lopez" {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                 <FormField
                  control={form.control}
                  name="email"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Email</FormLabel>
                      <FormControl>
                        <Input type="email" placeholder="tu@email.com" {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                 <FormField
                  control={form.control}
                  name="telefono"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Teléfono (Opcional)</FormLabel>
                      <FormControl>
                        <Input placeholder="Ej: 55 1234 5678" {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                <FormField
                  control={form.control}
                  name="password"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Contraseña</FormLabel>
                      <FormControl>
                        <Input type="password" placeholder="••••••" {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <Button type="submit" className="w-full font-semibold" disabled={form.formState.isSubmitting}>
                  {form.formState.isSubmitting ? 'Registrando...' : 'Crear Cuenta'}
                </Button>
              </form>
            </Form>

            <div className="mt-6 text-center text-sm">
              ¿Ya tienes una cuenta?{" "}
              <Link href="/login" className="underline font-medium">
                Inicia sesión aquí
              </Link>
            </div>
          </CardContent>
        </Card>
      </div>
    </>
  );
}
