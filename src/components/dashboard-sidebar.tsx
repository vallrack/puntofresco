'use client'
import Link from "next/link"
import { usePathname } from "next/navigation"
import {
  Sidebar,
  SidebarHeader,
  SidebarContent,
  SidebarMenu,
  SidebarMenuItem,
  SidebarMenuButton,
  SidebarFooter,
  SidebarTrigger,
} from "@/components/ui/sidebar"
import {
  LayoutDashboard,
  Boxes,
  ShoppingCart,
  Truck,
  BarChart3,
  Users,
  LifeBuoy,
  Settings,
  ShoppingBasket,
  FolderKanban,
  LogOut,
  Building,
  ArchiveRestore,
} from "lucide-react"
import { useUser } from "@/firebase/auth/use-user"
import { useDoc } from "@/firebase/firestore/use-doc"
import { useEffect, useState } from "react"
import { getAuth, signOut } from "firebase/auth"
import { useRouter } from "next/navigation"
import { useToast } from "@/hooks/use-toast"
import { Button } from "./ui/button"
import { SheetHeader, SheetTitle } from "./ui/sheet"

export default function DashboardSidebar() {
  const pathname = usePathname()
  const { user } = useUser()
  const [userRole, setUserRole] = useState<string | null>(null);
  const router = useRouter();
  const { toast } = useToast();

  const { data: userData } = useDoc<{ rol: string }>({
    path: 'usuarios',
    id: user?.uid,
  });

  useEffect(() => {
    if (userData) {
      setUserRole(userData.rol);
    } else {
      setUserRole(null);
    }
  }, [userData]);


  const isActive = (path: string) => {
    if (path === '/dashboard' && pathname !== '/dashboard') return false
    return pathname.startsWith(path)
  }
  
  const isAdmin = userRole === 'admin' || userRole === 'super_admin';
  const isSuperAdmin = userRole === 'super_admin';
  const isVendedor = userRole === 'vendedor';

  const handleLogout = async () => {
    const auth = getAuth();
    try {
      await signOut(auth);
      toast({
        title: "Sesión cerrada",
        description: "Has cerrado sesión correctamente.",
      });
      router.push('/login');
    } catch (error) {
       toast({
        variant: "destructive",
        title: "Error",
        description: "No se pudo cerrar la sesión.",
      });
    }
  };


  return (
    <Sidebar>
       <SheetHeader className="md:hidden">
        <SheetTitle className="sr-only">Menú Principal</SheetTitle>
      </SheetHeader>
      <SidebarHeader>
        <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
                <div className="inline-block bg-primary p-2 rounded-lg">
                    <ShoppingBasket className="w-6 h-6 text-primary-foreground" />
                </div>
                <span className="text-lg font-semibold font-headline">Punto Fresco</span>
            </div>
            <SidebarTrigger className="hidden group-data-[collapsible=icon]:hidden md:flex" />
        </div>
      </SidebarHeader>
      <SidebarContent>
        <SidebarMenu>
          <SidebarMenuItem>
            <SidebarMenuButton asChild tooltip="Dashboard" isActive={pathname === '/dashboard'}>
              <Link href="/dashboard"><LayoutDashboard /><span>Dashboard</span></Link>
            </SidebarMenuButton>
          </SidebarMenuItem>
          {isAdmin && (
            <>
              <SidebarMenuItem>
                <SidebarMenuButton asChild tooltip="Productos" isActive={isActive('/dashboard/products')}>
                  <Link href="/dashboard/products"><Boxes /><span>Productos</span></Link>
                </SidebarMenuButton>
              </SidebarMenuItem>
              <SidebarMenuItem>
                <SidebarMenuButton asChild tooltip="Categorías" isActive={isActive('/dashboard/categories')}>
                  <Link href="/dashboard/categories"><FolderKanban /><span>Categorías</span></Link>
                </SidebarMenuButton>
              </SidebarMenuItem>
            </>
          )}
          <SidebarMenuItem>
            <SidebarMenuButton asChild tooltip="Ventas" isActive={isActive('/dashboard/sales')}>
              <Link href="/dashboard/sales"><ShoppingCart /><span>Ventas</span></Link>
            </SidebarMenuButton>
          </SidebarMenuItem>
          {isVendedor && (
             <SidebarMenuItem>
                <SidebarMenuButton asChild tooltip="Mi Cierre" isActive={isActive('/dashboard/my-session')}>
                  <Link href="/dashboard/my-session"><ArchiveRestore /><span>Mi Cierre</span></Link>
                </SidebarMenuButton>
              </SidebarMenuItem>
          )}
          {isAdmin && (
            <>
              <SidebarMenuItem>
                <SidebarMenuButton asChild tooltip="Compras" isActive={isActive('/dashboard/purchases')}>
                  <Link href="/dashboard/purchases"><Truck /><span>Compras</span></Link>
                </SidebarMenuButton>
              </SidebarMenuItem>
               <SidebarMenuItem>
                <SidebarMenuButton asChild tooltip="Proveedores" isActive={isActive('/dashboard/suppliers')}>
                  <Link href="/dashboard/suppliers"><Building /><span>Proveedores</span></Link>
                </SidebarMenuButton>
              </SidebarMenuItem>
              <SidebarMenuItem>
                <SidebarMenuButton asChild tooltip="Reportes" isActive={isActive('/dashboard/reports')}>
                  <Link href="/dashboard/reports"><BarChart3 /><span>Reportes</span></Link>
                </SidebarMenuButton>
              </SidebarMenuItem>
            </>
          )}
          {isSuperAdmin && (
            <SidebarMenuItem>
              <SidebarMenuButton asChild tooltip="Usuarios" isActive={isActive('/dashboard/users')}>
                <Link href="/dashboard/users"><Users /><span>Usuarios</span></Link>
              </SidebarMenuButton>
            </SidebarMenuItem>
          )}
        </SidebarMenu>
      </SidebarContent>
      <SidebarFooter>
         <SidebarMenu>
           <SidebarMenuItem>
             <SidebarMenuButton asChild tooltip="Soporte">
               <Link href="#"><LifeBuoy /><span>Soporte</span></Link>
             </SidebarMenuButton>
           </SidebarMenuItem>
           <SidebarMenuItem>
             <SidebarMenuButton asChild tooltip="Configuración" isActive={isActive('/dashboard/settings')}>
               <Link href="/dashboard/settings"><Settings /><span>Configuración</span></Link>
             </SidebarMenuButton>
           </SidebarMenuItem>
           <SidebarMenuItem>
             <SidebarMenuButton onClick={handleLogout} tooltip="Cerrar Sesión">
                <LogOut /><span>Cerrar Sesión</span>
             </SidebarMenuButton>
           </SidebarMenuItem>
         </SidebarMenu>
      </SidebarFooter>
    </Sidebar>
  )
}
