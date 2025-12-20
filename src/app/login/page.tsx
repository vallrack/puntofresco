import { Button } from "@/components/ui/button"
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { ShoppingBasket } from "lucide-react"
import Link from "next/link"

export default function LoginPage() {
  return (
    <div className="flex items-center justify-center min-h-screen bg-background p-4">
      <Card className="w-full max-w-sm mx-auto border-2 border-primary/20 shadow-lg shadow-primary/10">
        <CardHeader className="space-y-2 text-center">
          <div className="inline-block bg-primary p-3 rounded-full mx-auto shadow-md">
            <ShoppingBasket className="w-8 h-8 text-primary-foreground" />
          </div>
          <CardTitle className="text-2xl font-bold font-headline">Punto Fresco</CardTitle>
          <CardDescription>
            Ingresa tus credenciales para acceder al sistema.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <form className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="email">Email</Label>
              <Input
                id="email"
                type="email"
                placeholder="admin@puntofresco.com"
                required
              />
            </div>
            <div className="space-y-2">
              <div className="flex items-center">
                <Label htmlFor="password">Contraseña</Label>
                <Link
                  href="#"
                  className="ml-auto inline-block text-sm underline"
                >
                  ¿Olvidaste tu contraseña?
                </Link>
              </div>
              <Input id="password" type="password" required />
            </div>
            <Button type="submit" className="w-full font-semibold">
              Iniciar Sesión
            </Button>
          </form>
        </CardContent>
        <CardFooter className="text-center text-sm">
            <p className="w-full">
                ¿No tienes una cuenta? Contacta al administrador.
            </p>
        </CardFooter>
      </Card>
    </div>
  )
}
