'use client';
import { useState, useEffect } from 'react';
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from "@/components/ui/card";
import { Button } from '@/components/ui/button';
import { DateRangePicker } from '@/components/ui/date-range-picker';
import { useCollection } from '@/firebase';
import type { Sale, Product, User as AppUser, Purchase, Merma as MermaType } from '@/lib/types';
import { DollarSign, TrendingUp, TrendingDown, ArchiveX, Users, CreditCard, Banknote, Landmark } from 'lucide-react';
import { Bar, BarChart, ResponsiveContainer, XAxis, YAxis, Tooltip, Legend, Line, LineChart, CartesianGrid } from 'recharts';
import { addDays, format, startOfMonth } from 'date-fns';
import type { DateRange } from 'react-day-picker';
import { es } from 'date-fns/locale';

type UserData = { id: string; email: string; };

export default function ReportsPage() {
  const [dateRange, setDateRange] = useState<DateRange | undefined>({
    from: startOfMonth(new Date()),
    to: new Date(),
  });

  const { data: sales, loading: loadingSales } = useCollection<Sale>({ path: 'ventas' });
  const { data: products, loading: loadingProducts } = useCollection<Product>({ path: 'productos' });
  const { data: users, loading: loadingUsers } = useCollection<UserData>({ path: 'usuarios' });
  const { data: mermas, loading: loadingMermas } = useCollection<MermaType>({ path: 'mermas' });

  const [filteredSales, setFilteredSales] = useState<Sale[]>([]);
  const [filteredMermas, setFilteredMermas] = useState<MermaType[]>([]);
  const [reportData, setReportData] = useState({
    totalRevenue: 0,
    totalCost: 0,
    totalLoss: 0,
    netProfit: 0,
  });
  const [salesByUser, setSalesByUser] = useState<{ name: string; total: number; }[]>([]);
  const [salesByPaymentMethod, setSalesByPaymentMethod] = useState<{ name: string; total: number; }[]>([]);
  const [dailySales, setDailySales] = useState<{ date: string; ventas: number, ganancias: number }[]>([]);

  useEffect(() => {
    if (!sales || !products || !dateRange?.from || !dateRange?.to) {
      return;
    }
    
    // Ajustar el final del día para incluir todas las ventas de ese día
    const toDate = new Date(dateRange.to);
    toDate.setHours(23, 59, 59, 999);

    const fSales = sales.filter(sale => {
      const saleDate = sale.fecha.toDate();
      return saleDate >= dateRange.from! && saleDate <= toDate;
    });
    setFilteredSales(fSales);
    
    if (mermas) {
      const fMermas = mermas.filter(merma => {
        const mermaDate = merma.fecha.toDate();
        return mermaDate >= dateRange.from! && mermaDate <= toDate;
      });
      setFilteredMermas(fMermas);
    }

  }, [sales, products, mermas, dateRange]);
  
  useEffect(() => {
      if (loadingSales || loadingProducts || loadingMermas) return;
      if (!products || !users) return;

      const productMap = new Map(products.map(p => [p.id, p]));

      // Calcular KPIs
      const totalRevenue = filteredSales.reduce((acc, sale) => acc + sale.total, 0);
      const totalCost = filteredSales.reduce((acc, sale) => {
          const saleCost = sale.items.reduce((itemAcc, item) => {
              const product = productMap.get(item.productId);
              return itemAcc + (product?.precioCompra || 0) * item.quantity;
          }, 0);
          return acc + saleCost;
      }, 0);
      
      const totalLoss = filteredMermas.reduce((acc, merma) => {
        const product = productMap.get(merma.productId);
        return acc + (product?.precioCompra || 0) * merma.cantidad;
      }, 0);

      const netProfit = totalRevenue - totalCost - totalLoss;
      
      setReportData({ totalRevenue, totalCost, totalLoss, netProfit });

      // Calcular Cierre de Caja por Vendedor
      const userMap = new Map(users.map(u => [u.id, u.email]));
      const salesByUserData: { [key: string]: number } = filteredSales.reduce((acc, sale) => {
        const userName = userMap.get(sale.vendedorId) || 'Desconocido';
        acc[userName] = (acc[userName] || 0) + sale.total;
        return acc;
      }, {} as { [key: string]: number });

      setSalesByUser(Object.entries(salesByUserData).map(([name, total]) => ({ name, total })));

      // Calcular Ventas por Método de Pago
       const salesByPaymentData = filteredSales.reduce((acc, sale) => {
        acc[sale.metodoPago] = (acc[sale.metodoPago] || 0) + sale.total;
        return acc;
      }, {} as { [key: string]: number });
      
      setSalesByPaymentMethod(Object.entries(salesByPaymentData).map(([name, total]) => ({ name, total })));

      // Calcular ventas y ganancias diarias para gráfico
      const salesByDate: { [key: string]: { ventas: number, ganancias: number } } = {};
      filteredSales.forEach(sale => {
          const dateStr = format(sale.fecha.toDate(), 'yyyy-MM-dd');
          if (!salesByDate[dateStr]) {
              salesByDate[dateStr] = { ventas: 0, ganancias: 0 };
          }
          const saleCost = sale.items.reduce((acc, item) => {
              const product = productMap.get(item.productId);
              return acc + (product?.precioCompra || 0) * item.quantity;
          }, 0);
          
          salesByDate[dateStr].ventas += sale.total;
          salesByDate[dateStr].ganancias += sale.total - saleCost;
      });

      setDailySales(Object.entries(salesByDate).map(([date, values]) => ({
        date: format(new Date(date), 'd MMM', { locale: es }),
        ...values
      })).sort((a,b) => new Date(a.date).getTime() - new Date(b.date).getTime()));

  }, [filteredSales, filteredMermas, products, users, loadingSales, loadingProducts, loadingMermas]);
  

  const loading = loadingSales || loadingProducts || loadingUsers || loadingMermas;

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
              <div>
                <CardTitle>Reportes Financieros</CardTitle>
                <CardDescription>
                  Análisis de ganancias, pérdidas y rendimiento del negocio.
                </CardDescription>
              </div>
              <DateRangePicker range={dateRange} onRangeChange={setDateRange} />
          </div>
        </CardHeader>
      </Card>
      
      {loading ? <p className='text-center'>Cargando datos del reporte...</p> :
      (
        <>
          <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Ingresos Totales</CardTitle>
                <DollarSign className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">${reportData.totalRevenue.toFixed(2)}</div>
                <p className="text-xs text-muted-foreground">Total de ventas en el período</p>
              </CardContent>
            </Card>
             <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Costo de Mercancía</CardTitle>
                <TrendingDown className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">${reportData.totalCost.toFixed(2)}</div>
                 <p className="text-xs text-muted-foreground">Costo de los productos vendidos</p>
              </CardContent>
            </Card>
            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Pérdidas (Merma)</CardTitle>
                <ArchiveX className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold text-destructive">${reportData.totalLoss.toFixed(2)}</div>
                 <p className="text-xs text-muted-foreground">Costo de productos dados de baja</p>
              </CardContent>
            </Card>
            <Card className="border-primary/50">
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Utilidad Neta</CardTitle>
                <TrendingUp className="h-4 w-4 text-primary" />
              </CardHeader>
              <CardContent>
                <div className={`text-2xl font-bold ${reportData.netProfit >= 0 ? 'text-primary' : 'text-destructive'}`}>
                  ${reportData.netProfit.toFixed(2)}
                </div>
                <p className="text-xs text-muted-foreground">Ingresos - Costos - Mermas</p>
              </CardContent>
            </Card>
          </div>

          <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-7">
            <Card className="lg:col-span-4">
              <CardHeader>
                <CardTitle>Rendimiento de Ventas</CardTitle>
                <CardDescription>Evolución de ventas y ganancias en el período seleccionado.</CardDescription>
              </CardHeader>
              <CardContent>
                 <ResponsiveContainer width="100%" height={300}>
                  <LineChart data={dailySales}>
                    <CartesianGrid strokeDasharray="3 3" />
                    <XAxis dataKey="date" fontSize={12} tickLine={false} axisLine={false} />
                    <YAxis fontSize={12} tickLine={false} axisLine={false} tickFormatter={(value) => `$${value}`} />
                    <Tooltip formatter={(value: number) => `$${value.toFixed(2)}`} />
                    <Legend />
                    <Line type="monotone" dataKey="ventas" stroke="#8884d8" name="Ventas Totales" />
                    <Line type="monotone" dataKey="ganancias" stroke="#82ca9d" name="Ganancia Bruta" />
                  </LineChart>
                </ResponsiveContainer>
              </CardContent>
            </Card>
             <Card className="lg:col-span-3">
              <CardHeader>
                <CardTitle>Ventas por Método de Pago</CardTitle>
                <CardDescription>Desglose de ingresos por método de pago.</CardDescription>
              </CardHeader>
              <CardContent>
                <ResponsiveContainer width="100%" height={300}>
                  <BarChart data={salesByPaymentMethod}>
                    <XAxis dataKey="name" fontSize={12} tickLine={false} axisLine={false} />
                    <YAxis fontSize={12} tickLine={false} axisLine={false} tickFormatter={(value) => `$${value}`} />
                    <Tooltip formatter={(value: number) => `$${value.toFixed(2)}`} cursor={{fill: 'hsl(var(--muted))'}} />
                    <Bar dataKey="total" fill="hsl(var(--primary))" radius={[4, 4, 0, 0]} />
                  </BarChart>
                </ResponsiveContainer>
              </CardContent>
            </Card>
          </div>

          <Card>
            <CardHeader>
                <CardTitle>Cierre de Caja por Vendedor</CardTitle>
                <CardDescription>Resumen de ventas totales por cada vendedor en el período seleccionado.</CardDescription>
            </CardHeader>
            <CardContent>
                <ResponsiveContainer width="100%" height={250}>
                    <BarChart data={salesByUser}>
                        <XAxis dataKey="name" fontSize={12} tickLine={false} axisLine={false} angle={-45} textAnchor="end" height={60} />
                        <YAxis fontSize={12} tickLine={false} axisLine={false} tickFormatter={(value) => `$${value}`} />
                        <Tooltip formatter={(value: number) => `$${value.toFixed(2)}`} cursor={{fill: 'hsl(var(--muted))'}}/>
                        <Bar dataKey="total" fill="hsl(var(--primary))" radius={[4, 4, 0, 0]} />
                    </BarChart>
                </ResponsiveContainer>
            </CardContent>
          </Card>
        </>
      )}
    </div>
  );
}
