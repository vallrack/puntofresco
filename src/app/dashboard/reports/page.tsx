import { Card, CardHeader, CardTitle, CardDescription, CardContent } from "@/components/ui/card";
import { Construction } from "lucide-react";

export default function ReportsPage() {
  return (
    <Card>
      <CardHeader>
        <CardTitle>Reportes</CardTitle>
        <CardDescription>
          Análisis de ganancias, pérdidas y rendimiento del negocio.
        </CardDescription>
      </CardHeader>
      <CardContent className="flex flex-col items-center justify-center text-center py-16">
        <Construction className="w-16 h-16 text-muted-foreground mb-4" />
        <p className="font-semibold text-muted-foreground">Página en construcción</p>
        <p className="text-sm text-muted-foreground">Aquí se visualizarán los reportes financieros y de ventas.</p>
      </CardContent>
    </Card>
  );
}
