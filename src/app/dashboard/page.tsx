'use client'
import { Search } from "lucide-react"
import { Input } from "@/components/ui/input"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import ProductCard from "@/components/product-card"
import Cart from "@/components/cart"
import type { Product } from "@/lib/types"
import { useState } from "react"
import { useCollection } from "@/firebase"

export default function DashboardPage() {
  const { data: products, loading } = useCollection<Product>({ path: 'productos' });
  const [searchTerm, setSearchTerm] = useState('');

  const filteredProducts = products?.filter(p => 
    p.nombre.toLowerCase().includes(searchTerm.toLowerCase()) || 
    p.sku.toLowerCase().includes(searchTerm.toLowerCase())
  ) || [];

  const categories = products ? [...new Set(products.map(p => p.categoria))] : [];

  return (
    <div className="grid lg:grid-cols-[1fr_380px] gap-8 items-start">
      <div className="space-y-6">
        <div className="flex items-center gap-4">
          <div className="relative w-full">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-5 w-5 text-muted-foreground" />
            <Input
              placeholder="Buscar por nombre o escanear código de barras..."
              className="pl-10 h-12 text-base"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
            />
          </div>
        </div>
        
        <Tabs defaultValue="all" className="w-full">
          <TabsList className="grid grid-cols-3 sm:grid-cols-5 w-full sm:w-auto">
            <TabsTrigger value="all">Todos</TabsTrigger>
            {categories.map(category => (
              <TabsTrigger key={category} value={category}>{category}</TabsTrigger>
            ))}
          </TabsList>
          
          {loading && <p>Cargando productos...</p>}

          <TabsContent value="all" className="mt-6">
            <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-3 lg:grid-cols-3 xl:grid-cols-4 gap-4">
              {filteredProducts.map(product => <ProductCard key={product.id} product={product} />)}
            </div>
          </TabsContent>
          {categories.map(category => (
            <TabsContent key={category} value={category} className="mt-6">
              <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-3 lg:grid-cols-3 xl:grid-cols-4 gap-4">
                {filteredProducts.filter(p => p.categoria === category).map(product => <ProductCard key={product.id} product={product} />)}
              </div>
            </TabsContent>
          ))}
        </Tabs>
      </div>
      <div className="hidden lg:block lg:sticky top-[76px]">
        <Cart />
      </div>
    </div>
  )
}
