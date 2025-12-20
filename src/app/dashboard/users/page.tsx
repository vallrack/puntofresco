import { Card, CardHeader, CardTitle, CardDescription, CardContent } from "@/components/ui/card";
import { Construction } from "lucide-react";

export default function UsersPage() {
  return (
    <Card>
      <CardHeader>
        <CardTitle>Usuarios</CardTitle>
        <CardDescription>
          Gestión de usuarios y roles del sistema.
        </CardDescription>
      </CardHeader>
      <CardContent className="flex flex-col items-center justify-center text-center py-16">
        <Construction className="w-16 h-16 text-muted-foreground mb-4" />
        <p className="font-semibold text-muted-foreground">Página en construcción</p>
        <p className="text-sm text-muted-foreground">Aquí se gestionarán los usuarios y sus permisos.</p>
      </CardContent>
    </Card>
  );
}
