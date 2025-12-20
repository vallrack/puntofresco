'use client'
import { useState, useMemo } from "react";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  Card,
  CardHeader,
  CardTitle,
  CardDescription,
  CardContent,
} from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { PlusCircle, MoreHorizontal, Search, Edit, Trash2, Upload, QrCode, RefreshCcw } from "lucide-react";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
  DialogClose,
} from "@/components/ui/dialog";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { useCollection, useUser, useDoc } from "@/firebase";
import type { Product, Category } from "@/lib/types";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import * as z from "zod";
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import { addProduct } from "@/lib/products";
import { uploadImage } from "@/lib/storage";
import { useToast } from "@/hooks/use-toast";
import Image from "next/image";
import { v4 as uuidv4 } from 'uuid';
import ProductQRModal from "@/components/product-qr-modal";

const productSchema = z.object({
  nombre: z.string().min(1, "El nombre es requerido."),
  sku: z.string().min(1, "El SKU es requerido."),
  categoria: z.string().min(1, "La categoría es requerida."),
  precioCompra: z.coerce.number().min(0, "El precio no puede ser negativo."),
  precioVenta: z.coerce.number().min(0, "El precio no puede ser negativo."),
  stock: z.coerce.number().int("El stock debe ser un número entero."),
  stockMinimo: z.coerce.number().int("El stock mínimo debe ser un número entero."),
  image: z.any().refine(files => files?.length == 1, "La imagen es requerida."),
});

type ProductFormValues = z.infer<typeof productSchema>;

export default function ProductsPage() {
  const { data: products, loading: loadingProducts } = useCollection<Product>({ path: "productos" });
  const { data: categories, loading: loadingCategories } = useCollection<Category>({ path: "categorias" });
  const [searchTerm, setSearchTerm] = useState("");
  const { user } = useUser();
  const { data: userData } = useDoc<{ rol: string }>({ path: 'usuarios', id: user?.uid });
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [imagePreview, setImagePreview] = useState<string | null>(null);
  const [isQRModalOpen, setIsQRModalOpen] = useState(false);
  const [selectedProductQR, setSelectedProductQR] = useState<Product | null>(null);
  const { toast } = useToast();

  const form = useForm<ProductFormValues>({
    resolver: zodResolver(productSchema),
    defaultValues: {
      nombre: "",
      sku: "",
      categoria: "",
      precioCompra: 0,
      precioVenta: 0,
      stock: 0,
      stockMinimo: 0,
      image: undefined,
    },
  });

  const isAdmin = useMemo(() => userData?.rol === 'admin' || userData?.rol === 'super_admin', [userData]);

  const filteredProducts = useMemo(() => {
    return products?.filter(
      (product) =>
        product.nombre.toLowerCase().includes(searchTerm.toLowerCase()) ||
        product.sku.toLowerCase().includes(searchTerm.toLowerCase())
    );
  }, [products, searchTerm]);

  const handleGenerateSKU = () => {
    form.setValue('sku', uuidv4());
  };
  
  const handleImageChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onloadend = () => {
        setImagePreview(reader.result as string);
      };
      reader.readAsDataURL(file);
    } else {
      setImagePreview(null);
    }
  };

  const onSubmit = async (values: ProductFormValues) => {
    if (!user) {
      toast({ variant: 'destructive', title: 'Error', description: 'Debes iniciar sesión.' });
      return;
    }

    try {
      const imageFile = values.image[0] as File;
      const imageUrl = await uploadImage(imageFile, `products/${user.uid}`);
      
      await addProduct({
        ...values,
        imageUrl: imageUrl,
        imageHint: "custom product",
        creadoPor: user.uid,
        actualizadoPor: user.uid,
      });

      toast({ title: 'Éxito', description: 'Producto agregado correctamente.' });
      form.reset();
      setImagePreview(null);
      setIsDialogOpen(false);
    } catch (error) {
      console.error(error);
      toast({ variant: 'destructive', title: 'Error', description: 'No se pudo agregar el producto.' });
    }
  };

  const onDialogClose = (open: boolean) => {
    if (!open) {
      form.reset();
      setImagePreview(null);
    }
    setIsDialogOpen(open);
  }

  const openQRModal = (product: Product) => {
    setSelectedProductQR(product);
    setIsQRModalOpen(true);
  }

  const loading = loadingProducts || loadingCategories;


  return (
    <>
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <div>
              <CardTitle>Productos</CardTitle>
              <CardDescription>
                Gestión de productos, categorías y stock.
              </CardDescription>
            </div>
            {isAdmin && (
              <Button onClick={() => setIsDialogOpen(true)}>
                <PlusCircle className="mr-2 h-4 w-4" />
                Nuevo Producto
              </Button>
            )}
          </div>
          <div className="relative mt-4">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-5 w-5 text-muted-foreground" />
            <Input
              placeholder="Buscar por nombre o SKU..."
              className="pl-10"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
            />
          </div>
        </CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Nombre</TableHead>
                <TableHead>SKU</TableHead>
                <TableHead>Código QR</TableHead>
                <TableHead>Precio Venta</TableHead>
                <TableHead>Precio Compra</TableHead>
                <TableHead>Stock</TableHead>
                <TableHead>Categoría</TableHead>
                {isAdmin && <TableHead className="text-right">Acciones</TableHead>}
              </TableRow>
            </TableHeader>
            <TableBody>
              {loading && (
                <TableRow>
                  <TableCell colSpan={isAdmin ? 8 : 7} className="text-center">
                    Cargando...
                  </TableCell>
                </TableRow>
              )}
              {!loading && filteredProducts?.length === 0 && (
                <TableRow>
                  <TableCell colSpan={isAdmin ? 8 : 7} className="text-center">
                    No se encontraron productos.
                  </TableCell>
                </TableRow>
              )}
              {!loading && filteredProducts?.map((product) => (
                <TableRow key={product.id}>
                  <TableCell className="font-medium">{product.nombre}</TableCell>
                  <TableCell>{product.sku}</TableCell>
                   <TableCell>
                    <Button variant="outline" size="icon" onClick={() => openQRModal(product)}>
                      <QrCode className="h-4 w-4" />
                    </Button>
                  </TableCell>
                  <TableCell>${product.precioVenta.toFixed(2)}</TableCell>
                  <TableCell>${product.precioCompra.toFixed(2)}</TableCell>
                  <TableCell>{product.stock}</TableCell>
                  <TableCell>{product.categoria}</TableCell>
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
                          <DropdownMenuItem>
                            <Edit className="mr-2 h-4 w-4" />
                            Editar
                          </DropdownMenuItem>
                          <DropdownMenuItem className="text-destructive">
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
        </CardContent>
      </Card>
      
      <Dialog open={isDialogOpen} onOpenChange={onDialogClose}>
        <DialogContent className="sm:max-w-4xl">
          <DialogHeader>
            <DialogTitle>Nuevo Producto</DialogTitle>
            <DialogDescription>
              Completa los detalles para agregar un nuevo producto al inventario.
            </DialogDescription>
          </DialogHeader>
          <Form {...form}>
            <form onSubmit={form.handleSubmit(onSubmit)} className="grid grid-cols-1 md:grid-cols-2 gap-6 py-4">
              <div className="space-y-4">
                <FormField
                  control={form.control}
                  name="nombre"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Nombre del Producto</FormLabel>
                      <FormControl>
                        <Input placeholder="Ej: Tomate Fresco" {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                <FormField
                  control={form.control}
                  name="sku"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>SKU / Código de Barras</FormLabel>
                       <div className="flex gap-2">
                        <FormControl>
                          <Input placeholder="Ej: 7501055312345" {...field} />
                        </FormControl>
                        <Button type="button" variant="outline" onClick={handleGenerateSKU}>
                          <RefreshCcw className="mr-2 h-4 w-4" />
                          Generar
                        </Button>
                      </div>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                <FormField
                  control={form.control}
                  name="categoria"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Categoría</FormLabel>
                      <Select onValueChange={field.onChange} defaultValue={field.value}>
                        <FormControl>
                          <SelectTrigger>
                            <SelectValue placeholder="Selecciona una categoría" />
                          </SelectTrigger>
                        </FormControl>
                        <SelectContent>
                          {loadingCategories && <SelectItem value="loading" disabled>Cargando...</SelectItem>}
                          {categories?.map((category) => (
                            <SelectItem key={category.id} value={category.nombre}>
                              {category.nombre}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                <div className="grid grid-cols-2 gap-4">
                  <FormField
                    control={form.control}
                    name="precioCompra"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Precio Compra</FormLabel>
                        <FormControl>
                          <Input type="number" step="0.01" placeholder="15.00" {...field} />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                  <FormField
                    control={form.control}
                    name="precioVenta"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Precio Venta</FormLabel>
                        <FormControl>
                          <Input type="number" step="0.01" placeholder="22.50" {...field} />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                </div>
                 <div className="grid grid-cols-2 gap-4">
                  <FormField
                    control={form.control}
                    name="stock"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Stock Actual</FormLabel>
                        <FormControl>
                          <Input type="number" placeholder="100" {...field} />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                  <FormField
                    control={form.control}
                    name="stockMinimo"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Stock Mínimo</FormLabel>
                        <FormControl>
                          <Input type="number" placeholder="10" {...field} />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                </div>
              </div>
              <div className="space-y-4">
                <FormField
                  control={form.control}
                  name="image"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Imagen del Producto</FormLabel>
                      <FormControl>
                        <div className="relative">
                          <Input
                            type="file"
                            accept="image/png, image/jpeg"
                            className="absolute inset-0 w-full h-full opacity-0 cursor-pointer"
                            onChange={(e) => {
                              field.onChange(e.target.files);
                              handleImageChange(e);
                            }}
                          />
                          <div className="border-2 border-dashed border-muted-foreground/50 rounded-md p-6 text-center cursor-pointer hover:border-primary">
                            <Upload className="mx-auto h-12 w-12 text-muted-foreground" />
                            <p className="mt-2 text-sm text-muted-foreground">
                              Arrastra y suelta o haz clic para subir
                            </p>
                          </div>
                        </div>
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                {imagePreview && (
                  <div className="aspect-video rounded-md overflow-hidden border relative">
                    <Image
                      src={imagePreview}
                      alt="Vista previa de la imagen"
                      fill
                      className="object-cover"
                    />
                  </div>
                )}
              </div>
               <DialogFooter className="col-span-1 md:col-span-2">
                <DialogClose asChild>
                  <Button type="button" variant="secondary">Cancelar</Button>
                </DialogClose>
                <Button type="submit" disabled={form.formState.isSubmitting}>
                  {form.formState.isSubmitting ? "Guardando..." : "Guardar Producto"}
                </Button>
              </DialogFooter>
            </form>
          </Form>
        </DialogContent>
      </Dialog>
      {selectedProductQR && (
        <ProductQRModal
          product={selectedProductQR}
          isOpen={isQRModalOpen}
          onClose={() => setIsQRModalOpen(false)}
        />
      )}
    </>
  );
}
