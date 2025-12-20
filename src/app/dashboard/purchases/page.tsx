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
import { Search, PlusCircle, Eye } from 'lucide-react';
import { useCollection, useUser, useDoc } from '@/firebase';
import type { Purchase, Supplier } from '@/lib/types';
import { format } from 'date-fns';
import { es } from 'date-fns/locale';
import { Badge } from '@/components/ui/badge';
import RegisterPurchaseDialog from '@/components/register-purchase-dialog';
import PurchaseDetailsDialog from '@/components/purchase-details-dialog';
import { useToast } from '@/hooks/use-toast';

export default function PurchasesPage() {
  const { data: purchases, loading: loadingPurchases, forceUpdate } = useCollection<Purchase>({ path: 'compras' });
  const { data: suppliers, loading: loadingSuppliers } = useCollection<Supplier>({ path: 'proveedores' });
  const { user } = useUser();
  const { data: userData } = useDoc<{ rol: string }>({ path: 'usuarios', id: user?.uid });
  const [searchTerm, setSearchTerm] = useState('');
  const [isRegisterDialogOpen, setIsRegisterDialogOpen] = useState(false);
  const [selectedPurchase, setSelectedPurchase] = useState<Purchase | null>(null);
  const { toast } = useToast();

  const isAdmin = useMemo(() => userData?.rol === 'admin' || userData?.rol === 'super_admin', [userData]);

  const supplierMap = useMemo(() => {
    if (!suppliers) return new Map();
    return new Map(suppliers.map(s => [s.id, s.nombre]));
  }, [suppliers]);

  const filteredPurchases = useMemo(() => {
    if (!purchases) return [];
    const sortedPurchases = [...purchases].sort((a, b) => {
      const dateA = a.fecha?.toDate ? a.fecha.toDate() : new Date(0);
      const dateB = b.fecha?.toDate ? b.fecha.toDate() : new Date(0);
      return dateB.getTime() - dateA.getTime();
    });
    
    if (!searchTerm) return sortedPurchases;

    return sortedPurchases.filter(purchase => {
      const purchaseIdMatch = purchase.id?.toLowerCase().includes(searchTerm.toLowerCase());
      const supplierName = supplierMap.get(purchase.proveedorId)?.toLowerCase() || '';
      const supplierMatch = supplierName.includes(searchTerm.toLowerCase());
      const purchaseDate = purchase.fecha?.toDate ? purchase.fecha.toDate() : null;
      const dateMatch = purchaseDate ? format(purchaseDate, 'dd/MM/yyyy').includes(searchTerm) : false;
      
      return purchaseIdMatch || supplierMatch || dateMatch;
    });
  }, [purchases, searchTerm, supplierMap]);

  const loading = loadingPurchases || loadingSuppliers;

  const handlePurchaseRegistered = () => {
    setIsRegisterDialogOpen(false);
    forceUpdate(); // Force a re-fetch of the purchases data
    toast({
      title: "Éxito",
      description: "La compra se ha registrado y el stock ha sido actualizado.",
    });
  }

  return (
    <>
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <div>
              <CardTitle>Historial de Compras</CardTitle>
              <CardDescription>
                Registro de compras a proveedores y actualización de stock.
              </CardDescription>
            </div>
            {isAdmin && (
              <Button onClick={() => setIsRegisterDialogOpen(true)}>
                <PlusCircle className="mr-2 h-4 w-4" />
                Registrar Compra
              </Button>
            )}
          </div>
          <div className="relative mt-4">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-5 w-5 text-muted-foreground" />
            <Input
              placeholder="Buscar por ID, proveedor o fecha..."
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
                  <TableHead>Fecha</TableHead>
                  <TableHead>ID Compra</TableHead>
                  <TableHead>Proveedor</TableHead>
                  <TableHead className="text-right">Total</TableHead>
                  <TableHead className="text-right">Acciones</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {loading && (
                  <TableRow>
                    <TableCell colSpan={5} className="text-center">
                      Cargando compras...
                    </TableCell>
                  </TableRow>
                )}
                {!loading && filteredPurchases.length === 0 && (
                  <TableRow>
                    <TableCell colSpan={5} className="text-center">
                      No se encontraron compras.
                    </TableCell>
                  </TableRow>
                )}
                {!loading &&
                  filteredPurchases.map((purchase) => {
                    const purchaseDate = purchase.fecha?.toDate ? purchase.fecha.toDate() : null;
                    return (
                      <TableRow key={purchase.id}>
                        <TableCell className="font-medium">
                          {purchaseDate ? (
                            <div className="flex flex-col">
                              <span>{format(purchaseDate, 'PPP', { locale: es })}</span>
                              <span className="text-xs text-muted-foreground">{format(purchaseDate, 'p', { locale: es })}</span>
                            </div>
                          ) : 'Fecha inválida'}
                        </TableCell>
                        <TableCell className="font-mono text-xs">{purchase.id}</TableCell>
                        <TableCell>
                          <Badge variant="outline">{supplierMap.get(purchase.proveedorId) || 'Desconocido'}</Badge>
                        </TableCell>
                        <TableCell className="text-right font-bold">${(purchase.total || 0).toFixed(2)}</TableCell>
                        <TableCell className="text-right">
                          <Button variant="outline" size="icon" onClick={() => setSelectedPurchase(purchase)}>
                              <Eye className="h-4 w-4" />
                              <span className="sr-only">Ver Detalles</span>
                            </Button>
                        </TableCell>
                      </TableRow>
                    );
                  })}
              </TableBody>
            </Table>
          </div>
        </CardContent>
      </Card>
      
      {isRegisterDialogOpen && (
        <RegisterPurchaseDialog 
          isOpen={isRegisterDialogOpen}
          onClose={() => setIsRegisterDialogOpen(false)}
          onPurchaseRegistered={handlePurchaseRegistered}
        />
      )}

      {selectedPurchase && (
        <PurchaseDetailsDialog
          isOpen={!!selectedPurchase}
          onClose={() => setSelectedPurchase(null)}
          purchase={selectedPurchase}
          supplierName={supplierMap.get(selectedPurchase.proveedorId) || 'Desconocido'}
        />
      )}
    </>
  );
}
