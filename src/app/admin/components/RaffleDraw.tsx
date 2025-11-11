'use client';
import { useState, useEffect } from 'react';
import { useFirestore, useCollection, useMemoFirebase } from '@/firebase';
import { collection, doc, getDocs, addDoc, Timestamp } from 'firebase/firestore';
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
import { PartyPopper, Ticket, User, Trophy, Calendar, DollarSign, ShoppingCart, Loader2 } from 'lucide-react';
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
  purchaseValue: number;
  purchaseDate: Timestamp;
};

type WinnerInfo = Coupon & { drawDate: Date };
type DrawState = 'idle' | 'spinning' | 'revealing' | 'complete';

export function RaffleDraw() {
  const firestore = useFirestore();
  const { toast } = useToast();
  
  const [winner, setWinner] = useState<WinnerInfo | null>(null);
  const [drawState, setDrawState] = useState<DrawState>('idle');
  const [displayedNumber, setDisplayedNumber] = useState('SM-00000');
  
  const couponsQuery = useMemoFirebase(
    () => firestore ? collection(firestore, 'coupons') : null,
    [firestore]
  );
  
  const { data: coupons, isLoading: isCouponsLoading } = useCollection(couponsQuery);

  useEffect(() => {
    let intervalId: NodeJS.Timeout | null = null;

    if (drawState === 'spinning') {
      const startTime = Date.now();
      const totalDuration = 15000; // 15 segundos de suspense total
      const slowdownTime = 12000; // Começa a desacelerar nos últimos 3 segundos

      const spin = () => {
        const elapsedTime = Date.now() - startTime;
        let interval = 50; // Intervalo rápido inicial

        if (elapsedTime > slowdownTime) {
          // Desaceleração exponencial nos últimos segundos
          const remainingTime = totalDuration - elapsedTime;
          const progress = remainingTime / (totalDuration - slowdownTime);
          interval = 50 + (400 * (1 - progress)); // Aumenta o intervalo para 450ms
        }
        
        // Simula uma "falsa parada" perto do fim
        if (elapsedTime > 13500 && elapsedTime < 14200) {
            // Fica parado por um instante
        } else {
            const randomNumber = Math.floor(Math.random() * 99999) + 1;
            setDisplayedNumber(`SM-${String(randomNumber).padStart(5, '0')}`);
        }

        if (elapsedTime < totalDuration) {
          intervalId = setTimeout(spin, interval);
        }
      };

      spin();
    }

    return () => {
      if (intervalId) clearTimeout(intervalId);
    };
  }, [drawState]);


  const handleDraw = async () => {
    if (!firestore) return;
    setDrawState('spinning');
    setWinner(null);
    
    try {
      const snapshot = await getDocs(couponsQuery!);

      if (snapshot.empty) {
        toast({
          variant: 'destructive',
          title: 'Sorteio não realizado',
          description: 'Não há cupons cadastrados para sortear.',
        });
        setDrawState('idle');
        return;
      }
      
      const allCoupons = snapshot.docs.map((doc) => ({ id: doc.id, ...doc.data() } as Coupon));

      const spinDuration = 15000; // 15 segundos de giro

      setTimeout(() => {
        const randomIndex = Math.floor(Math.random() * allCoupons.length);
        const drawnCoupon = allCoupons[randomIndex];
        const drawDate = new Date();
        
        setDisplayedNumber(drawnCoupon.couponNumber);
        setDrawState('revealing');

        setTimeout(async () => {
          const winnerData: WinnerInfo = { ...drawnCoupon, drawDate };
          setWinner(winnerData);
          setDrawState('complete');
          
          await addDoc(collection(firestore, 'winners'), {
            ...drawnCoupon,
            drawDate: Timestamp.fromDate(drawDate),
          });

          toast({
            title: 'Sorteio Realizado!',
            description: `O cupom ${winnerData.couponNumber} é o vencedor!`,
          });
        }, 2000); // 2 segundos para o tempo de revelação
        
      }, spinDuration);

    } catch (error) {
      console.error('Error during raffle draw:', error);
      toast({
        variant: 'destructive',
        title: 'Erro no Sorteio',
        description: 'Não foi possível realizar o sorteio. Tente novamente.',
      });
      setDrawState('idle');
    }
  };
  
  const WinnerCard = ({ winnerInfo }: { winnerInfo: WinnerInfo }) => (
     <div className="text-center animate-in fade-in-50 duration-500 w-full max-w-sm mx-auto">
       <div className="bg-gradient-to-br from-red-500 to-amber-500 p-1 rounded-2xl shadow-2xl">
        <div className="bg-card rounded-xl p-6">
            <Trophy className="h-12 w-12 mx-auto text-amber-500 animate-pulse" />
            <h3 className="text-xl font-bold mt-4">Ganhador do Sorteio!</h3>
            <p className="text-4xl font-black tracking-wider text-primary mt-2">{winnerInfo.couponNumber}</p>
            <div className="mt-4 text-left space-y-2 text-sm">
                <p className="flex items-center gap-2"><User className="h-4 w-4 text-muted-foreground"/> <strong>Nome:</strong> {winnerInfo.fullName}</p>
                <p className="flex items-center gap-2"><Ticket className="h-4 w-4 text-muted-foreground"/> <strong>CPF:</strong> {winnerInfo.cpf.replace(/(\d{3})(\d{3})(\d{3})(\d{2})/, '$1.$2.$3-$4')}</p>
                <p className="flex items-center gap-2"><DollarSign className="h-4 w-4 text-muted-foreground"/> <strong>Valor:</strong> R$ {winnerInfo.purchaseValue.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}</p>
                <p className="flex items-center gap-2"><Calendar className="h-4 w-4 text-muted-foreground"/> <strong>Data Compra:</strong> {format(winnerInfo.purchaseDate.toDate(), 'dd/MM/yyyy')}</p>
            </div>
             <p className="text-xs text-muted-foreground mt-4">
                Sorteio realizado em: {format(winnerInfo.drawDate, 'dd/MM/yyyy HH:mm')}
             </p>
        </div>
       </div>
    </div>
  );

  return (
    <Card>
      <CardHeader>
        <CardTitle>Realizar Sorteio</CardTitle>
        <CardDescription>
          Clique no botão para sortear um cupom vencedor. O resultado será salvo automaticamente no histórico.
        </CardDescription>
      </CardHeader>
      <CardContent className="flex items-center justify-center p-6 min-h-[350px]">
        {drawState === 'idle' && !winner && (
            <div className="text-center text-muted-foreground">
                <p>Pronto para descobrir o próximo ganhador?</p>
                <p className="font-bold text-lg mt-2">{isCouponsLoading ? 'Calculando...' : `${coupons?.length ?? 0} cupons participando.`}</p>
            </div>
        )}
        {drawState === 'spinning' || drawState === 'revealing' ? (
             <div className="flex flex-col items-center gap-4">
                <p className="font-bold text-muted-foreground animate-pulse">Sorteando...</p>
                <div className={`
                    text-5xl font-black tracking-wider p-4 rounded-lg
                    bg-gradient-to-r from-red-500 via-yellow-400 to-red-500 
                    bg-[length:200%_200%] text-white transition-all duration-300
                    ${drawState === 'revealing' ? 'animate-reveal' : 'animate-gradient-fast' }
                `}>
                    {displayedNumber}
                </div>
            </div>
        ) : null}
        {drawState === 'complete' && winner && <WinnerCard winnerInfo={winner} />}
      </CardContent>
      <CardFooter>
        <AlertDialog>
          <AlertDialogTrigger asChild>
            <Button disabled={drawState === 'spinning' || drawState === 'revealing' || isCouponsLoading || !coupons || coupons.length === 0}>
              {drawState === 'spinning' || drawState === 'revealing' ? (
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
              ) : (
                <PartyPopper className="mr-2 h-4 w-4" />
              )}
              {drawState === 'idle' || drawState === 'complete' ? 'Sortear Novo Ganhador' : 'Sorteando...'}
            </Button>
          </AlertDialogTrigger>
          <AlertDialogContent>
            <AlertDialogHeader>
              <AlertDialogTitle>Você tem certeza?</AlertDialogTitle>
              <AlertDialogDescription>
                Esta ação irá realizar um novo sorteio entre os {coupons?.length} cupons cadastrados. A ação não pode ser desfeita e o resultado será salvo no histórico.
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
      <style jsx>{`
        @keyframes gradient-fast {
          0% { background-position: 0% 50%; }
          50% { background-position: 100% 50%; }
          100% { background-position: 0% 50%; }
        }
        .animate-gradient-fast {
          animation: gradient-fast 1.5s ease infinite;
        }
        @keyframes reveal {
          0% { transform: scale(1); box-shadow: 0 0 0px rgba(255, 255, 255, 0); }
          50% { transform: scale(1.3); box-shadow: 0 0 40px rgba(255, 215, 0, 0.8); }
          100% { transform: scale(1.1); box-shadow: 0 0 20px rgba(255, 215, 0, 0.4); }
        }
        .animate-reveal {
            transform: scale(1.1);
            animation: reveal 1s ease-out forwards;
        }
      `}</style>
    </Card>
  );
}
