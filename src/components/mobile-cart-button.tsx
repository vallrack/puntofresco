'use client';
import { Button } from '@/components/ui/button';
import { Sheet, SheetContent, SheetHeader, SheetTitle, SheetTrigger } from '@/components/ui/sheet';
import { ShoppingCartIcon } from 'lucide-react';
import Cart from './cart';
import { useCartStore } from '@/store/cart';
import { Badge } from './ui/badge';
import { useState } from 'react';

export default function MobileCartButton() {
  const { items } = useCartStore();
  const [open, setOpen] = useState(false);
  const totalItems = items.reduce((acc, item) => acc + item.quantity, 0);

  // Cierra el Sheet después de una venta exitosa (cuando el carrito se vacía)
  if (items.length === 0 && open) {
    setOpen(false);
  }

  return (
    <div className="lg:hidden fixed bottom-4 right-4 z-50">
      <Sheet open={open} onOpenChange={setOpen}>
        <SheetTrigger asChild>
          <Button size="lg" className="rounded-full w-16 h-16 shadow-lg">
            <ShoppingCartIcon className="h-6 w-6" />
            {totalItems > 0 && (
              <Badge
                variant="destructive"
                className="absolute -top-1 -right-1 h-6 w-6 flex items-center justify-center rounded-full"
              >
                {totalItems}
              </Badge>
            )}
            <span className="sr-only">Abrir Carrito</span>
          </Button>
        </SheetTrigger>
        <SheetContent className="w-full sm:max-w-md p-0 flex flex-col">
           <SheetHeader className="p-6 pb-0">
            <SheetTitle>Venta Actual</SheetTitle>
          </SheetHeader>
          <div className="flex-1 overflow-y-auto">
            <Cart />
          </div>
        </SheetContent>
      </Sheet>
    </div>
  );
}
