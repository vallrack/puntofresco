import { Card, CardHeader, CardTitle, CardDescription, CardContent } from "@/components/ui/card";
import { Construction } from "lucide-react";

export default function PurchasesPage() {
  return (
    <Card>
      <CardHeader>
        <CardTitle>Compras</CardTitle>
        <CardDescription>
          Registro de compras a proveedores y actualización de stock.
        </CardDescription>
      </CardHeader>
      <CardContent className="flex flex-col items-center justify-center text-center py-16">
        <Construction className="w-16 h-16 text-muted-foreground mb-4" />
        <p className="font-semibold text-muted-foreground">Página en construcción</p>
        <p className="text-sm text-muted-foreground">Aquí se registrarán las compras a proveedores.</p>
      </CardContent>
    </Card>
  );
}
