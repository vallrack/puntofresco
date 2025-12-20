'use client';
import { useMemo } from 'react';
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
import { useCollection, useUser } from '@/firebase';
import type { Sale } from '@/lib/types';
import { format, startOfDay, endOfDay } from 'date-fns';
import { es } from 'date-fns/locale';
import { Badge } from '@/components/ui/badge';
import { Banknote, CreditCard, Landmark, DollarSign } from 'lucide-react';
import { Bar, BarChart, ResponsiveContainer, XAxis, YAxis, Tooltip } from 'recharts';


export default function MySessionPage() {
  const { user, loading: userLoading } = useUser();

  const salesQuery = useMemo(() => {
    if (!user) return undefined;
    return ['vendedorId', '==', user.uid] as [string, '==', any];
  }, [user]);

  const { data: sales, loading: loadingSales } = useCollection<Sale>({
    path: 'ventas',
    query: salesQuery,
  });

  const todaySales = useMemo(() => {
    if (!sales) return [];
    const now = new Date();
    const start = startOfDay(now);
    const end = endOfDay(now);

    return sales
      .filter((sale) => {
        // Robust date handling for Firestore Timestamp
        const saleDate = sale.fecha?.toDate ? sale.fecha.toDate() : new Date(sale.fecha);
        return saleDate >= start && saleDate <= end;
      })
      .sort((a, b) => {
          const dateA = a.fecha?.toDate ? a.fecha.toDate() : new Date(a.fecha);
          const dateB = b.fecha?.toDate ? b.fecha.toDate() : new Date(b.fecha);
          return dateB.getTime() - dateA.getTime()
      });
  }, [sales]);

  const salesSummary = useMemo(() => {
    return todaySales.reduce(
      (acc, sale) => {
        acc.total += sale.total;
        if (sale.metodoPago === 'Efectivo') {
          acc.efectivo += sale.total;
        } else if (sale.metodoPago === 'Tarjeta') {
          acc.tarjeta += sale.total;
        } else if (sale.metodoPago === 'Transferencia') {
          acc.transferencia += sale.total;
        }
        return acc;
      },
      { total: 0, efectivo: 0, tarjeta: 0, transferencia: 0 }
    );
  }, [todaySales]);

  const chartData = useMemo(() => {
    return [
      { name: 'Efectivo', total: salesSummary.efectivo },
      { name: 'Tarjeta', total: salesSummary.tarjeta },
      { name: 'Transferencia', total: salesSummary.transferencia },
    ];
  }, [salesSummary]);
  
  const loading = userLoading || loadingSales;

  const getSaleDate = (sale: Sale): Date => {
      return sale.fecha?.toDate ? sale.fecha.toDate() : new Date(sale.fecha);
  }

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle>Mi Cierre de Caja del Día</CardTitle>
          <CardDescription>
            Resumen de tus ventas realizadas hoy,{' '}
            {format(new Date(), "eeee dd 'de' MMMM", { locale: es })}.
          </CardDescription>
        </CardHeader>
      </Card>
      
      {loading ? <p className="text-center">Cargando datos de la sesión...</p> : (
        <>
          <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
             <Card className="border-primary/50">
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Venta Total del Día</CardTitle>
                <DollarSign className="h-4 w-4 text-primary" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold text-primary">${salesSummary.total.toFixed(2)}</div>
                <p className="text-xs text-muted-foreground">{todaySales.length} transacciones hoy</p>
              </CardContent>
            </Card>
            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Efectivo</CardTitle>
                <Banknote className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">${salesSummary.efectivo.toFixed(2)}</div>
              </CardContent>
            </Card>
            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Tarjeta</CardTitle>
                <CreditCard className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">${salesSummary.tarjeta.toFixed(2)}</div>
              </CardContent>
            </Card>
            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Transferencia</CardTitle>
                <Landmark className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">${salesSummary.transferencia.toFixed(2)}</div>
              </CardContent>
            </Card>
          </div>

          <div className="grid gap-6 md:grid-cols-2">
             <Card className="md:col-span-1">
                <CardHeader>
                    <CardTitle>Ventas por Método de Pago</CardTitle>
                </CardHeader>
                <CardContent>
                    <ResponsiveContainer width="100%" height={300}>
                        <BarChart data={chartData}>
                            <XAxis dataKey="name" stroke="#888888" fontSize={12} tickLine={false} axisLine={false}/>
                            <YAxis stroke="#888888" fontSize={12} tickLine={false} axisLine={false} tickFormatter={(value) => `$${value}`}/>
                            <Tooltip formatter={(value: number) => [`$${value.toFixed(2)}`, "Total"]} cursor={{fill: 'hsl(var(--muted))'}} />
                            <Bar dataKey="total" fill="hsl(var(--primary))" radius={[4, 4, 0, 0]} />
                        </BarChart>
                    </ResponsiveContainer>
                </CardContent>
            </Card>
            
            <Card className="md:col-span-1">
                <CardHeader>
                    <CardTitle>Detalle de Ventas de Hoy</CardTitle>
                </CardHeader>
                <CardContent>
                    <div className="overflow-x-auto">
                        <Table>
                        <TableHeader>
                            <TableRow>
                            <TableHead>Hora</TableHead>
                            <TableHead>ID Venta</TableHead>
                            <TableHead>Método de Pago</TableHead>
                            <TableHead className="text-right">Total</TableHead>
                            </TableRow>
                        </TableHeader>
                        <TableBody>
                            {todaySales.length === 0 && (
                                <TableRow>
                                    <TableCell colSpan={4} className="text-center py-10">
                                    No has realizado ventas hoy.
                                    </TableCell>
                                </TableRow>
                            )}
                            {todaySales.map((sale) => (
                            <TableRow key={sale.id}>
                                <TableCell className="font-medium">
                                {format(getSaleDate(sale), 'p', { locale: es })}
                                </TableCell>
                                <TableCell className="font-mono text-xs">{sale.id}</TableCell>
                                <TableCell>
                                <Badge variant="outline">{sale.metodoPago}</Badge>
                                </TableCell>
                                <TableCell className="text-right font-bold">
                                ${sale.total.toFixed(2)}
                                </TableCell>
                            </TableRow>
                            ))}
                        </TableBody>
                        </Table>
                    </div>
                </CardContent>
            </Card>
          </div>
        </>
      )}
    </div>
  );
}
