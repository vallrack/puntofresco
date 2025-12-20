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
import { Search, Eye } from 'lucide-react';
import { useCollection, useUser, useDoc } from '@/firebase';
import type { Sale } from '@/lib/types';
import { format } from 'date-fns';
import ReceiptModal from '@/components/receipt-modal';
import { es } from 'date-fns/locale';
import { Badge } from '@/components/ui/badge';

type UserData = {
  id: string;
  email: string;
  rol: string;
};

export default function SalesPage() {
  const { user, loading: userLoading } = useUser();
  const { data: userData } = useDoc<{ rol: string }>({ path: 'usuarios', id: user?.uid });
  const isAdmin = useMemo(() => userData?.rol === 'admin' || userData?.rol === 'super_admin', [userData]);

  // La consulta ahora depende del rol del usuario.
  const { data: sales, loading: loadingSales } = useCollection<Sale>({
    path: 'ventas',
    // Si el usuario no es admin y ya se ha cargado, filtramos las ventas para que solo vea las suyas.
    query: !userLoading && !isAdmin && user?.uid ? ['vendedorId', '==', user.uid] : undefined,
  });
  
  const { data: users, loading: loadingUsers } = useCollection<UserData>({ path: 'usuarios' });

  const [searchTerm, setSearchTerm] = useState('');
  const [selectedSale, setSelectedSale] = useState<Sale | null>(null);
  
  const userMap = useMemo(() => {
    if (!users) return new Map();
    return new Map(users.map(u => [u.id, u.email]));
  }, [users]);
  
  const filteredSales = useMemo(() => {
    if (!sales) return [];
    // Sort by date, newest first
    const sortedSales = [...sales].sort((a, b) => {
      const dateA = a.fecha?.toDate ? a.fecha.toDate() : new Date(0);
      const dateB = b.fecha?.toDate ? b.fecha.toDate() : new Date(0);
      return dateB.getTime() - dateA.getTime();
    });
    
    if (!searchTerm) return sortedSales;

    return sortedSales.filter(sale => {
      const saleIdMatch = sale.id?.toLowerCase().includes(searchTerm.toLowerCase());
      const vendedorEmail = userMap.get(sale.vendedorId)?.toLowerCase() || '';
      const vendedorMatch = vendedorEmail.includes(searchTerm.toLowerCase());
      const saleDate = sale.fecha?.toDate ? sale.fecha.toDate() : null;
      const dateMatch = saleDate ? format(saleDate, 'dd/MM/yyyy').includes(searchTerm) : false;
      const paymentMethodMatch = sale.metodoPago?.toLowerCase().includes(searchTerm.toLowerCase());
      
      return saleIdMatch || vendedorMatch || dateMatch || paymentMethodMatch;
    });
  }, [sales, searchTerm, userMap]);

  const loading = userLoading || loadingSales || loadingUsers;

  return (
    <>
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <div>
              <CardTitle>Historial de Ventas</CardTitle>
              <CardDescription>
                Explora todas las transacciones realizadas.
              </CardDescription>
            </div>
          </div>
          <div className="relative mt-4">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-5 w-5 text-muted-foreground" />
            <Input
              placeholder="Buscar por ID, vendedor, fecha o método de pago..."
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
                  <TableHead>ID Venta</TableHead>
                  <TableHead>Vendedor</TableHead>
                  <TableHead>Método de Pago</TableHead>
                  <TableHead className="text-right">Total</TableHead>
                  <TableHead className="text-right">Acciones</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {loading && (
                  <TableRow>
                    <TableCell colSpan={6} className="text-center">
                      Cargando ventas...
                    </TableCell>
                  </TableRow>
                )}
                {!loading && filteredSales.length === 0 && (
                  <TableRow>
                    <TableCell colSpan={6} className="text-center">
                      No se encontraron ventas.
                    </TableCell>
                  </TableRow>
                )}
                {!loading &&
                  filteredSales.map((sale) => {
                    const saleDate = sale.fecha?.toDate ? sale.fecha.toDate() : null;
                    return (
                      <TableRow key={sale.id}>
                        <TableCell className="font-medium">
                          {saleDate ? (
                            <div className="flex flex-col">
                              <span>{format(saleDate, 'PPP', { locale: es })}</span>
                              <span className="text-xs text-muted-foreground">{format(saleDate, 'p', { locale: es })}</span>
                            </div>
                          ) : 'Fecha inválida'}
                        </TableCell>
                        <TableCell className="font-mono text-xs">{sale.id}</TableCell>
                        <TableCell>{userMap.get(sale.vendedorId) || 'Desconocido'}</TableCell>
                        <TableCell>
                          <Badge variant="outline">{sale.metodoPago}</Badge>
                        </TableCell>
                        <TableCell className="text-right font-bold">${sale.total.toFixed(2)}</TableCell>
                        <TableCell className="text-right">
                          <Button variant="outline" size="icon" onClick={() => setSelectedSale(sale)}>
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

      {selectedSale && (
        <ReceiptModal
          sale={selectedSale}
          isOpen={!!selectedSale}
          onClose={() => setSelectedSale(null)}
        />
      )}
    </>
  );
}
