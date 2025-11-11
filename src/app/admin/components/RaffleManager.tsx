'use client';
import { useState } from 'react';
import { useFirestore, useMemoFirebase } from '@/firebase';
import {
  collection,
  doc,
  getDocs,
  setDoc,
  getDoc,
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
import { Loader2, PartyPopper, Ticket, User } from 'lucide-react';
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

type Coupon = {
  id: string;
  fullName: string;
  cpf: string;
  couponNumber: string;
};

type WinnerInfo = {
  couponId: string;
  couponNumber: string;
  fullName: string;
  cpf: string;
  drawDate: string;
};

export function RaffleManager() {
  const firestore = useFirestore();
  const { toast } = useToast();
  const [isDrawing, setIsDrawing] = useState(false);
  const [winner, setWinner] = useState<WinnerInfo | null>(null);

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
        return;
      }

      const allCoupons = snapshot.docs.map((doc) => ({ id: doc.id, ...doc.data() } as Coupon));
      const randomIndex = Math.floor(Math.random() * allCoupons.length);
      const drawnCoupon = allCoupons[randomIndex];

      const winnerData: WinnerInfo = {
        couponId: drawnCoupon.id,
        couponNumber: drawnCoupon.couponNumber,
        fullName: drawnCoupon.fullName,
        cpf: drawnCoupon.cpf,
        drawDate: new Date().toISOString(),
      };
      
      const settingsRef = doc(firestore, 'settings/raffle');
      await setDoc(settingsRef, { winner: winnerData }, { merge: true });

      setWinner(winnerData);
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

  const fetchWinner = async () => {
    if (!firestore) return;
    const settingsRef = doc(firestore, 'settings/raffle');
    const settingsDoc = await getDoc(settingsRef);
    if (settingsDoc.exists() && settingsDoc.data().winner) {
      setWinner(settingsDoc.data().winner as WinnerInfo);
    }
  };

  useState(() => {
    fetchWinner();
  });

  return (
    <Card>
      <CardHeader>
        <CardTitle>Realizar Sorteio</CardTitle>
        <CardDescription>
          Clique no botão para sortear um cupom vencedor dentre todos os
          cadastrados.
        </CardDescription>
      </CardHeader>
      <CardContent className="flex items-center justify-center p-6">
        {winner ? (
          <div className="text-center animate-in fade-in-50">
             <PartyPopper className="h-12 w-12 mx-auto text-yellow-500" />
             <h3 className="text-lg font-semibold mt-4">Temos um Vencedor!</h3>
             <div className="mt-4 p-4 bg-primary/10 rounded-lg border-2 border-dashed border-primary">
                <p className="text-2xl font-bold text-primary tracking-wider">{winner.couponNumber}</p>
                <div className="mt-2 text-left space-y-1 text-sm">
                    <p className="flex items-center gap-2"><User className="h-4 w-4 text-muted-foreground"/> <strong>Nome:</strong> {winner.fullName}</p>
                    <p className="flex items-center gap-2"><Ticket className="h-4 w-4 text-muted-foreground"/> <strong>CPF:</strong> {winner.cpf.replace(/(\d{3})(\d{3})(\d{3})(\d{2})/, '$1.$2.$3-$4')}</p>
                </div>
             </div>
             <p className="text-xs text-muted-foreground mt-2">Sorteio realizado em: {new Date(winner.drawDate).toLocaleString('pt-BR')}</p>
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
                <Ticket className="mr-2 h-4 w-4" />
              )}
              {isDrawing ? 'Sorteando...' : (winner ? 'Sortear Novamente' : 'Sortear Agora')}
            </Button>
          </AlertDialogTrigger>
          <AlertDialogContent>
            <AlertDialogHeader>
              <AlertDialogTitle>Você tem certeza?</AlertDialogTitle>
              <AlertDialogDescription>
                {winner ? 'Esta ação irá realizar um novo sorteio e substituir o ganhador atual. ' : 'Esta ação irá realizar o sorteio do cupom vencedor. '} 
                A ação não pode ser desfeita.
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
