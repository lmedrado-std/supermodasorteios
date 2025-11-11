'use client';
import { useState } from 'react';
import { useFirestore, useCollection, useMemoFirebase } from '@/firebase';
import {
  collection,
  doc,
  getDocs,
  addDoc,
  query,
  orderBy,
  limit,
} from 'firebase/firestore';
import { Button } from '@/components/ui/button';
import {
  Card,
  CardHeader,
  CardTitle,
  CardDescription,
  CardContent,
  CardFooter,
} from '@/components/ui/card';
import { useToast } from '@/hooks/use-toast';
import { Loader2, PartyPopper, Ticket, User, Trophy } from 'lucide-react';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from '@/components/ui/alert-dialog';
import { format } from 'date-fns';

type Coupon = {
  id: string;
  fullName: string;
  cpf: string;
  couponNumber: string;
};

type WinnerInfo = {
  id: string;
  couponId: string;
  couponNumber: string;
  fullName: string;
  cpf: string;
  drawDate: {
    seconds: number;
    nanoseconds: number;
  };
};

export function RaffleManager() {
  const firestore = useFirestore();
  const { toast } = useToast();
  const [isDrawing, setIsDrawing] = useState(false);
  
  const lastWinnerQuery = useMemoFirebase(
    () => firestore ? query(collection(firestore, 'winners'), orderBy('drawDate', 'desc'), limit(1)) : null,
    [firestore]
  );
  
  const { data: lastWinnerArr, isLoading: isWinnerLoading } = useCollection<WinnerInfo>(lastWinnerQuery);
  const lastWinner = lastWinnerArr?.[0];

  const handleDraw = async () => {
    if (!firestore) return;
    setIsDrawing(true);

    try {
      const couponsRef = collection(firestore, 'coupons');
      const snapshot = await getDocs(couponsRef);

      if (snapshot.empty) {
        toast({
          variant: 'destructive',
          title: 'Sorteio não realizado',
          description: 'Não há cupons cadastrados para sortear.',
        });
        setIsDrawing(false);
        return;
      }

      const allCoupons = snapshot.docs.map((doc) => ({ id: doc.id, ...doc.data() } as Coupon));
      const randomIndex = Math.floor(Math.random() * allCoupons.length);
      const drawnCoupon = allCoupons[randomIndex];

      const winnerData = {
        couponId: drawnCoupon.id,
        couponNumber: drawnCoupon.couponNumber,
        fullName: drawnCoupon.fullName,
        cpf: drawnCoupon.cpf,
        drawDate: new Date(),
      };
      
      const winnersRef = collection(firestore, 'winners');
      await addDoc(winnersRef, winnerData);

      toast({
        title: 'Sorteio Realizado!',
        description: `O cupom ${winnerData.couponNumber} é o vencedor!`,
      });

    } catch (error) {
      console.error('Error during raffle draw:', error);
      toast({
        variant: 'destructive',
        title: 'Erro no Sorteio',
        description: 'Não foi possível realizar o sorteio. Tente novamente.',
      });
    } finally {
      setIsDrawing(false);
    }
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle>Realizar Sorteio</CardTitle>
        <CardDescription>
          Clique no botão para sortear um cupom vencedor dentre todos os
          cadastrados. O resultado será salvo no histórico.
        </CardDescription>
      </CardHeader>
      <CardContent className="flex items-center justify-center p-6 min-h-[250px]">
        {isWinnerLoading ? (
            <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
        ) : lastWinner ? (
          <div className="text-center animate-in fade-in-50">
             <Trophy className="h-12 w-12 mx-auto text-amber-500" />
             <h3 className="text-lg font-semibold mt-4">Último Ganhador Sorteado</h3>
             <div className="mt-4 p-4 bg-primary/10 rounded-lg border-2 border-dashed border-primary">
                <p className="text-2xl font-bold text-primary tracking-wider">{lastWinner.couponNumber}</p>
                <div className="mt-2 text-left space-y-1 text-sm">
                    <p className="flex items-center gap-2"><User className="h-4 w-4 text-muted-foreground"/> <strong>Nome:</strong> {lastWinner.fullName}</p>
                    <p className="flex items-center gap-2"><Ticket className="h-4 w-4 text-muted-foreground"/> <strong>CPF:</strong> {lastWinner.cpf.replace(/(\d{3})(\d{3})(\d{3})(\d{2})/, '$1.$2.$3-$4')}</p>
                </div>
             </div>
             <p className="text-xs text-muted-foreground mt-2">
                Sorteio realizado em: {format(new Date(lastWinner.drawDate.seconds * 1000), 'dd/MM/yyyy HH:mm')}
             </p>
          </div>
        ) : (
          <p className="text-muted-foreground">Nenhum sorteio realizado ainda.</p>
        )}
      </CardContent>
      <CardFooter>
        <AlertDialog>
          <AlertDialogTrigger asChild>
            <Button disabled={isDrawing}>
              {isDrawing ? (
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
              ) : (
                <PartyPopper className="mr-2 h-4 w-4" />
              )}
              {isDrawing ? 'Sorteando...' : 'Sortear Novo Ganhador'}
            </Button>
          </AlertDialogTrigger>
          <AlertDialogContent>
            <AlertDialogHeader>
              <AlertDialogTitle>Você tem certeza?</AlertDialogTitle>
              <AlertDialogDescription>
                Esta ação irá realizar um novo sorteio e registrar o resultado no histórico de vencedores. A ação não pode ser desfeita.
              </AlertDialogDescription>
            </AlertDialogHeader>
            <AlertDialogFooter>
              <AlertDialogCancel>Cancelar</AlertDialogCancel>
              <AlertDialogAction onClick={handleDraw}>
                Sim, Sortear
              </AlertDialogAction>
            </AlertDialogFooter>
          </AlertDialogContent>
        </AlertDialog>
      </CardFooter>
    </Card>
  );
}
