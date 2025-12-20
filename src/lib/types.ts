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

export interface Supplier {
  id: string;
  nombre: string;
  telefono?: string;
  email?: string;
  direccion?: string;
}

export interface Purchase {
  id?: string;
  proveedorId: string;
  fecha: any;
  items: {
    productId: string;
    nombre: string;
    cantidad: number;
    costoUnitario: number;
  }[];
  total: number;
}
