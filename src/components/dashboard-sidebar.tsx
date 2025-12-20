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
  ShoppingBasket
} from "lucide-react"

export default function DashboardSidebar() {
  const pathname = usePathname()

  const isActive = (path: string) => {
    if (path === '/dashboard' && pathname !== '/dashboard') return false
    return pathname.startsWith(path)
  }

  return (
    <Sidebar>
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
          <SidebarMenuItem>
            <SidebarMenuButton asChild tooltip="Productos" isActive={isActive('/dashboard/products')}>
              <Link href="/dashboard/products"><Boxes /><span>Productos</span></Link>
            </SidebarMenuButton>
          </SidebarMenuItem>
          <SidebarMenuItem>
            <SidebarMenuButton asChild tooltip="Ventas" isActive={isActive('/dashboard/sales')}>
              <Link href="/dashboard/sales"><ShoppingCart /><span>Ventas</span></Link>
            </SidebarMenuButton>
          </SidebarMenuItem>
          <SidebarMenuItem>
            <SidebarMenuButton asChild tooltip="Compras" isActive={isActive('/dashboard/purchases')}>
              <Link href="/dashboard/purchases"><Truck /><span>Compras</span></Link>
            </SidebarMenuButton>
          </SidebarMenuItem>
          <SidebarMenuItem>
            <SidebarMenuButton asChild tooltip="Reportes" isActive={isActive('/dashboard/reports')}>
              <Link href="/dashboard/reports"><BarChart3 /><span>Reportes</span></Link>
            </SidebarMenuButton>
          </SidebarMenuItem>
          <SidebarMenuItem>
            <SidebarMenuButton asChild tooltip="Usuarios" isActive={isActive('/dashboard/users')}>
              <Link href="/dashboard/users"><Users /><span>Usuarios</span></Link>
            </SidebarMenuButton>
          </SidebarMenuItem>
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
             <SidebarMenuButton asChild tooltip="Configuración">
               <Link href="#"><Settings /><span>Configuración</span></Link>
             </SidebarMenuButton>
           </SidebarMenuItem>
         </SidebarMenu>
      </SidebarFooter>
    </Sidebar>
  )
}
