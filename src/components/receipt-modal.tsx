'use client';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import type { Sale } from '@/lib/types';
import { useRef } from 'react';
import { Separator } from './ui/separator';
import { ShoppingBasket, Printer } from 'lucide-react';

interface ReceiptModalProps {
  sale: Sale;
  isOpen: boolean;
  onClose: () => void;
}

export default function ReceiptModal({ sale, isOpen, onClose }: ReceiptModalProps) {
  const receiptRef = useRef<HTMLDivElement>(null);
  const taxes = sale.total / 1.07 * 0.07;
  const subtotal = sale.total - taxes;

  const handlePrint = () => {
    const printWindow = window.open('', '_blank');
    if (printWindow && receiptRef.current) {
      const receiptHTML = receiptRef.current.innerHTML;
      const printStyles = `
        <style>
          @page {
            size: 7cm auto; /* Ancho de impresora térmica, altura automática */
            margin: 0.5cm;
          }
          body {
            font-family: 'Inter', sans-serif;
            margin: 0;
            padding: 0;
            color: #1a202c;
            line-height: 1.5;
            -webkit-print-color-adjust: exact;
          }
          .receipt-container {
             width: 100%;
             margin: 0 auto;
          }
          .header {
            text-align: center;
            margin-bottom: 1rem;
          }
          .header svg {
            margin: 0 auto;
            width: 40px;
            height: 40px;
          }
          .header h1 {
            font-size: 1.2rem;
            font-weight: 700;
            margin: 0.5rem 0 0;
          }
          .header p {
            font-size: 0.75rem;
            color: #718096;
            margin: 0;
          }
          .details, .items, .totals {
             font-size: 0.8rem;
          }
          .details {
             border-top: 1px dashed #cbd5e0;
             border-bottom: 1px dashed #cbd5e0;
             padding: 0.5rem 0;
             margin-bottom: 1rem;
          }
          .details-row {
            display: flex;
            justify-content: space-between;
          }
          .item-row {
            display: flex;
            margin-bottom: 0.5rem;
          }
          .item-info {
            flex-grow: 1;
            margin-right: 0.5rem;
          }
          .item-info p {
            margin: 0;
          }
          .item-name {
            font-weight: 500;
          }
          .item-qty-price {
            font-size: 0.75rem;
            color: #4a5568;
          }
          .item-total {
            font-weight: 500;
            text-align: right;
          }
          .totals {
            border-top: 1px dashed #cbd5e0;
            padding-top: 1rem;
          }
          .footer {
            text-align: center;
            margin-top: 1.5rem;
            font-size: 0.75rem;
          }
        </style>
      `;

      printWindow.document.write(`
        <html>
          <head>
            <title>Recibo - Venta #${sale.id?.substring(0, 6)}</title>
            ${printStyles}
          </head>
          <body>
            <div class="receipt-container">
                ${receiptHTML}
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
      <DialogContent className="sm:max-w-sm">
        <div ref={receiptRef} className="p-4 pt-0">
          <div className="header text-center mb-4">
            <ShoppingBasket className="mx-auto w-10 h-10 text-primary" />
            <DialogTitle className="text-xl font-bold">Punto Fresco</DialogTitle>
            <p className="text-xs text-muted-foreground">
              Gracias por su compra
            </p>
          </div>

          <div className="details text-xs my-4 py-2 border-t border-b border-dashed">
            <div className="details-row">
              <span>Recibo N°:</span>
              <span>{sale.id?.substring(0, 6).toUpperCase()}</span>
            </div>
            <div className="details-row">
              <span>Fecha:</span>
              <span>{new Date(sale.fecha).toLocaleDateString()}</span>
            </div>
            <div className="details-row">
              <span>Hora:</span>
              <span>{new Date(sale.fecha).toLocaleTimeString()}</span>
            </div>
            <div className="details-row">
              <span>Pagado con:</span>
              <span>{sale.metodoPago}</span>
            </div>
          </div>
          
          <div className="items my-4">
            {sale.items.map((item) => (
              <div key={item.productId} className="item-row text-sm mb-2">
                <div className="item-info">
                  <p className="item-name">{item.nombre}</p>
                  <p className="item-qty-price text-xs text-muted-foreground">
                    {item.quantity} x ${item.precioVenta.toFixed(2)}
                  </p>
                </div>
                <p className="item-total font-medium">
                  ${(item.quantity * item.precioVenta).toFixed(2)}
                </p>
              </div>
            ))}
          </div>
          
          <Separator orientation="horizontal" className="my-2 border-dashed" />

          <div className="totals space-y-1 text-sm pt-2">
            <div className="flex justify-between text-muted-foreground">
              <span>Subtotal:</span>
              <span className="font-medium text-foreground">${subtotal.toFixed(2)}</span>
            </div>
            <div className="flex justify-between text-muted-foreground">
              <span>Impuestos (7%):</span>
              <span className="font-medium text-foreground">${taxes.toFixed(2)}</span>
            </div>
            <div className="flex justify-between text-lg font-bold mt-2">
              <span>Total:</span>
              <span>${sale.total.toFixed(2)}</span>
            </div>
          </div>

          <div className="footer text-center mt-6 text-xs text-muted-foreground">
            <p>¡Vuelva pronto!</p>
          </div>
        </div>
        <DialogFooter className="mt-4 flex-row justify-end gap-2">
          <Button type="button" variant="secondary" onClick={onClose}>
            Cerrar
          </Button>
          <Button type="button" onClick={handlePrint}>
            <Printer className="mr-2 h-4 w-4" />
            Imprimir
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
