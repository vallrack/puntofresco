'use client';
import { useState, useMemo, useEffect } from 'react';
import { useForm, useFieldArray } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import * as z from 'zod';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
  DialogClose,
} from '@/components/ui/dialog';
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from '@/components/ui/form';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import {
  Command,
  CommandInput,
  CommandList,
  CommandEmpty,
  CommandGroup,
  CommandItem,
} from '@/components/ui/command';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import { Card, CardContent } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { useCollection } from '@/firebase';
import type { Supplier, Product, PurchaseItem } from '@/lib/types';
import { Trash2, ShoppingCart } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { processPurchase } from '@/lib/purchases';
import { useFirestore } from '@/firebase';

interface RegisterPurchaseDialogProps {
  isOpen: boolean;
  onClose: () => void;
  onPurchaseRegistered: () => void;
}

const purchaseItemSchema = z.object({
  productId: z.string(),
  nombre: z.string(),
  cantidad: z.coerce.number().min(1, 'La cantidad debe ser al menos 1.'),
  costoUnitario: z.coerce.number().min(0, 'El costo no puede ser negativo.'),
});

const purchaseSchema = z.object({
  proveedorId: z.string().min(1, 'Debes seleccionar un proveedor.'),
  items: z.array(purchaseItemSchema).min(1, 'Debes agregar al menos un producto a la compra.'),
});

type PurchaseFormValues = z.infer<typeof purchaseSchema>;

export default function RegisterPurchaseDialog({ isOpen, onClose, onPurchaseRegistered }: RegisterPurchaseDialogProps) {
  const { data: suppliers, loading: loadingSuppliers } = useCollection<Supplier>({ path: 'proveedores' });
  const { data: products, loading: loadingProducts } = useCollection<Product>({ path: 'productos' });
  const [productSearchTerm, setProductSearchTerm] = useState('');
  const { toast } = useToast();
  const firestore = useFirestore();

  const form = useForm<PurchaseFormValues>({
    resolver: zodResolver(purchaseSchema),
    defaultValues: {
      proveedorId: '',
      items: [],
    },
  });

  const { fields, append, remove, update } = useFieldArray({
    control: form.control,
    name: 'items',
    keyName: 'key',
  });

  const filteredProducts = useMemo(() => {
    if (!products) return [];
    if (!productSearchTerm) return [];
    // Don't show products that are already in the list
    const currentItemIds = fields.map(item => item.productId);
    return products.filter(p => 
      !currentItemIds.includes(p.id) &&
      (p.nombre.toLowerCase().includes(productSearchTerm.toLowerCase()) || 
       p.sku.toLowerCase().includes(productSearchTerm.toLowerCase()))
    ).slice(0, 5); // Limit results for performance
  }, [products, productSearchTerm, fields]);

  const addProductToPurchase = (product: Product) => {
    append({
      productId: product.id,
      nombre: product.nombre,
      cantidad: 1,
      costoUnitario: product.precioCompra, // Default to last purchase price
    });
    setProductSearchTerm('');
  };

  const currentItems = form.watch('items');
  const total = useMemo(() => {
    if (!currentItems) return 0;
    return currentItems.reduce((acc, item) => acc + (item.cantidad || 0) * (item.costoUnitario || 0), 0);
  }, [currentItems]);

  const onSubmit = async (values: PurchaseFormValues) => {
    if (!firestore) {
        toast({ variant: 'destructive', title: 'Error', description: 'No se pudo conectar a la base de datos.' });
        return;
    }
    const purchaseData = {
        ...values,
        total: total,
    }
    try {
        await processPurchase(firestore, purchaseData);
        onPurchaseRegistered();
    } catch(error: any) {
        console.error("Error al registrar la compra:", error);
        toast({
            variant: 'destructive',
            title: 'Error al registrar la compra',
            description: error.message || 'Ocurrió un problema al guardar los datos.'
        })
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
          <DialogTitle>Registrar Nueva Compra</DialogTitle>
          <DialogDescription>
            Ingresa la mercancía recibida de un proveedor para actualizar tu inventario.
          </DialogDescription>
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

            <div className="space-y-2">
                <FormLabel>Productos en la Compra</FormLabel>
                <Card>
                    <CardContent className="p-0">
                        <Table>
                            <TableHeader>
                                <TableRow>
                                    <TableHead className="w-[50%]">Producto</TableHead>
                                    <TableHead>Cantidad</TableHead>
                                    <TableHead>Costo Unitario</TableHead>
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
                                        const cantidad = form.watch(`items.${index}.cantidad`) || 0;
                                        const costoUnitario = form.watch(`items.${index}.costoUnitario`) || 0;
                                        const subtotal = cantidad * costoUnitario;
                                        return (
                                            <TableRow key={item.key}>
                                                <TableCell className="font-medium">{item.nombre}</TableCell>
                                                <TableCell>
                                                    <Input 
                                                        type="number"
                                                        {...form.register(`items.${index}.cantidad`)}
                                                        className="h-8"
                                                    />
                                                </TableCell>
                                                <TableCell>
                                                    <Input 
                                                        type="number"
                                                        step="0.01"
                                                        {...form.register(`items.${index}.costoUnitario`)}
                                                        className="h-8"
                                                    />
                                                </TableCell>
                                                <TableCell className="text-right">
                                                    ${subtotal.toFixed(2)}
                                                </TableCell>
                                                <TableCell>
                                                    <Button variant="ghost" size="icon" onClick={() => remove(index)}>
                                                        <Trash2 className="h-4 w-4 text-destructive"/>
                                                    </Button>
                                                </TableCell>
                                            </TableRow>
                                        )
                                    })
                                )}
                            </TableBody>
                        </Table>
                    </CardContent>
                </Card>
                 {form.formState.errors.items && (
                    <p className="text-sm font-medium text-destructive">{typeof form.formState.errors.items === 'object' && 'message' in form.formState.errors.items ? form.formState.errors.items.message : ''}</p>
                 )}
            </div>
            
            <div className="flex justify-end items-center gap-4 pt-4">
                <p className="text-lg font-bold">Total Compra:</p>
                <p className="text-2xl font-extrabold text-primary">${total.toFixed(2)}</p>
            </div>

            <DialogFooter>
              <DialogClose asChild>
                <Button type="button" variant="secondary">
                  Cancelar
                </Button>
              </DialogClose>
              <Button type="submit" disabled={form.formState.isSubmitting}>
                {form.formState.isSubmitting ? 'Guardando...' : 'Registrar Compra'}
              </Button>
            </DialogFooter>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  );
}
