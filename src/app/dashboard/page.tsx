'use client'
import { Search } from "lucide-react"
import { Input } from "@/components/ui/input"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import ProductCard from "@/components/product-card"
import Cart from "@/components/cart"
import type { Product } from "@/lib/types"
import { useState, useMemo, useEffect, useRef } from "react"
import { useCollection } from "@/firebase"
import MobileCartButton from "@/components/mobile-cart-button"

export default function DashboardPage() {
  const { data: products, loading } = useCollection<Product>({ path: 'productos' });
  const [searchTerm, setSearchTerm] = useState('');
  const searchInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    // Auto-focus the search input on component mount
    searchInputRef.current?.focus();
  }, []);

  const filteredProducts = useMemo(() => {
    if (!products) return [];
    if (!searchTerm) return products;
    return products.filter(p => 
      p.nombre.toLowerCase().includes(searchTerm.toLowerCase()) || 
      p.sku.toLowerCase().includes(searchTerm.toLowerCase())
    );
  }, [products, searchTerm]);

  const categories = useMemo(() => {
    return products ? [...new Set(products.map(p => p.categoria))].sort() : [];
  }, [products]);

  return (
    <>
      <div className="grid lg:grid-cols-[1fr_400px] gap-8 items-start">
        <div className="space-y-6">
          <div className="flex items-center gap-4">
            <div className="relative w-full">
              <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 h-5 w-5 text-muted-foreground" />
              <Input
                ref={searchInputRef}
                placeholder="Buscar por nombre o escanear código..."
                className="pl-12 h-14 text-base md:text-lg"
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
              />
            </div>
          </div>
          
          {loading && <p className="text-center text-muted-foreground">Cargando productos...</p>}

          {!loading && products && (
            <Tabs defaultValue="all" className="w-full">
              <div className="overflow-x-auto pb-2">
                <TabsList className="grid grid-cols-2 sm:grid-cols-3 md:flex md:flex-wrap md:w-auto">
                  <TabsTrigger value="all">Todos</TabsTrigger>
                  {categories.map(category => (
                    <TabsTrigger key={category} value={category}>{category}</TabsTrigger>
                  ))}
                </TabsList>
              </div>
              
              <TabsContent value="all" className="mt-6">
                <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 xl:grid-cols-5 gap-4">
                  {filteredProducts.map(product => <ProductCard key={product.id} product={product} />)}
                </div>
                 {filteredProducts.length === 0 && !loading && searchTerm && (
                  <div className="text-center py-16">
                    <p className="text-muted-foreground">No se encontraron productos para "{searchTerm}".</p>
                  </div>
                )}
              </TabsContent>
              {categories.map(category => (
                <TabsContent key={category} value={category} className="mt-6">
                  <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 xl:grid-cols-5 gap-4">
                    {filteredProducts.filter(p => p.categoria === category).map(product => <ProductCard key={product.id} product={product} />)}
                  </div>
                </TabsContent>
              ))}
            </Tabs>
          )}
        </div>
        <div className="hidden lg:block lg:sticky top-[76px]">
          <Cart />
        </div>
      </div>
      <MobileCartButton />
    </>
  )
}
