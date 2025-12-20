'use client';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
  DialogClose,
} from '@/components/ui/dialog';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import { Button } from '@/components/ui/button';
import type { Purchase } from '@/lib/types';
import { format } from 'date-fns';
import { es } from 'date-fns/locale';
import { Badge } from './ui/badge';
import { Separator } from './ui/separator';

interface PurchaseDetailsDialogProps {
  isOpen: boolean;
  onClose: () => void;
  purchase: Purchase | null;
  supplierName: string;
}

export default function PurchaseDetailsDialog({
  isOpen,
  onClose,
  purchase,
  supplierName,
}: PurchaseDetailsDialogProps) {
  if (!purchase) return null;

  const purchaseDate = purchase.fecha?.toDate ? purchase.fecha.toDate() : null;

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-2xl">
        <DialogHeader>
          <DialogTitle>Detalles de la Compra</DialogTitle>
          <DialogDescription>
            <span className='font-mono text-xs'>{purchase.id}</span>
          </DialogDescription>
        </DialogHeader>
        
        <div className="grid gap-4 py-4">
            <div className="grid grid-cols-2 gap-4 text-sm">
                <div>
                    <p className="font-semibold">Proveedor:</p>
                    <Badge variant="outline">{supplierName}</Badge>
                </div>
                <div className='text-right'>
                    <p className="font-semibold">Fecha de Compra:</p>
                    <p>{purchaseDate ? format(purchaseDate, 'PPP p', { locale: es }) : 'Fecha inválida'}</p>
                </div>
            </div>

            <Separator />
            
            <h4 className="font-semibold">Artículos Comprados</h4>
            <div className="max-h-[300px] overflow-y-auto border rounded-md">
                <Table>
                    <TableHeader>
                        <TableRow>
                            <TableHead>Producto</TableHead>
                            <TableHead className="text-center">Cantidad</TableHead>
                            <TableHead className="text-right">Costo Unitario</TableHead>
                            <TableHead className="text-right">Subtotal</TableHead>
                        </TableRow>
                    </TableHeader>
                    <TableBody>
                        {purchase.items.map((item, index) => (
                            <TableRow key={index}>
                                <TableCell className="font-medium">{item.nombre}</TableCell>
                                <TableCell className="text-center">{item.cantidad}</TableCell>
                                <TableCell className="text-right">${item.costoUnitario.toFixed(2)}</TableCell>
                                <TableCell className="text-right font-semibold">${(item.cantidad * item.costoUnitario).toFixed(2)}</TableCell>
                            </TableRow>
                        ))}
                    </TableBody>
                </Table>
            </div>
            
            <div className="flex justify-end pt-4">
                <div className="w-full max-w-xs space-y-2">
                     <div className="flex justify-between font-bold text-lg">
                        <span>Total de la Compra:</span>
                        <span className='text-primary'>${purchase.total.toFixed(2)}</span>
                    </div>
                </div>
            </div>

        </div>

        <DialogFooter>
          <DialogClose asChild>
            <Button type="button" variant="secondary">
              Cerrar
            </Button>
          </DialogClose>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
