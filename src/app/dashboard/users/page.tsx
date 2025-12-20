'use client';
import { useState, useMemo, useEffect } from 'react';
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
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from "@/components/ui/select";
import { useCollection, useUser, useDoc, useFirestore } from '@/firebase';
import type { User as AppUser } from '@/lib/types';
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
import { createUser } from '@/lib/users';
import { Badge } from '@/components/ui/badge';
import { doc, updateDoc, deleteDoc } from 'firebase/firestore';


const userSchema = z.object({
  nombre: z.string().min(1, 'El nombre es requerido.'),
  email: z.string().email('Email inválido.'),
  telefono: z.string().optional(),
  password: z.string().min(6, 'La contraseña debe tener al menos 6 caracteres.'),
  rol: z.enum(['admin', 'vendedor']),
});

const editUserSchema = z.object({
  rol: z.enum(['admin', 'vendedor', 'super_admin']),
});

type UserFormValues = z.infer<typeof userSchema>;
type EditUserFormValues = z.infer<typeof editUserSchema>;

export default function UsersPage() {
  const { user: currentUser, loading: loadingUser } = useUser();
  const { data: currentUserData } = useDoc<{ rol: string }>({ path: 'usuarios', id: currentUser?.uid });
  const { data: users, loading: loadingUsers, forceUpdate } = useCollection<AppUser>({ path: 'usuarios' });
  const firestore = useFirestore();

  const [searchTerm, setSearchTerm] = useState('');
  const [isNewUserDialogOpen, setIsNewUserDialogOpen] = useState(false);
  const [isEditUserDialogOpen, setIsEditUserDialogOpen] = useState(false);
  const [isDeleteUserDialogOpen, setIsDeleteUserDialogOpen] = useState(false);
  const [selectedUser, setSelectedUser] = useState<AppUser | null>(null);
  
  const { toast } = useToast();

  const newUserForm = useForm<UserFormValues>({
    resolver: zodResolver(userSchema),
    defaultValues: {
      nombre: '',
      email: '',
      telefono: '',
      password: '',
      rol: 'vendedor',
    },
  });

  const editUserForm = useForm<EditUserFormValues>({
    resolver: zodResolver(editUserSchema),
  });
  
  const isSuperAdmin = useMemo(() => currentUserData?.rol === 'super_admin', [currentUserData]);

  const filteredUsers = useMemo(() => {
    if (!users) return [];
    return users.filter((user) =>
        user.id !== currentUser?.uid && 
        (user.email.toLowerCase().includes(searchTerm.toLowerCase()) ||
         (user.nombre && user.nombre.toLowerCase().includes(searchTerm.toLowerCase())))
    );
  }, [users, searchTerm, currentUser]);
  
 const onNewUserSubmit = async (values: UserFormValues) => {
    try {
      await createUser(values);
      toast({ title: 'Éxito', description: 'Usuario creado correctamente.' });
      forceUpdate();
      setIsNewUserDialogOpen(false);
      newUserForm.reset();
    } catch (error: any) {
      console.error("Caught error in UI:", error.message);
      toast({
          variant: 'destructive',
          title: 'Error al crear usuario',
          description: error.message,
      });
    }
  };

  const onEditUserSubmit = async (values: EditUserFormValues) => {
    if (!selectedUser || !firestore) return;
    try {
      const userRef = doc(firestore, 'usuarios', selectedUser.id);
      await updateDoc(userRef, { rol: values.rol });
      toast({ title: 'Éxito', description: 'Rol de usuario actualizado.' });
      forceUpdate();
      setIsEditUserDialogOpen(false);
    } catch (error: any) {
       toast({ variant: 'destructive', title: 'Error', description: 'No se pudo actualizar el rol.' });
    }
  };

  const handleDeleteUser = async () => {
    if (!selectedUser || !firestore) return;
    // Nota: Esta función solo elimina de Firestore. Para una eliminación completa,
    // se necesitaría una Cloud Function para eliminar el usuario de Firebase Auth.
    try {
        const userRef = doc(firestore, 'usuarios', selectedUser.id);
        await deleteDoc(userRef);
        toast({ title: 'Éxito', description: 'Usuario eliminado de Firestore.' });
        forceUpdate();
        setIsDeleteUserDialogOpen(false);
    } catch (error: any) {
       toast({ variant: 'destructive', title: 'Error', description: 'No se pudo eliminar el usuario.' });
    }
  };
  
  const openEditDialog = (user: AppUser) => {
    setSelectedUser(user);
    editUserForm.setValue('rol', user.rol || 'vendedor');
    setIsEditUserDialogOpen(true);
  };
  
  const openDeleteDialog = (user: AppUser) => {
    setSelectedUser(user);
    setIsDeleteUserDialogOpen(true);
  };

  useEffect(() => {
    if (!isNewUserDialogOpen) {
      newUserForm.reset();
    }
  }, [isNewUserDialogOpen, newUserForm]);

  useEffect(() => {
    if (!isEditUserDialogOpen && !isDeleteUserDialogOpen) {
      setSelectedUser(null);
    }
  }, [isEditUserDialogOpen, isDeleteUserDialogOpen]);
  
  const loading = loadingUser || loadingUsers;
  
  if (loading) {
    return <p>Cargando...</p>;
  }

  if (!isSuperAdmin) {
    return (
       <Card>
        <CardHeader>
            <CardTitle>Acceso Denegado</CardTitle>
            <CardDescription>No tienes permisos para gestionar usuarios.</CardDescription>
        </CardHeader>
        <CardContent>
            <p>Esta sección solo está disponible para usuarios con el rol de Super Administrador.</p>
        </CardContent>
       </Card>
    );
  }

  return (
    <>
      <Card>
        <CardHeader>
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
            <div>
              <CardTitle>Usuarios</CardTitle>
              <CardDescription>
                Gestión de usuarios y roles del sistema.
              </CardDescription>
            </div>
            {isSuperAdmin && (
              <Button onClick={() => setIsNewUserDialogOpen(true)} className="w-full sm:w-auto">
                <PlusCircle className="mr-2 h-4 w-4" />
                Nuevo Usuario
              </Button>
            )}
          </div>
          <div className="relative mt-4">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-5 w-5 text-muted-foreground" />
            <Input
              placeholder="Buscar por nombre o email..."
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
                  <TableHead>Email</TableHead>
                  <TableHead>Teléfono</TableHead>
                  <TableHead>Rol</TableHead>
                  {isSuperAdmin && <TableHead className="text-right">Acciones</TableHead>}
                </TableRow>
              </TableHeader>
              <TableBody>
                {loading && (
                  <TableRow>
                    <TableCell colSpan={5} className="text-center">
                      Cargando...
                    </TableCell>
                  </TableRow>
                )}
                {!loading && filteredUsers?.length === 0 && (
                  <TableRow>
                    <TableCell colSpan={5} className="text-center">
                      No se encontraron usuarios.
                    </TableCell>
                  </TableRow>
                )}
                {!loading &&
                  filteredUsers?.map((user) => (
                    <TableRow key={user.id}>
                      <TableCell className="font-medium">{user.nombre || '-'}</TableCell>
                      <TableCell>{user.email}</TableCell>
                      <TableCell>{user.telefono || '-'}</TableCell>
                      <TableCell>
                          <Badge 
                              variant={!user.rol ? 'destructive' : user.rol === 'super_admin' ? 'default' : user.rol === 'admin' ? 'secondary' : 'outline'}
                          >
                              {user.rol || 'Sin Asignar'}
                          </Badge>
                      </TableCell>
                      {isSuperAdmin && (
                        <TableCell className="text-right">
                           <DropdownMenu>
                            <DropdownMenuTrigger asChild>
                              <Button variant="ghost" className="h-8 w-8 p-0" disabled={user.id === currentUser?.uid}>
                                <span className="sr-only">Abrir menú</span>
                                <MoreHorizontal className="h-4 w-4" />
                              </Button>
                            </DropdownMenuTrigger>
                            <DropdownMenuContent align="end">
                              <DropdownMenuItem onClick={() => openEditDialog(user)}>
                                <Edit className="mr-2 h-4 w-4" />
                                Editar Rol
                              </DropdownMenuItem>
                              <DropdownMenuItem className="text-destructive" onClick={() => openDeleteDialog(user)}>
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
      
      {/* New User Dialog */}
      <Dialog open={isNewUserDialogOpen} onOpenChange={setIsNewUserDialogOpen}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>Nuevo Usuario</DialogTitle>
            <DialogDescription>
              Crea un nuevo perfil para tu equipo.
            </DialogDescription>
          </DialogHeader>
          <Form {...newUserForm}>
            <form onSubmit={newUserForm.handleSubmit(onNewUserSubmit)} className="space-y-4 py-4">
               <FormField
                control={newUserForm.control}
                name="nombre"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Nombre Completo</FormLabel>
                    <FormControl>
                      <Input placeholder="Ej: Juan Pérez" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <FormField
                control={newUserForm.control}
                name="email"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Email</FormLabel>
                    <FormControl>
                      <Input placeholder="usuario@puntofresco.com" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <FormField
                control={newUserForm.control}
                name="telefono"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Teléfono</FormLabel>
                    <FormControl>
                      <Input placeholder="Ej: 55 1234 5678" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
               <FormField
                control={newUserForm.control}
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
              <FormField
                  control={newUserForm.control}
                  name="rol"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Rol Inicial</FormLabel>
                      <Select onValueChange={field.onChange} defaultValue={field.value}>
                        <FormControl>
                          <SelectTrigger>
                            <SelectValue placeholder="Selecciona un rol" />
                          </SelectTrigger>
                        </FormControl>
                        <SelectContent>
                          <SelectItem value="vendedor">Vendedor</SelectItem>
                          <SelectItem value="admin">Administrador</SelectItem>
                        </SelectContent>
                      </Select>
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
                <Button type="submit" disabled={newUserForm.formState.isSubmitting}>
                  {newUserForm.formState.isSubmitting ? 'Creando...' : 'Crear Usuario'}
                </Button>
              </DialogFooter>
            </form>
          </Form>
        </DialogContent>
      </Dialog>

      {/* Edit User Dialog */}
      <Dialog open={isEditUserDialogOpen} onOpenChange={setIsEditUserDialogOpen}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>Editar Rol de Usuario</DialogTitle>
            <DialogDescription>
              Cambia el rol para <span className="font-semibold">{selectedUser?.email}</span>.
            </DialogDescription>
          </DialogHeader>
          <Form {...editUserForm}>
            <form onSubmit={editUserForm.handleSubmit(onEditUserSubmit)} className="space-y-4 py-4">
              <FormField
                  control={editUserForm.control}
                  name="rol"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Rol</FormLabel>
                      <Select onValueChange={field.onChange} defaultValue={field.value}>
                        <FormControl>
                          <SelectTrigger>
                            <SelectValue placeholder="Selecciona un rol" />
                          </SelectTrigger>
                        </FormControl>
                        <SelectContent>
                          <SelectItem value="vendedor">Vendedor</SelectItem>
                          <SelectItem value="admin">Administrador</SelectItem>
                          <SelectItem value="super_admin">Super Admin</SelectItem>
                        </SelectContent>
                      </Select>
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
                <Button type="submit" disabled={editUserForm.formState.isSubmitting}>
                  {editUserForm.formState.isSubmitting ? 'Guardando...' : 'Guardar Cambios'}
                </Button>
              </DialogFooter>
            </form>
          </Form>
        </DialogContent>
      </Dialog>

      {/* Delete User Dialog */}
      <Dialog open={isDeleteUserDialogOpen} onOpenChange={setIsDeleteUserDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>¿Estás seguro?</DialogTitle>
            <DialogDescription>
              Esta acción no se puede deshacer. Se eliminará el perfil de Firestore para <strong className="break-all">{selectedUser?.email}</strong>. El usuario no podrá iniciar sesión.
            </DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button variant="secondary" onClick={() => setIsDeleteUserDialogOpen(false)}>Cancelar</Button>
            <Button variant="destructive" onClick={handleDeleteUser}>Sí, eliminar</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  );
}
