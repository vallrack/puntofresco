export interface Product {
  id: string;
  nombre: string;
  sku: string;
  imageUrl: string;
  imageHint: string;
  categoria: string;
  precioCompra: number;
  precioVenta: number;
  stock: number;
  stockMinimo: number;
  creadoPor?: string;
  actualizadoPor?: string;
  fechaCreacion?: any;
  fechaActualizacion?: any;
}
