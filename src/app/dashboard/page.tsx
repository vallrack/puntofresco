'use client'
import { Search } from "lucide-react"
import { Input } from "@/components/ui/input"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import ProductCard from "@/components/product-card"
import Cart from "@/components/cart"
import { PlaceHolderImages } from "@/lib/placeholder-images"
import type { Product } from "@/lib/types"
import { useState } from "react"

const mockProducts: Product[] = PlaceHolderImages.map((p, i) => ({
  id: p.id,
  name: p.description,
  sku: `SKU-00${i+1}`,
  imageUrl: p.imageUrl,
  imageHint: p.imageHint,
  category: i % 4 === 0 ? 'Frutas' : i % 4 === 1 ? 'Verduras' : i % 4 === 2 ? 'Lácteos' : 'Abarrotes',
  purchasePrice: Math.random() * 2 + 0.5,
  sellingPrice: Math.random() * 3 + 2.5,
  stock: Math.floor(Math.random() * 100),
  minStock: 10,
}));

export default function DashboardPage() {
  const [products] = useState<Product[]>(mockProducts);
  const categories = [...new Set(products.map(p => p.category))];

  return (
    <div className="grid lg:grid-cols-[1fr_380px] gap-8 items-start">
      <div className="space-y-6">
        <div className="flex items-center gap-4">
          <div className="relative w-full">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-5 w-5 text-muted-foreground" />
            <Input
              placeholder="Buscar por nombre o escanear código de barras..."
              className="pl-10 h-12 text-base"
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
          <TabsContent value="all" className="mt-6">
            <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-3 lg:grid-cols-3 xl:grid-cols-4 gap-4">
              {products.map(product => <ProductCard key={product.id} product={product} />)}
            </div>
          </TabsContent>
          {categories.map(category => (
            <TabsContent key={category} value={category} className="mt-6">
              <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-3 lg:grid-cols-3 xl:grid-cols-4 gap-4">
                {products.filter(p => p.category === category).map(product => <ProductCard key={product.id} product={product} />)}
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
