'use client';
import QRCode from 'react-qr-code';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import type { Product } from '@/lib/types';
import { useRef } from 'react';

interface ProductQRModalProps {
  product: Product | null;
  isOpen: boolean;
  onClose: () => void;
}

export default function ProductQRModal({ product, isOpen, onClose }: ProductQRModalProps) {
  const qrCodeRef = useRef<HTMLDivElement>(null);

  if (!product) return null;

  const printQR = () => {
    const printWindow = window.open('', '_blank');
    if (printWindow && qrCodeRef.current) {
        const qrCodeSVG = qrCodeRef.current.innerHTML;
        printWindow.document.write(`
        <html>
          <head>
            <title>Código QR - ${product.nombre}</title>
            <style>
              @media print {
                body { -webkit-print-color-adjust: exact; }
                @page { size: 7cm 10cm; margin: 0; }
                .label-container {
                    display: flex;
                    flex-direction: column;
                    align-items: center;
                    justify-content: center;
                    width: 100%;
                    height: 100%;
                    font-family: sans-serif;
                }
                .product-name {
                    font-size: 14px;
                    font-weight: bold;
                    margin-top: 10px;
                    text-align: center;
                }
                 .product-price {
                    font-size: 20px;
                    font-weight: bold;
                    margin-top: 5px;
                }
                .product-sku {
                    font-size: 10px;
                    margin-top: 5px;
                }
              }
            </style>
          </head>
          <body>
            <div class="label-container">
               ${qrCodeSVG}
               <div class="product-name">${product.nombre}</div>
               <div class="product-price">$${product.precioVenta.toFixed(2)}</div>
               <div class="product-sku">${product.sku}</div>
            </div>
          </body>
        </html>
      `);
      printWindow.document.close();
      printWindow.focus();
      setTimeout(() => {
         printWindow.print();
         printWindow.close();
      }, 250);
    }
  };


  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>Código QR para: {product.nombre}</DialogTitle>
          <DialogDescription>
            Escanea este código para encontrar el producto rápidamente. Puedes imprimirlo como etiqueta.
          </DialogDescription>
        </DialogHeader>
        <div className="flex justify-center p-4 bg-white" ref={qrCodeRef}>
          <QRCode
            value={product.sku}
            size={256}
            style={{ height: "auto", maxWidth: "100%", width: "100%" }}
            viewBox={`0 0 256 256`}
          />
        </div>
        <p className="text-center text-sm text-muted-foreground font-mono">{product.sku}</p>
        <DialogFooter className="sm:justify-end">
          <Button type="button" variant="secondary" onClick={onClose}>
            Cerrar
          </Button>
           <Button type="button" onClick={printQR}>
            Imprimir Etiqueta
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
