'use client';
import { useState, useMemo, useEffect } from 'react';
import { useForm, useFieldArray } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import * as z from 'zod';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter, DialogClose } from '@/components/ui/dialog';
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from '@/components/ui/form';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Command, CommandInput, CommandList, CommandEmpty, CommandGroup, CommandItem } from '@/components/ui/command';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Card, CardContent } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { useCollection, useFirestore } from '@/firebase';
import type { Supplier, Product } from '@/lib/types';
import { Trash2, ShoppingCart } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { processPurchase } from '@/lib/purchases';

const purchaseItemSchema = z.object({
  productId: z.string(),
  nombre: z.string(),
  cantidad: z.coerce.number().min(1),
  costoUnitario: z.coerce.number().min(0),
});

const purchaseSchema = z.object({
  proveedorId: z.string().min(1, 'Selecciona un proveedor'),
  items: z.array(purchaseItemSchema).min(1, 'Agrega al menos un producto'),
});

type PurchaseFormValues = z.infer<typeof purchaseSchema>;

interface RegisterPurchaseDialogProps {
    isOpen: boolean;
    onClose: () => void;
    onPurchaseRegistered: () => void;
}

export default function RegisterPurchaseDialog({ isOpen, onClose, onPurchaseRegistered }: RegisterPurchaseDialogProps) {
  const { data: suppliers, loading: loadingSuppliers } = useCollection<Supplier>({ path: 'proveedores' });
  const { data: products, loading: loadingProducts } = useCollection<Product>({ path: 'productos' });
  const [productSearchTerm, setProductSearchTerm] = useState('');
  const { toast } = useToast();
  const firestore = useFirestore();

  const form = useForm<PurchaseFormValues>({
    resolver: zodResolver(purchaseSchema),
    defaultValues: { proveedorId: '', items: [] },
  });

  const { fields, append, remove } = useFieldArray({
    control: form.control,
    name: 'items',
  });
  
  const currentItems = form.watch('items');
  const totalGeneral = useMemo(() => {
    return currentItems.reduce((acc, item) => acc + (item.cantidad * item.costoUnitario), 0);
  }, [currentItems]);

  const filteredProducts = useMemo(() => {
    if (!products) return [];
    if (!productSearchTerm) return [];
    const currentItemIds = fields.map(item => item.productId);
    return products.filter(p => 
      !currentItemIds.includes(p.id) &&
      (p.nombre.toLowerCase().includes(productSearchTerm.toLowerCase()) || 
       p.sku.toLowerCase().includes(productSearchTerm.toLowerCase()))
    ).slice(0, 5);
  }, [products, productSearchTerm, fields]);

  const addProductToPurchase = (product: Product) => {
    append({
      productId: product.id,
      nombre: product.nombre,
      cantidad: 1,
      costoUnitario: product.precioCompra,
    });
    setProductSearchTerm('');
  };

  const onSubmit = async (values: PurchaseFormValues) => {
    if (!firestore) return;

    try {
      const prov = suppliers?.find(s => s.id === values.proveedorId);
      
      const purchaseData = {
        proveedorId: values.proveedorId,
        proveedorNombre: prov?.nombre || "Desconocido",
        total: totalGeneral,
        items: values.items.map(item => ({
          ...item,
          subtotal: item.cantidad * item.costoUnitario
        }))
      };

      await processPurchase(firestore, purchaseData);
      toast({ title: 'Compra registrada', description: 'El stock ha sido actualizado.' });
      onPurchaseRegistered();
      onClose();
    } catch (error: any) {
      toast({ variant: 'destructive', title: 'Error', description: error.message });
    }
  };
  
  useEffect(() => {
    if (!isOpen) {
        form.reset({
            proveedorId: '',
            items: [],
        });
        setProductSearchTerm('');
    }
  }, [isOpen, form]);


  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-4xl">
        <DialogHeader>
          <DialogTitle>Registrar Compra</DialogTitle>
        </DialogHeader>
        
        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6 py-4">
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
               <FormField
                control={form.control}
                name="proveedorId"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Proveedor</FormLabel>
                    <Select onValueChange={field.onChange} defaultValue={field.value}>
                      <FormControl>
                        <SelectTrigger>
                          <SelectValue placeholder="Selecciona un proveedor" />
                        </SelectTrigger>
                      </FormControl>
                      <SelectContent>
                        {loadingSuppliers ? (
                            <SelectItem value="loading" disabled>Cargando...</SelectItem>
                        ) : (
                          suppliers?.map((s) => (
                            <SelectItem key={s.id} value={s.id}>
                              {s.nombre}
                            </SelectItem>
                          ))
                        )}
                      </SelectContent>
                    </Select>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <div className="md:col-span-2">
                 <FormLabel>Buscar Producto</FormLabel>
                 <Command shouldFilter={false}>
                    <CommandInput 
                        placeholder="Buscar por nombre o SKU..." 
                        value={productSearchTerm}
                        onValueChange={setProductSearchTerm}
                    />
                    <CommandList>
                        {loadingProducts && <CommandItem>Cargando productos...</CommandItem>}
                        {filteredProducts.length === 0 && productSearchTerm && <CommandEmpty>No se encontraron productos.</CommandEmpty>}
                        {filteredProducts.length > 0 && (
                            <CommandGroup heading="Resultados">
                                {filteredProducts.map(p => (
                                    <CommandItem key={p.id} onSelect={() => addProductToPurchase(p)} value={p.nombre}>
                                        {p.nombre} ({p.sku})
                                    </CommandItem>
                                ))}
                            </CommandGroup>
                        )}
                    </CommandList>
                 </Command>
              </div>
            </div>

            <Card>
              <CardContent className="p-0">
                <Table>
                    <TableHeader>
                    <TableRow>
                        <TableHead className="w-[50%]">Producto</TableHead>
                        <TableHead className="w-24">Cant.</TableHead>
                        <TableHead className="w-32">Costo U.</TableHead>
                        <TableHead className="text-right">Subtotal</TableHead>
                        <TableHead className="w-[50px]"></TableHead>
                    </TableRow>
                    </TableHeader>
                    <TableBody>
                    {fields.length === 0 ? (
                        <TableRow>
                            <TableCell colSpan={5} className="h-24 text-center">
                                <ShoppingCart className="mx-auto h-8 w-8 text-muted-foreground" />
                                <p className="text-muted-foreground mt-2">Agrega productos a la compra</p>
                            </TableCell>
                        </TableRow>
                    ) : (
                        fields.map((item, index) => {
                            const sub = form.watch(`items.${index}.cantidad`) * form.watch(`items.${index}.costoUnitario`);
                            return (
                            <TableRow key={item.id}>
                                <TableCell className="font-medium">{item.nombre}</TableCell>
                                <TableCell><Input type="number" {...form.register(`items.${index}.cantidad`)} className="h-8" /></TableCell>
                                <TableCell><Input type="number" step="0.01" {...form.register(`items.${index}.costoUnitario`)} className="h-8" /></TableCell>
                                <TableCell className="text-right font-bold">
                                ${sub.toFixed(2)}
                                </TableCell>
                                <TableCell>
                                <Button variant="ghost" size="icon" onClick={() => remove(index)}><Trash2 className="h-4 w-4 text-destructive"/></Button>
                                </TableCell>
                            </TableRow>
                            );
                        })
                    )}
                    </TableBody>
                </Table>
              </CardContent>
            </Card>

            <div className="flex justify-end items-center gap-4 pt-4">
              <span className="text-lg font-bold">Total Compra:</span>
              <span className="text-2xl font-extrabold text-primary">${totalGeneral.toFixed(2)}</span>
            </div>

            <DialogFooter>
              <DialogClose asChild>
                <Button type="button" variant="secondary">Cancelar</Button>
              </DialogClose>
              <Button type="submit" disabled={form.formState.isSubmitting}>
                {form.formState.isSubmitting ? "Guardando..." : "Registrar Compra"}
              </Button>
            </DialogFooter>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  );
}
