'use client';
import { useState, useEffect } from 'react';
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from "@/components/ui/card";
import { Button } from '@/components/ui/button';
import { DateRangePicker } from '@/components/ui/date-range-picker';
import { useCollection } from '@/firebase';
import type { Sale, Product, User as AppUser, Purchase, Merma as MermaType } from '@/lib/types';
import { DollarSign, TrendingUp, TrendingDown, ArchiveX, Users, CreditCard, Banknote, Landmark, FileDown } from 'lucide-react';
import { Bar, BarChart, ResponsiveContainer, XAxis, YAxis, Tooltip, Legend, Line, LineChart, CartesianGrid } from 'recharts';
import { addDays, format, startOfMonth } from 'date-fns';
import type { DateRange } from 'react-day-picker';
import { es } from 'date-fns/locale';
import jsPDF from 'jspdf';
import autoTable from 'jspdf-autotable';
import * as XLSX from 'xlsx';

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

  const productMap = useMemo(() => {
      if (!products) return new Map();
      return new Map(products.map(p => [p.id, p]));
  }, [products]);

  useEffect(() => {
    if (!sales || !dateRange?.from || !dateRange?.to) {
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

  }, [sales, mermas, dateRange]);
  
  useEffect(() => {
      if (loadingSales || loadingProducts || loadingMermas) return;
      if (!products || !users) return;

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

  }, [filteredSales, filteredMermas, products, users, loadingSales, loadingProducts, loadingMermas, productMap]);
  
  const handleExportPDF = () => {
    const doc = new jsPDF();
    const dateFrom = dateRange?.from ? format(dateRange.from, 'PPP', { locale: es }) : '';
    const dateTo = dateRange?.to ? format(dateRange.to, 'PPP', { locale: es }) : '';

    // Título
    doc.setFontSize(18);
    doc.text('Reporte Financiero - Punto Fresco', 14, 22);
    doc.setFontSize(11);
    doc.text(`Período: ${dateFrom} - ${dateTo}`, 14, 30);
    
    // KPIs
    doc.setFontSize(12);
    doc.text('Resumen del Período', 14, 45);
    autoTable(doc, {
      startY: 50,
      body: [
        ['Ingresos Totales', `$${reportData.totalRevenue.toFixed(2)}`],
        ['Costo de Mercancía', `$${reportData.totalCost.toFixed(2)}`],
        ['Pérdidas (Merma)', `$${reportData.totalLoss.toFixed(2)}`],
        ['Utilidad Neta', `$${reportData.netProfit.toFixed(2)}`],
      ],
      theme: 'grid',
      styles: { fontStyle: 'bold' }
    });

    // Tabla de ventas
    const salesData = filteredSales.map(sale => {
       const saleCost = sale.items.reduce((acc, item) => {
          const product = productMap.get(item.productId);
          return acc + (product?.precioCompra || 0) * item.quantity;
        }, 0);
        const profit = sale.total - saleCost;
        return [
            sale.id,
            format(sale.fecha.toDate(), 'Pp', { locale: es }),
            sale.items.map(i => `${i.quantity}x ${i.nombre}`).join(', '),
            `$${sale.total.toFixed(2)}`,
            `$${profit.toFixed(2)}`,
        ]
    });
    
    autoTable(doc, {
      head: [['ID Venta', 'Fecha', 'Productos', 'Total Venta', 'Ganancia']],
      body: salesData,
      startY: (doc as any).lastAutoTable.finalY + 15,
      showHead: 'firstPage',
    });

    doc.save(`Reporte_PuntoFresco_${format(new Date(), 'yyyy-MM-dd')}.pdf`);
  };

  const handleExportExcel = () => {
    // Hoja 1: Resumen
    const summaryData = [
      { Métrica: 'Ingresos Totales', Valor: reportData.totalRevenue },
      { Métrica: 'Costo de Mercancía', Valor: reportData.totalCost },
      { Métrica: 'Pérdidas (Merma)', Valor: reportData.totalLoss },
      { Métrica: 'Utilidad Neta', Valor: reportData.netProfit },
    ];
    const summaryWorksheet = XLSX.utils.json_to_sheet(summaryData);
    summaryWorksheet['B1'].z = '$#,##0.00';
    summaryWorksheet['B2'].z = '$#,##0.00';
    summaryWorksheet['B3'].z = '$#,##0.00';
    summaryWorksheet['B4'].z = '$#,##0.00';

    // Hoja 2: Ventas Detalladas
    const salesExportData = filteredSales.map(sale => {
      const saleCost = sale.items.reduce((acc, item) => {
        const product = productMap.get(item.productId);
        return acc + (product?.precioCompra || 0) * item.quantity;
      }, 0);
      const profit = sale.total - saleCost;
      return {
        'ID Venta': sale.id,
        'Fecha': format(sale.fecha.toDate(), 'yyyy-MM-dd HH:mm:ss'),
        'Vendedor': users?.find(u => u.id === sale.vendedorId)?.email || 'Desconocido',
        'Productos': sale.items.map(i => `${i.quantity}x ${i.nombre}`).join(', '),
        'Método de Pago': sale.metodoPago,
        'Total Venta': sale.total,
        'Costo Total': saleCost,
        'Ganancia': profit,
      };
    });
    const salesWorksheet = XLSX.utils.json_to_sheet(salesExportData);
     // Apply currency format
    if(salesWorksheet['!ref']) {
      const range = XLSX.utils.decode_range(salesWorksheet['!ref']);
      for (let R = range.s.r + 1; R <= range.e.r; ++R) {
        ['F', 'G', 'H'].forEach(col => {
            const cell_address = XLSX.utils.encode_cell({c: XLSX.utils.decode_col(col), r: R});
            if(salesWorksheet[cell_address]) salesWorksheet[cell_address].z = '$#,##0.00';
        })
      }
    }
    
    const workbook = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(workbook, summaryWorksheet, 'Resumen');
    XLSX.utils.book_append_sheet(workbook, salesWorksheet, 'Ventas Detalladas');

    XLSX.writeFile(workbook, `Reporte_PuntoFresco_${format(new Date(), 'yyyy-MM-dd')}.xlsx`);
  };

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
              <div className='flex items-center gap-2 flex-wrap'>
                <DateRangePicker range={dateRange} onRangeChange={setDateRange} />
                <Button variant="outline" onClick={handleExportPDF} disabled={loading}><FileDown className="mr-2 h-4 w-4" /> PDF</Button>
                <Button variant="outline" onClick={handleExportExcel} disabled={loading}><FileDown className="mr-2 h-4 w-4" /> Excel</Button>
              </div>
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
