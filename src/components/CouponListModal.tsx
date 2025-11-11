'use client';
import { useState } from 'react';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
  DialogFooter,
  DialogDescription,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { List, ChevronLeft, ChevronRight } from 'lucide-react';
import { ScrollArea } from './ui/scroll-area';

interface CouponListModalProps {
  coupons: string[];
}

const ITEMS_PER_PAGE = 100;

export function CouponListModal({ coupons }: CouponListModalProps) {
  const [currentPage, setCurrentPage] = useState(1);
  const totalPages = Math.ceil(coupons.length / ITEMS_PER_PAGE);

  const startIndex = (currentPage - 1) * ITEMS_PER_PAGE;
  const endIndex = startIndex + ITEMS_PER_PAGE;
  const currentCoupons = coupons.slice(startIndex, endIndex);

  const goToNextPage = () => {
    setCurrentPage((prev) => Math.min(prev + 1, totalPages));
  };

  const goToPreviousPage = () => {
    setCurrentPage((prev) => Math.max(prev - 1, 1));
  };

  return (
    <Dialog>
      <DialogTrigger asChild>
        <Button variant="link" className="text-primary h-auto p-1 mt-1">
            <List className="mr-1 h-4 w-4" /> Ver todos os cupons
        </Button>
      </DialogTrigger>
      <DialogContent className="max-w-md w-full">
        <DialogHeader>
          <DialogTitle>Seus Cupons da Sorte</DialogTitle>
           <DialogDescription>
            Total de {coupons.length} cupons gerados.
          </DialogDescription>
        </DialogHeader>
        <ScrollArea className="h-72 w-full rounded-md border p-4 my-4">
            <div className="grid grid-cols-2 sm:grid-cols-3 gap-2 text-center">
            {currentCoupons.map((coupon, index) => (
                <div key={index} className="bg-muted/50 p-2 rounded-md">
                <p className="font-semibold text-sm text-foreground">🏷️ {coupon}</p>
                </div>
            ))}
            </div>
        </ScrollArea>
         <DialogFooter className="flex-row justify-between items-center w-full">
          <span className="text-sm text-muted-foreground">
            Página {currentPage} de {totalPages}
          </span>
          <div className='flex gap-2'>
            <Button
              variant="outline"
              size="sm"
              onClick={goToPreviousPage}
              disabled={currentPage === 1}
            >
              <ChevronLeft className="h-4 w-4 mr-1" />
              Anterior
            </Button>
            <Button
              variant="outline"
              size="sm"
              onClick={goToNextPage}
              disabled={currentPage === totalPages}
            >
              Próximo
              <ChevronRight className="h-4 w-4 ml-1" />
            </Button>
          </div>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
