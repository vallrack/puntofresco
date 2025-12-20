'use client';
import { useState, useMemo, useRef } from 'react';
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
import { Button } from '@/components/ui/button';
import { Banknote, CreditCard, Landmark, DollarSign, Printer, CheckCircle2 } from 'lucide-react';
import { Bar, BarChart, ResponsiveContainer, XAxis, YAxis, Tooltip, Cell } from 'recharts';

function isValidDate(d: any) {
  return d instanceof Date && !isNaN(d.getTime());
}

export default function MySessionPage() {
  const { user, loading: userLoading } = useUser();
  const printRef = useRef<HTMLDivElement>(null);

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
        const saleDate = sale.fecha?.toDate ? sale.fecha.toDate() : new Date(sale.fecha);
        return saleDate >= start && saleDate <= end;
      })
      .sort((a, b) => {
          const dateA = a.fecha?.toDate ? a.fecha.toDate() : new Date(a.fecha);
          const dateB = b.fecha?.toDate ? b.fecha.toDate() : new Date(b.fecha);
          return dateB.getTime() - dateA.getTime();
      });
  }, [sales]);

  const salesSummary = useMemo(() => {
    return todaySales.reduce(
      (acc, sale) => {
        acc.total += sale.total;
        if (sale.metodoPago === 'Efectivo') acc.efectivo += sale.total;
        else if (sale.metodoPago === 'Tarjeta') acc.tarjeta += sale.total;
        else if (sale.metodoPago === 'Transferencia') acc.transferencia += sale.total;
        return acc;
      },
      { total: 0, efectivo: 0, tarjeta: 0, transferencia: 0 }
    );
  }, [todaySales]);

  const chartData = [
    { name: 'Efectivo', total: salesSummary.efectivo, color: '#10b981' },
    { name: 'Tarjeta', total: salesSummary.tarjeta, color: '#3b82f6' },
    { name: 'Transferencia', total: salesSummary.transferencia, color: '#8b5cf6' },
  ];

  const handlePrint = () => {
    window.print();
  };

  const getSaleDate = (sale: Sale): Date => {
      return sale.fecha?.toDate ? sale.fecha.toDate() : new Date(sale.fecha);
  }

  const loading = userLoading || loadingSales;

  return (
    <div className="space-y-6">
      {/* Botones de Acción Superiores */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 print:hidden">
        <Card className="flex-1">
          <CardHeader className="py-4">
            <CardTitle>Mi Cierre de Caja del Día</CardTitle>
            <CardDescription>
              {format(new Date(), "eeee dd 'de' MMMM, yyyy", { locale: es })}
            </CardDescription>
          </CardHeader>
        </Card>
        <Button size="lg" className="h-16 gap-2 text-lg shadow-lg" onClick={handlePrint} disabled={todaySales.length === 0}>
          <Printer className="h-5 w-5" />
          Imprimir Reporte de Cierre
        </Button>
      </div>

      {loading ? (
        <div className="flex flex-col items-center justify-center py-20 space-y-4">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary"></div>
            <p className="text-muted-foreground font-medium">Calculando totales de sesión...</p>
        </div>
      ) : (
        <>
          {/* Dashboard Visual */}
          <div className="grid gap-4 md:grid-cols-4 print:hidden">
            <Card className="bg-primary text-primary-foreground">
              <CardHeader className="pb-2">
                <CardTitle className="text-sm font-medium opacity-80">Venta Total</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-3xl font-bold">${salesSummary.total.toFixed(2)}</div>
                <p className="text-xs opacity-70 mt-1">{todaySales.length} ventas hoy</p>
              </CardContent>
            </Card>
            
            <Card>
              <CardHeader className="pb-2"><CardTitle className="text-sm font-medium">Efectivo</CardTitle></CardHeader>
              <CardContent><div className="text-2xl font-bold text-emerald-600">${salesSummary.efectivo.toFixed(2)}</div></CardContent>
            </Card>

            <Card>
              <CardHeader className="pb-2"><CardTitle className="text-sm font-medium">Tarjeta</CardTitle></CardHeader>
              <CardContent><div className="text-2xl font-bold text-blue-600">${salesSummary.tarjeta.toFixed(2)}</div></CardContent>
            </Card>

            <Card>
              <CardHeader className="pb-2"><CardTitle className="text-sm font-medium">Transferencia</CardTitle></CardHeader>
              <CardContent><div className="text-2xl font-bold text-purple-600">${salesSummary.transferencia.toFixed(2)}</div></CardContent>
            </Card>
          </div>

          <div className="grid gap-6 md:grid-cols-2 print:hidden">
            <Card>
                <CardHeader><CardTitle>Distribución de Ingresos</CardTitle></CardHeader>
                <CardContent>
                    <ResponsiveContainer width="100%" height={250}>
                        <BarChart data={chartData}>
                            <XAxis dataKey="name" axisLine={false} tickLine={false} fontSize={12} />
                            <YAxis hide />
                            <Tooltip cursor={{fill: 'transparent'}} formatter={(value: number) => [`$${value.toFixed(2)}`, 'Total']}/>
                            <Bar dataKey="total" radius={[6, 6, 0, 0]}>
                                {chartData.map((entry, index) => (
                                    <Cell key={`cell-${index}`} fill={entry.color} />
                                ))}
                            </Bar>
                        </BarChart>
                    </ResponsiveContainer>
                </CardContent>
            </Card>

            <Card>
                <CardHeader><CardTitle>Últimas Ventas</CardTitle></CardHeader>
                <CardContent>
                    <Table>
                        <TableBody>
                            {todaySales.slice(0, 5).map(sale => (
                                <TableRow key={sale.id}>
                                    <TableCell className="py-2">{format(getSaleDate(sale), 'HH:mm')}</TableCell>
                                    <TableCell className="py-2 text-xs font-mono">{sale.id?.slice(-6)}</TableCell>
                                    <TableCell className="py-2 text-right font-bold">${sale.total.toFixed(2)}</TableCell>
                                </TableRow>
                            ))}
                        </TableBody>
                    </Table>
                </CardContent>
            </Card>
          </div>

          {/* AREA DE IMPRESIÓN (OCULTA EN WEB, VISIBLE EN PAPEL) */}
          <div ref={printRef} className="hidden print:block p-8 border-2 border-black max-w-[400px] mx-auto text-black">
             <div className="text-center space-y-2 border-b-2 border-dashed border-gray-400 pb-4 mb-4">
                <h1 className="text-2xl font-bold">REPORTE DE CIERRE</h1>
                <p className="text-sm">Vendedor: {user?.email}</p>
                <p className="text-sm">Fecha: {format(new Date(), 'PPP p', { locale: es })}</p>
             </div>
             
             <div className="space-y-4">
                <div className="flex justify-between text-lg font-bold border-b">
                    <span>TOTAL VENTAS:</span>
                    <span>${salesSummary.total.toFixed(2)}</span>
                </div>
                <div className="flex justify-between">
                    <span>Efectivo:</span>
                    <span>${salesSummary.efectivo.toFixed(2)}</span>
                </div>
                <div className="flex justify-between">
                    <span>Tarjeta:</span>
                    <span>${salesSummary.tarjeta.toFixed(2)}</span>
                </div>
                <div className="flex justify-between border-b pb-2">
                    <span>Transferencia:</span>
                    <span>${salesSummary.transferencia.toFixed(2)}</span>
                </div>
                <div className="text-center pt-8">
                    <div className="border-t border-black mt-10 w-48 mx-auto"></div>
                    <p className="text-xs mt-1">Firma del Vendedor</p>
                </div>
             </div>
          </div>
        </>
      )}

      {/* Estilos CSS para impresión */}
      <style jsx global>{`
        @media print {
          body * { visibility: hidden; }
          .print\\:block, .print\\:block * { visibility: visible; }
          .print\\:block { position: absolute; left: 0; top: 0; width: 100%; }
          .print\\:hidden { display: none !important; }
        }
      `}</style>
    </div>
  );
}
