'use client'
import { useState } from "react"
import { Card, CardContent, CardFooter, CardHeader, CardTitle, CardDescription } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Separator } from "@/components/ui/separator"
import { Trash2, Plus, Minus, ShoppingCart } from "lucide-react"
import Image from "next/image"

type CartItem = {
  id: string;
  name: string;
  price: number;
  quantity: number;
  image: string;
  imageHint: string;
}

export default function Cart() {
  const [items, setItems] = useState<CartItem[]>([
    { id: '1', name: 'Tomates Rojos Frescos', price: 3.50, quantity: 2, image: 'https://picsum.photos/seed/1/400/300', imageHint: 'tomatoes' },
    { id: '2', name: 'Aguacates Maduros', price: 1.75, quantity: 3, image: 'https://picsum.photos/seed/2/400/300', imageHint: 'avocados' },
  ]);

  const subtotal = items.reduce((acc, item) => acc + item.price * item.quantity, 0);
  const taxes = subtotal * 0.07;
  const total = subtotal + taxes;

  if (items.length === 0) {
    return (
      <Card className="shadow-md">
        <CardHeader>
          <CardTitle>Venta Actual</CardTitle>
        </CardHeader>
        <CardContent className="flex flex-col items-center justify-center text-center py-16">
          <ShoppingCart className="w-16 h-16 text-muted-foreground mb-4" />
          <p className="font-semibold text-muted-foreground">El carrito está vacío</p>
          <p className="text-sm text-muted-foreground">Agrega productos para iniciar una venta.</p>
        </CardContent>
      </Card>
    )
  }

  return (
    <Card className="shadow-md">
      <CardHeader>
        <CardTitle>Venta Actual</CardTitle>
        <CardDescription>Revisa los productos antes de cobrar.</CardDescription>
      </CardHeader>
      <CardContent className="p-0">
        <div className="max-h-[calc(100vh-450px)] min-h-[200px] overflow-y-auto px-6 divide-y divide-border">
          {items.map(item => (
            <div key={item.id} className="flex items-center gap-4 py-4 first:pt-0 last:pb-0">
              <Image src={item.image} alt={item.name} width={48} height={48} className="rounded-md object-cover aspect-square" data-ai-hint={item.imageHint} />
              <div className="flex-1 space-y-1">
                <p className="font-medium truncate text-sm">{item.name}</p>
                <div className="flex items-center gap-2">
                  <Button variant="outline" size="icon" className="h-7 w-7"><Minus className="h-3 w-3" /></Button>
                  <span className="font-bold text-sm w-4 text-center">{item.quantity}</span>
                  <Button variant="outline" size="icon" className="h-7 w-7"><Plus className="h-3 w-3" /></Button>
                </div>
              </div>
              <div className="text-right">
                <p className="font-bold text-sm">${(item.price * item.quantity).toFixed(2)}</p>
                <Button variant="ghost" size="icon" className="h-8 w-8 text-muted-foreground hover:text-destructive mt-1 -mr-2">
                  <Trash2 className="h-4 w-4" />
                </Button>
              </div>
            </div>
          ))}
        </div>
      </CardContent>
      <CardFooter className="flex flex-col p-6 space-y-4 bg-card-foreground/5">
        <div className="w-full space-y-2 text-sm">
          <div className="flex justify-between text-muted-foreground">
            <span>Subtotal</span>
            <span className="font-medium text-foreground">${subtotal.toFixed(2)}</span>
          </div>
          <div className="flex justify-between text-muted-foreground">
            <span>Impuestos (7%)</span>
            <span className="font-medium text-foreground">${taxes.toFixed(2)}</span>
          </div>
          <Separator className="my-2" />
          <div className="flex justify-between font-bold text-lg">
            <span>Total</span>
            <span>${total.toFixed(2)}</span>
          </div>
        </div>
        <Button size="lg" className="w-full font-bold text-lg h-12">
          Pagar
        </Button>
      </CardFooter>
    </Card>
  )
}
