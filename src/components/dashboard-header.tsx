'use client'
import { Button } from "@/components/ui/button"
import {
  Bell,
} from "lucide-react"
import { SidebarTrigger } from "@/components/ui/sidebar"
import UserMenuClient from "./user-menu"

export default function DashboardHeader() {
  return (
    <header className="flex h-14 shrink-0 items-center gap-4 border-b bg-card px-4 sticky top-0 z-30 lg:h-[60px] lg:px-6">
      <SidebarTrigger className="md:hidden" />
      <div className="w-full flex-1" />
      <Button variant="ghost" size="icon" className="rounded-full">
        <Bell className="h-5 w-5" />
        <span className="sr-only">Toggle notifications</span>
      </Button>
      <UserMenuClient />
    </header>
  )
}
