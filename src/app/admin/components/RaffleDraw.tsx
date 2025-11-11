'use client';
import { useState, useEffect } from 'react';
import { useFirestore, useCollection, useMemoFirebase } from '@/firebase';
import { collection, doc, getDocs, addDoc } from 'firebase/firestore';
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
  purchaseDate: { seconds: number, nanoseconds: number };
};

type WinnerInfo = Coupon & { drawDate: Date };
type DrawState = 'idle' | 'spinning' | 'revealing' | 'complete';

export function RaffleDraw() {
  const firestore = useFirestore();
  const { toast } = useToast();
  
  const [winner, setWinner] = useState<WinnerInfo | null>(null);
  const [drawState, setDrawState] = useState<DrawState>('idle');
  const [displayedNumber, setDisplayedNumber] = useState('SM-00000');
  
  // Use a query for coupons to get all documents
  const couponsQuery = useMemoFirebase(
    () => firestore ? collection(firestore, 'coupons') : null,
    [firestore]
  );
  
  // We don't need a real-time listener here, we'll fetch when drawing.
  // This is just to get an initial count for the button.
  const { data: coupons, isLoading: isCouponsLoading } = useCollection(couponsQuery);

  useEffect(() => {
    let intervalId: NodeJS.Timeout;

    if (drawState === 'spinning') {
      intervalId = setInterval(() => {
        const randomNumber = Math.floor(Math.random() * 99999) + 1;
        setDisplayedNumber(`SM-${String(randomNumber).padStart(5, '0')}`);
      }, 80); // Fast spinning effect
    }

    return () => clearInterval(intervalId);
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

      const spinDuration = 4000 + Math.random() * 2000; // 4-6 seconds of spin

      setTimeout(() => {
        const randomIndex = Math.floor(Math.random() * allCoupons.length);
        const drawnCoupon = allCoupons[randomIndex];
        const winnerData: WinnerInfo = { ...drawnCoupon, drawDate: new Date() };
        
        setDisplayedNumber(winnerData.couponNumber); // Show the final winning number
        setDrawState('revealing');

        setTimeout(async () => {
          setWinner(winnerData);
          setDrawState('complete');
          
          // Save winner to Firestore
          const winnersRef = collection(firestore, 'winners');
          await addDoc(winnersRef, {
            ...winnerData,
            // Convert JS date back to Firestore Timestamp for storage
            purchaseDate: winnerData.purchaseDate,
            drawDate: winnerData.drawDate,
          });

          toast({
            title: 'Sorteio Realizado!',
            description: `O cupom ${winnerData.couponNumber} é o vencedor!`,
          });
        }, 1500); // 1.5 seconds reveal time
        
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
                <p className="flex items-center gap-2"><ShoppingCart className="h-4 w-4 text-muted-foreground"/> <strong>Valor:</strong> R$ {winnerInfo.purchaseValue.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}</p>
                <p className="flex items-center gap-2"><Calendar className="h-4 w-4 text-muted-foreground"/> <strong>Data Compra:</strong> {format(new Date(winnerInfo.purchaseDate.seconds * 1000), 'dd/MM/yyyy')}</p>
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
                <p className="font-bold text-lg mt-2">{coupons?.length ?? 0} cupons participando.</p>
            </div>
        )}
        {drawState === 'spinning' || drawState === 'revealing' ? (
             <div className="flex flex-col items-center gap-4">
                <p className="font-bold text-muted-foreground">Sorteando...</p>
                <div className={`
                    text-5xl font-black tracking-wider p-4 rounded-lg
                    bg-gradient-to-r from-red-500 via-yellow-400 to-red-500 
                    bg-[length:200%_200%] animate-gradient text-white transition-all duration-300
                    ${drawState === 'revealing' ? 'scale-125' : ''}
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
            <Button disabled={drawState !== 'idle' && drawState !== 'complete' || isCouponsLoading || !coupons || coupons.length === 0}>
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
        @keyframes gradient {
          0% { background-position: 0% 50%; }
          50% { background-position: 100% 50%; }
          100% { background-position: 0% 50%; }
        }
        .animate-gradient {
          animation: gradient 3s ease infinite;
        }
      `}</style>
    </Card>
  );
}
