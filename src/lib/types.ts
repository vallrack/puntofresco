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
  creadoPor: string;
  actualizadoPor: string;
  fechaCreacion: any;
  fechaActualizacion: any;
}

export interface CartItem extends Product {
  quantity: number;
}

export type PaymentMethod = "Efectivo" | "Tarjeta" | "Transferencia";

export interface Sale {
  id?: string;
  vendedorId: string;
  items: {
    productId: string;
    nombre: string;
    quantity: number;
    precioVenta: number;
  }[];
  total: number;
  fecha: any;
  metodoPago: PaymentMethod;
}

export interface Category {
  id: string;
  nombre: string;
}
