'use client';
import { useCollection, useUser } from '@/firebase';
import type { Sale } from '@/lib/types';


export default function HistorialVentas() {
  const { user } = useUser();

  // Usamos el hook con el filtro por vendedorId
  const { data: ventas, loading } = useCollection<Sale>({
    path: 'ventas',
    query: user ? ['vendedorId', '==', user.uid] : undefined,
  });

  return (
    <div className="p-6 bg-white rounded-lg shadow">
      <h2 className="text-2xl font-bold mb-4">Mi Historial de Ventas</h2>
      
      <div className="overflow-x-auto">
        <table className="w-full text-left border-collapse">
          <thead>
            <tr className="border-b bg-gray-50">
              <th className="p-3 text-sm font-semibold text-gray-600">ID Venta</th>
              <th className="p-3 text-sm font-semibold text-gray-600">Cliente</th>
              <th className="p-3 text-sm font-semibold text-gray-600">Total</th>
              <th className="p-3 text-sm font-semibold text-gray-600">Estado</th>
            </tr>
          </thead>
          <tbody>
            {loading ? (
              // --- SKELETON LOADERS ---
              [...Array(5)].map((_, i) => (
                <tr key={i} className="animate-pulse border-b">
                  <td className="p-3"><div className="h-4 bg-gray-200 rounded w-24"></div></td>
                  <td className="p-3"><div className="h-4 bg-gray-200 rounded w-32"></div></td>
                  <td className="p-3"><div className="h-4 bg-gray-200 rounded w-16"></div></td>
                  <td className="p-3"><div className="h-4 bg-gray-200 rounded w-20"></div></td>
                </tr>
              ))
            ) : ventas && ventas.length > 0 ? (
              // --- DATOS REALES ---
              ventas.map((venta) => (
                <tr key={venta.id} className="border-b hover:bg-gray-50 transition-colors">
                  <td className="p-3 text-sm font-mono text-gray-500">#{(venta.id || '').slice(0, 6)}</td>
                  <td className="p-3 text-sm text-gray-800">{'Consumidor Final'}</td>
                  <td className="p-3 text-sm font-bold text-green-600">${venta.total}</td>
                  <td className="p-3">
                    <span className="px-2 py-1 text-xs bg-blue-100 text-blue-700 rounded-full">Completada</span>
                  </td>
                </tr>
              ))
            ) : (
              // --- ESTADO VACÍO ---
              <tr>
                <td colSpan={4} className="p-10 text-center text-gray-400">
                  No has realizado ventas aún.
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}
