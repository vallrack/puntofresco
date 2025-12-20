'use client';

import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import * as z from 'zod';
import {
  Card,
  CardHeader,
  CardTitle,
  CardDescription,
  CardContent,
  CardFooter,
} from '@/components/ui/card';
import {
  Form,
  FormControl,
  FormDescription,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from '@/components/ui/form';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { useToast } from '@/hooks/use-toast';
import { useUser, useDoc, useFirestore } from '@/firebase';
import { doc, updateDoc } from 'firebase/firestore';
import { useEffect } from 'react';

const profileSchema = z.object({
  nombre: z.string().min(1, 'El nombre es requerido.'),
  telefono: z.string().optional(),
  email: z.string().email(),
});

type ProfileFormValues = z.infer<typeof profileSchema>;

export default function SettingsPage() {
  const { user } = useUser();
  const {
    data: userData,
    loading,
  } = useDoc<{ nombre: string; telefono?: string; email: string }>({
    path: 'usuarios',
    id: user?.uid,
  });
  const firestore = useFirestore();
  const { toast } = useToast();

  const form = useForm<ProfileFormValues>({
    resolver: zodResolver(profileSchema),
    defaultValues: {
      nombre: '',
      telefono: '',
      email: '',
    },
  });

  useEffect(() => {
    if (userData) {
      form.reset({
        nombre: userData.nombre || '',
        telefono: userData.telefono || '',
        email: userData.email || '',
      });
    }
  }, [userData, form]);

  const onSubmit = async (values: ProfileFormValues) => {
    if (!user || !firestore) {
      toast({
        variant: 'destructive',
        title: 'Error',
        description: 'No se pudo actualizar el perfil.',
      });
      return;
    }

    try {
      const userRef = doc(firestore, 'usuarios', user.uid);
      await updateDoc(userRef, {
        nombre: values.nombre,
        telefono: values.telefono,
      });
      toast({
        title: 'Éxito',
        description: 'Tu perfil ha sido actualizado.',
      });
    } catch (error) {
      console.error('Error updating profile:', error);
      toast({
        variant: 'destructive',
        title: 'Error',
        description: 'Ocurrió un problema al actualizar tu perfil.',
      });
    }
  };

  if (loading) {
    return <p>Cargando perfil...</p>;
  }

  if (!userData) {
    return (
       <Card>
        <CardHeader>
            <CardTitle>Perfil no encontrado</CardTitle>
            <CardDescription>No pudimos cargar la información de tu perfil.</CardDescription>
        </CardHeader>
       </Card>
    );
  }

  return (
    <Form {...form}>
      <form onSubmit={form.handleSubmit(onSubmit)}>
        <Card>
          <CardHeader>
            <CardTitle>Configuración de la Cuenta</CardTitle>
            <CardDescription>
              Aquí puedes editar la información de tu perfil.
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <FormField
              control={form.control}
              name="nombre"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Nombre Completo</FormLabel>
                  <FormControl>
                    <Input placeholder="Tu nombre" {...field} />
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
                  <FormLabel>Teléfono</FormLabel>
                  <FormControl>
                    <Input placeholder="Tu número de teléfono" {...field} />
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
                    <Input placeholder="Tu email" {...field} disabled />
                  </FormControl>
                  <FormDescription>
                    El email no se puede cambiar.
                  </FormDescription>
                  <FormMessage />
                </FormItem>
              )}
            />
          </CardContent>
          <CardFooter className="border-t px-6 py-4">
            <Button type="submit" disabled={form.formState.isSubmitting}>
                {form.formState.isSubmitting ? 'Guardando...' : 'Guardar Cambios'}
            </Button>
          </CardFooter>
        </Card>
      </form>
    </Form>
  );
}
