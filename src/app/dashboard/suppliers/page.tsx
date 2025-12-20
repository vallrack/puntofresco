'use client';
import { useState, useMemo } from 'react';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import {
  Card,
  CardHeader,
  CardTitle,
  CardDescription,
  CardContent,
} from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import {
  PlusCircle,
  MoreHorizontal,
  Search,
  Edit,
  Trash2,
} from 'lucide-react';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
  DialogClose,
} from '@/components/ui/dialog';
import { useCollection, useUser, useDoc } from '@/firebase';
import type { Supplier } from '@/lib/types';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import * as z from 'zod';
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from '@/components/ui/form';
import { useToast } from '@/hooks/use-toast';
import { addDoc, collection, doc, updateDoc, deleteDoc } from 'firebase/firestore';
import { useFirestore } from '@/firebase';

const supplierSchema = z.object({
  nombre: z.string().min(1, 'El nombre es requerido.'),
  telefono: z.string().optional(),
  email: z.string().email('Email inválido.').optional().or(z.literal('')),
  direccion: z.string().optional(),
});

type SupplierFormValues = z.infer<typeof supplierSchema>;

export default function SuppliersPage() {
  const { data: suppliers, loading, forceUpdate } = useCollection<Supplier>({
    path: 'proveedores',
  });
  const { user } = useUser();
  const { data: userData } = useDoc<{ rol: string }>({ path: 'usuarios', id: user?.uid });
  const [searchTerm, setSearchTerm] = useState('');
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [editingSupplier, setEditingSupplier] = useState<Supplier | null>(null);
  const [isDeleteDialogOpen, setIsDeleteDialogOpen] = useState(false);
  const [deletingSupplier, setDeletingSupplier] = useState<Supplier | null>(null);

  const { toast } = useToast();
  const firestore = useFirestore();

  const form = useForm<SupplierFormValues>({
    resolver: zodResolver(supplierSchema),
    defaultValues: {
      nombre: '',
      telefono: '',
      email: '',
      direccion: '',
    },
  });

  const isAdmin = useMemo(
    () => userData?.rol === 'admin' || userData?.rol === 'super_admin',
    [userData]
  );

  const filteredSuppliers = useMemo(() => {
    return suppliers?.filter((supplier) =>
      supplier.nombre.toLowerCase().includes(searchTerm.toLowerCase()) ||
      supplier.email?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      supplier.telefono?.includes(searchTerm)
    );
  }, [suppliers, searchTerm]);
  
  const openNewDialog = () => {
    setEditingSupplier(null);
    form.reset({ nombre: '', telefono: '', email: '', direccion: '' });
    setIsDialogOpen(true);
  };
  
  const openEditDialog = (supplier: Supplier) => {
    setEditingSupplier(supplier);
    form.reset(supplier);
    setIsDialogOpen(true);
  };
  
  const openDeleteDialog = (supplier: Supplier) => {
    setDeletingSupplier(supplier);
    setIsDeleteDialogOpen(true);
  };

  const onSubmit = async (values: SupplierFormValues) => {
    if (!firestore) return;
    try {
      if (editingSupplier) {
        // Update existing supplier
        const supplierRef = doc(firestore, 'proveedores', editingSupplier.id);
        await updateDoc(supplierRef, values);
        toast({ title: 'Éxito', description: 'Proveedor actualizado correctamente.' });
      } else {
        // Add new supplier
        await addDoc(collection(firestore, 'proveedores'), values);
        toast({ title: 'Éxito', description: 'Proveedor agregado correctamente.' });
      }
      form.reset();
      setIsDialogOpen(false);
      setEditingSupplier(null);
      forceUpdate(); // Force re-fetch
    } catch (error) {
      console.error(error);
      toast({
        variant: 'destructive',
        title: 'Error',
        description: `No se pudo ${editingSupplier ? 'actualizar' : 'agregar'} el proveedor.`,
      });
    }
  };

  const handleDelete = async () => {
    if (!firestore || !deletingSupplier) return;
    try {
      await deleteDoc(doc(firestore, 'proveedores', deletingSupplier.id));
      toast({ title: 'Éxito', description: 'Proveedor eliminado correctamente.' });
      setIsDeleteDialogOpen(false);
      setDeletingSupplier(null);
      forceUpdate(); // Force re-fetch
    } catch (error) {
       console.error(error);
      toast({
        variant: 'destructive',
        title: 'Error',
        description: 'No se pudo eliminar el proveedor.',
      });
    }
  };

  const onDialogClose = (open: boolean) => {
    if (!open) {
      form.reset();
      setEditingSupplier(null);
    }
    setIsDialogOpen(open);
  };

  return (
    <>
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <div>
              <CardTitle>Proveedores</CardTitle>
              <CardDescription>
                Gestiona tus proveedores de productos.
              </CardDescription>
            </div>
            {isAdmin && (
              <Button onClick={openNewDialog}>
                <PlusCircle className="mr-2 h-4 w-4" />
                Nuevo Proveedor
              </Button>
            )}
          </div>
          <div className="relative mt-4">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-5 w-5 text-muted-foreground" />
            <Input
              placeholder="Buscar por nombre, email o teléfono..."
              className="pl-10"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
            />
          </div>
        </CardHeader>
        <CardContent>
          <div className="overflow-x-auto">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Nombre</TableHead>
                  <TableHead>Teléfono</TableHead>
                  <TableHead>Email</TableHead>
                  <TableHead>Dirección</TableHead>
                  {isAdmin && <TableHead className="text-right">Acciones</TableHead>}
                </TableRow>
              </TableHeader>
              <TableBody>
                {loading && (
                  <TableRow>
                    <TableCell colSpan={isAdmin ? 5 : 4} className="text-center">
                      Cargando...
                    </TableCell>
                  </TableRow>
                )}
                {!loading && filteredSuppliers?.length === 0 && (
                  <TableRow>
                    <TableCell colSpan={isAdmin ? 5 : 4} className="text-center">
                      No se encontraron proveedores.
                    </TableCell>
                  </TableRow>
                )}
                {!loading &&
                  filteredSuppliers?.map((supplier) => (
                    <TableRow key={supplier.id}>
                      <TableCell className="font-medium">{supplier.nombre}</TableCell>
                      <TableCell>{supplier.telefono || '-'}</TableCell>
                      <TableCell>{supplier.email || '-'}</TableCell>
                      <TableCell>{supplier.direccion || '-'}</TableCell>
                      {isAdmin && (
                        <TableCell className="text-right">
                          <DropdownMenu>
                            <DropdownMenuTrigger asChild>
                              <Button variant="ghost" className="h-8 w-8 p-0">
                                <span className="sr-only">Abrir menú</span>
                                <MoreHorizontal className="h-4 w-4" />
                              </Button>
                            </DropdownMenuTrigger>
                            <DropdownMenuContent align="end">
                              <DropdownMenuItem onClick={() => openEditDialog(supplier)}>
                                <Edit className="mr-2 h-4 w-4" />
                                Editar
                              </DropdownMenuItem>
                              <DropdownMenuItem className="text-destructive" onClick={() => openDeleteDialog(supplier)}>
                                <Trash2 className="mr-2 h-4 w-4" />
                                Eliminar
                              </DropdownMenuItem>
                            </DropdownMenuContent>
                          </DropdownMenu>
                        </TableCell>
                      )}
                    </TableRow>
                  ))}
              </TableBody>
            </Table>
          </div>
        </CardContent>
      </Card>

      <Dialog open={isDialogOpen} onOpenChange={onDialogClose}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>{editingSupplier ? 'Editar' : 'Nuevo'} Proveedor</DialogTitle>
            <DialogDescription>
              {editingSupplier ? 'Actualiza los datos del proveedor.' : 'Añade un nuevo proveedor a tu lista.'}
            </DialogDescription>
          </DialogHeader>
          <Form {...form}>
            <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4 py-4">
              <FormField
                control={form.control}
                name="nombre"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Nombre</FormLabel>
                    <FormControl>
                      <Input placeholder="Ej: Proveedor S.A." {...field} />
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
                      <Input placeholder="Ej: 555-1234" {...field} />
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
                      <Input placeholder="Ej: contacto@proveedor.com" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
               <FormField
                control={form.control}
                name="direccion"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Dirección</FormLabel>
                    <FormControl>
                      <Input placeholder="Ej: Av. Siempre Viva 123" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <DialogFooter>
                <DialogClose asChild>
                  <Button type="button" variant="secondary">
                    Cancelar
                  </Button>
                </DialogClose>
                <Button type="submit" disabled={form.formState.isSubmitting}>
                  {form.formState.isSubmitting ? 'Guardando...' : 'Guardar'}
                </Button>
              </DialogFooter>
            </form>
          </Form>
        </DialogContent>
      </Dialog>
      
      <Dialog open={isDeleteDialogOpen} onOpenChange={setIsDeleteDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>¿Estás seguro?</DialogTitle>
            <DialogDescription>
              Esta acción no se puede deshacer. Se eliminará permanentemente el proveedor <strong>{deletingSupplier?.nombre}</strong>.
            </DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button variant="secondary" onClick={() => setIsDeleteDialogOpen(false)}>Cancelar</Button>
            <Button variant="destructive" onClick={handleDelete}>Sí, eliminar</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  );
}
