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

type UserData = {
  id: string;
  email: string;
  rol: string;
};

export default function SalesPage() {
  const { user, loading: userLoading } = useUser();
  const { data: userData } = useDoc<{ rol: string }>({ path: 'usuarios', id: user?.uid });
  const isAdmin = useMemo(() => userData?.rol === 'admin' || userData?.rol === 'super_admin', [userData]);

  const { data: sales, loading: loadingSales } = useCollection<Sale>({
    path: 'ventas',
    query: isAdmin || !user?.uid ? undefined : ['vendedorId', '==', user.uid],
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
    const sortedSales = [...sales].sort((a, b) => b.fecha.toMillis() - a.fecha.toMillis());
    
    if (!searchTerm) return sortedSales;

    return sortedSales.filter(sale => {
      const saleIdMatch = sale.id?.toLowerCase().includes(searchTerm.toLowerCase());
      const vendedorEmail = userMap.get(sale.vendedorId)?.toLowerCase() || '';
      const vendedorMatch = vendedorEmail.includes(searchTerm.toLowerCase());
      const dateMatch = format(sale.fecha.toDate(), 'dd/MM/yyyy').includes(searchTerm);
      
      return saleIdMatch || vendedorMatch || dateMatch;
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
              placeholder="Buscar por ID, vendedor o fecha (dd/mm/yyyy)..."
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
                <TableHead>Fecha</TableHead>
                <TableHead>ID Venta</TableHead>
                <TableHead>Vendedor</TableHead>
                <TableHead className="text-right">Total</TableHead>
                <TableHead className="text-right">Acciones</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {loading && (
                <TableRow>
                  <TableCell colSpan={5} className="text-center">
                    Cargando ventas...
                  </TableCell>
                </TableRow>
              )}
              {!loading && filteredSales.length === 0 && (
                <TableRow>
                  <TableCell colSpan={5} className="text-center">
                    No se encontraron ventas.
                  </TableCell>
                </TableRow>
              )}
              {!loading &&
                filteredSales.map((sale) => (
                  <TableRow key={sale.id}>
                    <TableCell className="font-medium">
                        <div className="flex flex-col">
                            <span>{format(sale.fecha.toDate(), 'PPP', { locale: es })}</span>
                            <span className="text-xs text-muted-foreground">{format(sale.fecha.toDate(), 'p', { locale: es })}</span>
                        </div>
                    </TableCell>
                    <TableCell className="font-mono text-xs">{sale.id}</TableCell>
                    <TableCell>{userMap.get(sale.vendedorId) || 'Desconocido'}</TableCell>
                    <TableCell className="text-right font-bold">${sale.total.toFixed(2)}</TableCell>
                    <TableCell className="text-right">
                       <Button variant="outline" size="icon" onClick={() => setSelectedSale(sale)}>
                          <Eye className="h-4 w-4" />
                          <span className="sr-only">Ver Detalles</span>
                        </Button>
                    </TableCell>
                  </TableRow>
                ))}
            </TableBody>
          </Table>
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
