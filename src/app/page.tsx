import Link from 'next/link';
import { Button } from '@/components/ui/button';
import { ShoppingBasket } from 'lucide-react';

export default function Home() {
  return (
    <div className="flex flex-col items-center justify-center min-h-screen bg-background text-foreground">
      <div className="text-center space-y-4 p-4">
        <div className="inline-block bg-primary p-4 rounded-full shadow-lg shadow-primary/30">
          <ShoppingBasket className="w-16 h-16 text-primary-foreground" />
        </div>
        <h1 className="text-5xl font-bold font-headline tracking-tighter sm:text-6xl">
          Punto Fresco
        </h1>
        <p className="text-xl text-muted-foreground max-w-md mx-auto">
          Gestión de inventario y punto de venta para tu negocio. Rápido, visual y siempre fresco.
        </p>
        <div className="flex flex-col sm:flex-row gap-4 justify-center pt-4">
          <Button asChild size="lg" variant="outline" className="font-semibold">
            <Link href="/login">Iniciar Sesión</Link>
          </Button>
        </div>
      </div>
    </div>
  );
}
