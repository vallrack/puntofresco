import { create } from 'zustand';
import type { CartItem, Product } from '@/lib/types';
import { toast } from '@/hooks/use-toast';

interface CartState {
  items: CartItem[];
  addToCart: (product: Product) => void;
  removeFromCart: (productId: string) => void;
  updateQuantity: (productId: string, quantity: number) => void;
  clearCart: () => void;
  subtotal: () => number;
  taxes: () => number;
  total: () => number;
}

export const useCartStore = create<CartState>((set, get) => ({
  items: [],
  addToCart: (product) => {
    const { items } = get();
    const existingItem = items.find((item) => item.id === product.id);

    if (existingItem) {
      if (existingItem.quantity < product.stock) {
        set({
          items: items.map((item) =>
            item.id === product.id
              ? { ...item, quantity: item.quantity + 1 }
              : item
          ),
        });
      } else {
        toast({
          variant: 'destructive',
          title: 'Stock insuficiente',
          description: `No puedes agregar más de ${product.stock} unidades de ${product.nombre}.`,
        });
      }
    } else {
      if (product.stock > 0) {
        set({ items: [...items, { ...product, quantity: 1 }] });
      } else {
         toast({
          variant: 'destructive',
          title: 'Producto sin stock',
          description: `${product.nombre} no tiene unidades disponibles.`,
        });
      }
    }
  },
  removeFromCart: (productId) =>
    set((state) => ({
      items: state.items.filter((item) => item.id !== productId),
    })),
  updateQuantity: (productId, quantity) =>
    set((state) => {
       const itemToUpdate = state.items.find((item) => item.id === productId);
      if (!itemToUpdate) return state;

      if (quantity > itemToUpdate.stock) {
         toast({
          variant: 'destructive',
          title: 'Stock insuficiente',
          description: `No puedes agregar más de ${itemToUpdate.stock} unidades.`,
        });
        return {
          items: state.items.map((item) =>
            item.id === productId ? { ...item, quantity: itemToUpdate.stock } : item
          ),
        };
      }
      
      if (quantity <= 0) {
        return { items: state.items.filter((item) => item.id !== productId) };
      }

      return {
        items: state.items.map((item) =>
          item.id === productId ? { ...item, quantity } : item
        ),
      };
    }),
  clearCart: () => set({ items: [] }),
  subtotal: () => {
    const { items } = get();
    return items.reduce((acc, item) => acc + item.precioVenta * item.quantity, 0);
  },
  taxes: () => {
    // Impuesto eliminado
    return 0;
  },
  total: () => {
    const subtotal = get().subtotal();
    // El total es ahora igual al subtotal
    return subtotal;
  },
}));
