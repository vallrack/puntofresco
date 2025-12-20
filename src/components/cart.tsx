'use client'
import { Card, CardContent, CardFooter, CardHeader, CardTitle, CardDescription } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Separator } from "@/components/ui/separator"
import { Trash2, Plus, Minus, ShoppingCart, XCircle } from "lucide-react"
import Image from "next/image"
import { useCartStore } from "@/store/cart"
import { useUser, useFirestore } from "@/firebase"
import { processSale } from "@/lib/sales"
import { useToast } from "@/hooks/use-toast"
import { useState } from "react"
import type { Sale, PaymentMethod } from "@/lib/types"
import ReceiptModal from "./receipt-modal"
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
  DialogClose,
} from '@/components/ui/dialog';

export default function Cart() {
  const { 
    items, 
    removeFromCart, 
    updateQuantity, 
    clearCart,
    subtotal, 
    taxes, 
    total 
  } = useCartStore();
  
  const { user } = useUser();
  const firestore = useFirestore();
  const { toast } = useToast();
  const [isProcessing, setIsProcessing] = useState(false);
  const [completedSale, setCompletedSale] = useState<Sale | null>(null);
  const [isPaymentModalOpen, setIsPaymentModalOpen] = useState(false);

  const handleOpenPaymentModal = () => {
    if (items.length > 0) {
      setIsPaymentModalOpen(true);
    } else {
      toast({
        variant: "destructive",
        title: "Carrito vacío",
        description: "Agrega productos para iniciar una venta.",
      });
    }
  }

  const handlePayment = async (metodoPago: PaymentMethod) => {
    setIsPaymentModalOpen(false);

    if (!user || !firestore) {
      toast({
        variant: "destructive",
        title: "Error",
        description: "Debes iniciar sesión para realizar una venta.",
      });
      return;
    }

    setIsProcessing(true);
    const saleData: Omit<Sale, 'id' | 'fecha'> = {
      vendedorId: user.uid,
      items: items.map(item => ({
        productId: item.id,
        nombre: item.nombre,
        quantity: item.quantity,
        precioVenta: item.precioVenta,
      })),
      total: total(),
      metodoPago: metodoPago,
    };

    try {
      const saleId = await processSale(firestore, saleData);
      toast({
        title: "Venta completada",
        description: `Venta con ${metodoPago} registrada correctamente.`,
      });
      
      const finalSaleData: Sale = {
        ...saleData,
        id: saleId,
        fecha: new Date(), // Usamos una fecha local para mostrar el recibo inmediatamente
      };

      setCompletedSale(finalSaleData);
      clearCart();
    } catch (error: any) {
      console.error("Error processing sale: ", error);
      toast({
        variant: "destructive",
        title: "Error al procesar la venta",
        description: error.message || "No se pudo completar la transacción.",
      });
    } finally {
      setIsProcessing(false);
    }
  };


  if (items.length === 0) {
    return (
       <>
        <Card className="shadow-lg border-primary/20">
          <CardHeader>
            <CardTitle>Venta Actual</CardTitle>
          </CardHeader>
          <CardContent className="flex flex-col items-center justify-center text-center py-20 bg-card">
            <ShoppingCart className="w-16 h-16 text-muted-foreground/50 mb-4" />
            <p className="font-semibold text-muted-foreground">El carrito está vacío</p>
            <p className="text-sm text-muted-foreground">Agrega productos para iniciar una venta.</p>
          </CardContent>
        </Card>
        {completedSale && (
          <ReceiptModal
            sale={completedSale}
            isOpen={!!completedSale}
            onClose={() => setCompletedSale(null)}
          />
        )}
      </>
    )
  }

  return (
    <>
      <Card className="shadow-lg border-primary/20">
        <CardHeader className="flex flex-row items-center justify-between">
            <div>
                <CardTitle>Venta Actual</CardTitle>
                <CardDescription>{items.length} producto(s)</CardDescription>
            </div>
            <Button variant="ghost" size="icon" className="text-muted-foreground hover:text-destructive" onClick={clearCart}>
                <XCircle className="w-5 h-5"/>
                <span className="sr-only">Limpiar Carrito</span>
            </Button>
        </CardHeader>
        <CardContent className="p-0">
          <div className="max-h-[calc(100vh-480px)] min-h-[150px] overflow-y-auto px-6 divide-y divide-border">
            {items.map(item => (
              <div key={item.id} className="flex items-center gap-4 py-4 first:pt-0 last:pb-0">
                <Image src={item.imageUrl} alt={item.nombre} width={48} height={48} className="rounded-md object-cover aspect-square" data-ai-hint={item.imageHint} />
                <div className="flex-1 space-y-1">
                  <p className="font-medium truncate text-sm">{item.nombre}</p>
                  <div className="flex items-center gap-2">
                    <Button variant="outline" size="icon" className="h-7 w-7" onClick={() => updateQuantity(item.id, item.quantity - 1)}><Minus className="h-3 w-3" /></Button>
                    <span className="font-bold text-sm w-4 text-center">{item.quantity}</span>
                    <Button variant="outline" size="icon" className="h-7 w-7" onClick={() => updateQuantity(item.id, item.quantity + 1)}><Plus className="h-3 w-3" /></Button>
                  </div>
                </div>
                <div className="text-right">
                  <p className="font-bold text-sm">${(item.precioVenta * item.quantity).toFixed(2)}</p>
                  <Button variant="ghost" size="icon" className="h-8 w-8 text-muted-foreground hover:text-destructive mt-1 -mr-2" onClick={() => removeFromCart(item.id)}>
                    <Trash2 className="h-4 w-4" />
                  </Button>
                </div>
              </div>
            ))}
          </div>
        </CardContent>
        <CardFooter className="flex flex-col p-6 space-y-4 bg-muted/50">
          <div className="w-full space-y-2 text-sm">
            <div className="flex justify-between text-muted-foreground">
              <span>Subtotal</span>
              <span className="font-medium text-foreground">${subtotal().toFixed(2)}</span>
            </div>
            <div className="flex justify-between text-muted-foreground">
              <span>Impuestos (7%)</span>
              <span className="font-medium text-foreground">${taxes().toFixed(2)}</span>
            </div>
            <Separator className="my-2" />
            <div className="flex justify-between font-bold text-lg">
              <span>Total</span>
              <span>${total().toFixed(2)}</span>
            </div>
          </div>
          <Button size="lg" className="w-full font-bold text-lg h-14" onClick={handleOpenPaymentModal} disabled={isProcessing}>
             {isProcessing ? 'Procesando...' : `Pagar $${total().toFixed(2)}`}
          </Button>
        </CardFooter>
      </Card>
      
      <Dialog open={isPaymentModalOpen} onOpenChange={setIsPaymentModalOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Seleccionar Método de Pago</DialogTitle>
            <DialogDescription>El total de la venta es ${total().toFixed(2)}</DialogDescription>
          </DialogHeader>
          <div className="grid grid-cols-1 gap-4 py-4">
            <Button size="lg" variant="outline" onClick={() => handlePayment('Efectivo')} disabled={isProcessing}>Efectivo</Button>
            <Button size="lg" variant="outline" onClick={() => handlePayment('Tarjeta')} disabled={isProcessing}>Tarjeta</Button>
            <Button size="lg" variant="outline" onClick={() => handlePayment('Transferencia')} disabled={isProcessing}>Transferencia</Button>
          </div>
          <DialogFooter>
            <DialogClose asChild>
                <Button type="button" variant="secondary">Cancelar</Button>
            </DialogClose>
          </DialogFooter>
        </DialogContent>
      </Dialog>
      
      {completedSale && (
        <ReceiptModal
          sale={completedSale}
          isOpen={!!completedSale}
          onClose={() => setCompletedSale(null)}
        />
      )}
    </>
  )
}
