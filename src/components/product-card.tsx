'use client'
import Image from "next/image"
import { Card, CardContent, CardFooter } from "@/components/ui/card"
import type { Product } from "@/lib/types"
import { Button } from "@/components/ui/button"
import { PlusCircle, TriangleAlert } from "lucide-react"
import { Badge } from "@/components/ui/badge"

type ProductCardProps = {
  product: Product;
}

export default function ProductCard({ product }: ProductCardProps) {
  const isLowStock = product.stock <= product.minStock;

  return (
    <Card className="overflow-hidden group cursor-pointer relative shadow-md hover:shadow-lg transition-shadow duration-300">
      <div className="overflow-hidden">
        <Image
          src={product.imageUrl}
          alt={product.name}
          width={400}
          height={300}
          className="aspect-[4/3] object-cover group-hover:scale-105 transition-transform duration-300"
          data-ai-hint={product.imageHint}
        />
      </div>
      {isLowStock && (
          <div title="Stock bajo" className="absolute top-2 right-2 bg-accent p-1.5 rounded-full z-10 shadow-lg">
              <TriangleAlert className="w-5 h-5 text-accent-foreground" />
          </div>
      )}
       <div className="absolute top-2 left-2 z-10">
          <Badge variant="secondary">{product.stock} en stock</Badge>
      </div>

      <CardContent className="p-3">
        <h3 className="font-semibold truncate text-base">{product.name}</h3>
      </CardContent>
      <CardFooter className="p-3 pt-0">
        <p className="text-lg font-bold w-full">${product.sellingPrice.toFixed(2)}</p>
      </CardFooter>
      <div className="absolute inset-0 bg-black/60 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity duration-300">
        <Button variant="secondary" size="lg" className="font-semibold">
          <PlusCircle className="mr-2" />
          Agregar
        </Button>
      </div>
    </Card>
  )
}
