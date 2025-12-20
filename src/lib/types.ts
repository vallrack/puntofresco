export interface Product {
  id: string;
  name: string;
  sku: string;
  imageUrl: string;
  imageHint: string;
  category: string;
  purchasePrice: number;
  sellingPrice: number;
  stock: number;
  minStock: number;
  creadoPor?: string;
  actualizadoPor?: string;
  fechaCreacion?: any;
  fechaActualizacion?: any;
}
