'use client';
import { useState } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import * as z from 'zod';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter, DialogClose } from '@/components/ui/dialog';
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from '@/components/ui/form';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { useFirestore, useUser } from '@/firebase';
import { useToast } from '@/hooks/use-toast';
import type { Product } from '@/lib/types';
import { runTransaction, doc, collection, serverTimestamp } from 'firebase/firestore';

const lossSchema = z.object({
  cantidad: z.coerce.number().int().min(1, 'La cantidad debe ser al menos 1.'),
  motivo: z.string().min(3, 'El motivo es requerido.'),
});

type LossFormValues = z.infer<typeof lossSchema>;

interface RegisterLossDialogProps {
  isOpen: boolean;
  onClose: () => void;
  product: Product;
  onLossRegistered: () => void;
}

export function RegisterLossDialog({ isOpen, onClose, product, onLossRegistered }: RegisterLossDialogProps) {
  const { toast } = useToast();
  const firestore = useFirestore();
  const { user } = useUser();

  const form = useForm<LossFormValues>({
    resolver: zodResolver(lossSchema),
    defaultValues: {
      cantidad: 1,
      motivo: 'Dañado',
    },
  });

  const onSubmit = async (values: LossFormValues) => {
    if (!firestore || !user) {
      toast({ variant: 'destructive', title: 'Error', description: 'No se pudo registrar la merma.' });
      return;
    }

    if (values.cantidad > product.stock) {
      form.setError('cantidad', { message: `No puedes dar de baja más del stock actual (${product.stock}).` });
      return;
    }
    
    const productRef = doc(firestore, 'productos', product.id);
    const mermaRef = doc(collection(firestore, 'mermas'));

    try {
      await runTransaction(firestore, async (transaction) => {
        const productDoc = await transaction.get(productRef);
        if (!productDoc.exists()) {
          throw new Error('El producto no existe.');
        }

        const currentStock = productDoc.data().stock;
        const newStock = currentStock - values.cantidad;

        if (newStock < 0) {
            throw new Error('La cantidad a dar de baja excede el stock actual.');
        }

        // 1. Actualizar el stock del producto
        transaction.update(productRef, { stock: newStock });

        // 2. Registrar la merma
        transaction.set(mermaRef, {
          productId: product.id,
          productName: product.nombre,
          cantidad: values.cantidad,
          motivo: values.motivo,
          fecha: serverTimestamp(),
          registradoPor: user.uid,
        });
      });

      toast({ title: 'Merma registrada', description: `Se dieron de baja ${values.cantidad} unidades de ${product.nombre}.` });
      onLossRegistered();
      onClose();

    } catch (error: any) {
      console.error('Error registrando merma:', error);
      toast({ variant: 'destructive', title: 'Error', description: error.message || 'No se pudo completar la operación.' });
    }
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Registrar Merma para: {product.nombre}</DialogTitle>
          <DialogDescription>
            Da de baja unidades del inventario por daño, vencimiento, etc. Esta acción no se puede deshacer.
          </DialogDescription>
        </DialogHeader>
        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4 py-4">
            <p className='text-sm'>Stock actual: <span className='font-bold'>{product.stock}</span> unidades.</p>
            <FormField
              control={form.control}
              name="cantidad"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Cantidad a dar de baja</FormLabel>
                  <FormControl>
                    <Input type="number" {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            <FormField
              control={form.control}
              name="motivo"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Motivo</FormLabel>
                  <Select onValueChange={field.onChange} defaultValue={field.value}>
                    <FormControl>
                      <SelectTrigger>
                        <SelectValue placeholder="Selecciona un motivo..." />
                      </SelectTrigger>
                    </FormControl>
                    <SelectContent>
                      <SelectItem value="Dañado">Dañado</SelectItem>
                      <SelectItem value="Vencido">Vencido</SelectItem>
                      <SelectItem value="Robo">Robo</SelectItem>
                      <SelectItem value="Otro">Otro</SelectItem>
                    </SelectContent>
                  </Select>
                  <FormMessage />
                </FormItem>
              )}
            />
             <DialogFooter>
                <DialogClose asChild>
                    <Button type="button" variant="secondary">Cancelar</Button>
                </DialogClose>
                <Button type="submit" variant="destructive" disabled={form.formState.isSubmitting}>
                    {form.formState.isSubmitting ? "Registrando..." : "Confirmar Baja"}
                </Button>
            </DialogFooter>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  );
}
