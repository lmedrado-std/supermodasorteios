'use client';
import { useState, useEffect, useRef } from 'react';
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
import { PartyPopper, Ticket, User, Trophy, Calendar, DollarSign, ShoppingCart, Loader2, Sparkles } from 'lucide-react';
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
  purchaseNumber: string;
};


type WinnerInfo = Coupon & { drawDate: Date };
type DrawState = 'idle' | 'spinning' | 'revealing' | 'complete';


export function RaffleDraw() {
  const firestore = useFirestore();
  const { toast } = useToast();
  
  const [winner, setWinner] = useState<WinnerInfo | null>(null);
  const [drawState, setDrawState] = useState<DrawState>('idle');
  const [displayedNumber, setDisplayedNumber] = useState('SM-00000');
  const [rotation, setRotation] = useState(0);
  const [scale, setScale] = useState(1);
  const [glow, setGlow] = useState(0);
  const animationFrameRef = useRef<number>();
  
  const couponsQuery = useMemoFirebase(
    () => firestore ? collection(firestore, 'coupons') : null,
    [firestore]
  );
  
  const { data: coupons, isLoading: isCouponsLoading } = useCollection(couponsQuery);

  // ✨ Animação de Confete
  const createConfetti = () => {
    const confetti = [];
    for (let i = 0; i < 50; i++) {
      confetti.push({
        id: i,
        left: Math.random() * 100,
        delay: Math.random() * 0.5,
        duration: 2 + Math.random() * 1,
        angle: Math.random() * 360,
      });
    }
    return confetti;
  };

  // 🎡 Animação de Spinning Suave
  useEffect(() => {
    if (drawState !== 'spinning') return;

    const startTime = Date.now();
    const totalDuration = 15000;

    const animate = () => {
      const elapsed = Date.now() - startTime;
      const progress = Math.min(elapsed / totalDuration, 1);

      // Rotação contínua com aceleração/desaceleração
      const easeProgress = progress < 0.8 
        ? progress 
        : 0.8 + (progress - 0.8) * 0.2; // Desaceleração suave

      setRotation(easeProgress * 360 * 4); // 4 rotações

      // Pulsação do tamanho
      const pulsePhase = (elapsed % 300) / 300;
      setScale(1 + Math.sin(pulsePhase * Math.PI) * 0.15);

      // Glow animado
      const glowPhase = (elapsed % 500) / 500;
      setGlow(Math.sin(glowPhase * Math.PI) * 30);

      // Atualiza número aleatório rapidamente
      if (elapsed % 80 === 0) { // roughly every 80ms to reduce updates
        const randomNumber = Math.floor(Math.random() * 99999) + 1;
        setDisplayedNumber(`SM-${String(randomNumber).padStart(5, '0')}`);
      }


      if (elapsed < totalDuration) {
        animationFrameRef.current = requestAnimationFrame(animate);
      }
    };

    animationFrameRef.current = requestAnimationFrame(animate);

    return () => {
      if (animationFrameRef.current) {
        cancelAnimationFrame(animationFrameRef.current);
      }
    };
  }, [drawState]);

  const handleDraw = async () => {
    if (!firestore) return;
    setDrawState('spinning');
    setWinner(null);
    setRotation(0);
    setScale(1);
    setGlow(0);
    
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

      const spinDuration = 15000; // 15 segundos

      setTimeout(() => {
        const randomIndex = Math.floor(Math.random() * allCoupons.length);
        const drawnCoupon = allCoupons[randomIndex];
        const drawDate = new Date();
        
        setDisplayedNumber(drawnCoupon.couponNumber);
        setDrawState('revealing');
        setRotation(0);
        setScale(1.3);

        setTimeout(async () => {
          const winnerData: WinnerInfo = { ...drawnCoupon, drawDate };
          setWinner(winnerData);
          setDrawState('complete');
          setScale(1);
          
          await addDoc(collection(firestore, 'winners'), {
            ...drawnCoupon,
            drawDate: Timestamp.fromDate(drawDate),
          });

          toast({
            title: '🎉 Sorteio Realizado!',
            description: `O cupom ${winnerData.couponNumber} é o vencedor!`,
          });
        }, 2000);
        
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
  
  // 🎊 Confete animado
  const confetti = drawState === 'revealing' ? createConfetti() : [];

  const WinnerCard = ({ winnerInfo }: { winnerInfo: WinnerInfo }) => (
    <div className="text-center animate-in zoom-in duration-700 w-full max-w-sm mx-auto">
      <div className="bg-gradient-to-br from-yellow-400 via-red-500 to-pink-600 p-1 rounded-3xl shadow-2xl animate-pulse">
        <div className="bg-card rounded-2xl p-8 relative overflow-hidden">
          {/* Efeito de luz ao fundo */}
          <div className="absolute inset-0 bg-gradient-to-br from-yellow-100/30 to-transparent rounded-2xl pointer-events-none"></div>
          
          <div className="relative z-10">
            <div className="relative inline-block mb-4">
              <Trophy className="h-16 w-16 mx-auto text-amber-500 animate-bounce" style={{
                animation: 'bounce 1s infinite, spin 3s linear infinite'
              }} />
              <Sparkles className="absolute -top-2 -right-2 h-6 w-6 text-yellow-400 animate-spin" />
              <Sparkles className="absolute -bottom-2 -left-2 h-6 w-6 text-pink-400 animate-pulse" />
            </div>

            <h3 className="text-2xl font-black bg-gradient-to-r from-red-600 to-pink-600 bg-clip-text text-transparent">
              GANHADOR DO SORTEIO!
            </h3>
            
            <p className="text-5xl font-black tracking-wider text-transparent bg-gradient-to-r from-red-600 via-yellow-500 to-pink-600 bg-clip-text mt-4 animate-pulse">
              {winnerInfo.couponNumber}
            </p>

            <div className="mt-6 space-y-3 text-sm border-t border-yellow-300 pt-4">
              <div className="flex items-center gap-3 bg-gradient-to-r from-blue-50 to-purple-50 p-3 rounded-lg hover:shadow-md transition">
                <User className="h-5 w-5 text-blue-600 flex-shrink-0" />
                <div className="text-left">
                  <p className="text-xs text-muted-foreground">Nome</p>
                  <p className="font-bold text-gray-900">{winnerInfo.fullName}</p>
                </div>
              </div>

               <div className="flex items-center gap-3 bg-gradient-to-r from-purple-50 to-pink-50 p-3 rounded-lg hover:shadow-md transition">
                <ShoppingCart className="h-5 w-5 text-purple-600 flex-shrink-0" />
                <div className="text-left">
                  <p className="text-xs text-muted-foreground">Nº da Compra</p>
                  <p className="font-bold text-gray-900">{winnerInfo.purchaseNumber}</p>
                </div>
              </div>

              <div className="flex items-center gap-3 bg-gradient-to-r from-green-50 to-lime-50 p-3 rounded-lg hover:shadow-md transition">
                <DollarSign className="h-5 w-5 text-green-600 flex-shrink-0" />
                <div className="text-left">
                  <p className="text-xs text-muted-foreground">Valor da Compra</p>
                  <p className="font-bold text-gray-900">
                    R$ {winnerInfo.purchaseValue.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
                  </p>
                </div>
              </div>

              <div className="flex items-center gap-3 bg-gradient-to-r from-orange-50 to-amber-50 p-3 rounded-lg hover:shadow-md transition">
                <Calendar className="h-5 w-5 text-orange-600 flex-shrink-0" />
                <div className="text-left">
                  <p className="text-xs text-muted-foreground">Data da Compra</p>
                  <p className="font-bold text-gray-900">
                    {winnerInfo.purchaseDate ? format(winnerInfo.purchaseDate.toDate(), 'dd/MM/yyyy') : 'N/A'}
                  </p>
                </div>
              </div>
            </div>

            <p className="text-xs text-muted-foreground mt-4 border-t pt-4">
              ✨ Sorteio realizado em {format(winnerInfo.drawDate, 'dd/MM/yyyy')} às {format(winnerInfo.drawDate, 'HH:mm')}
            </p>
          </div>
        </div>
      </div>
    </div>
  );

  return (
    <Card className="relative overflow-hidden">
      <CardHeader className="bg-gradient-to-r from-red-50 to-pink-50 border-b">
        <CardTitle className="flex items-center gap-2">
          <Trophy className="h-6 w-6 text-amber-500" />
          Realizar Sorteio
        </CardTitle>
        <CardDescription>
          Clique no botão para sortear um cupom vencedor. O resultado será salvo automaticamente no histórico.
        </CardDescription>
      </CardHeader>

      <CardContent className="flex items-center justify-center p-8 min-h-[400px] relative">
        {/* Confete durante revelação */}
        {confetti.map((c) => (
          <div
            key={c.id}
            className="absolute pointer-events-none"
            style={{
              left: `${c.left}%`,
              top: '-10px',
              animation: `fall ${c.duration}s linear forwards`,
              animationDelay: `${c.delay}s`,
              opacity: 0.8,
            }}
          >
            <div
              style={{
                transform: `rotate(${c.angle}deg)`,
                fontSize: '24px',
              }}
            >
              {'🎉🎊🎈🎁🎀'[Math.floor(Math.random() * 5)]}
            </div>
          </div>
        ))}

        {drawState === 'idle' && !winner && (
          <div className="text-center animate-fadeIn">
            <div className="mb-4">
              <PartyPopper className="h-16 w-16 mx-auto text-red-500 animate-bounce" />
            </div>
            <p className="font-bold text-lg text-muted-foreground">
              Pronto para descobrir o próximo ganhador?
            </p>
            <p className="font-bold text-2xl mt-4 bg-gradient-to-r from-red-600 to-pink-600 bg-clip-text text-transparent">
              {isCouponsLoading ? '⏳ Calculando...' : `✅ ${coupons?.length ?? 0} cupons participando`}
            </p>
          </div>
        )}

        {(drawState === 'spinning' || drawState === 'revealing') && (
          <div className="flex flex-col items-center gap-6 animate-fadeIn">
            <p className="font-bold text-lg text-red-600 animate-pulse">
              ✨ SORTEANDO... ✨
            </p>
            
            <div
              className="relative"
              style={{
                transform: `rotate(${rotation}deg) scale(${scale})`,
                transition: drawState === 'revealing' ? 'all 0.3s cubic-bezier(0.34, 1.56, 0.64, 1)' : 'none',
              }}
            >
              {/* Círculo de fundo animado */}
              <div
                className="absolute -inset-8 bg-gradient-to-r from-red-400 via-yellow-300 to-red-400 rounded-full blur-xl opacity-75"
                style={{
                  filter: `drop-shadow(0 0 ${20 + glow}px rgba(255, 215, 0, 0.6))`,
                  animation: 'pulse 2s ease-in-out infinite',
                }}
              ></div>

              {/* Número do cupom */}
              <div className="relative bg-gradient-to-br from-red-600 to-pink-600 text-white font-black text-6xl px-8 py-6 rounded-2xl shadow-2xl tracking-wider">
                {displayedNumber}
                
                {/* Efeito de luz */}
                <div className="absolute inset-0 bg-gradient-to-t from-transparent to-white/20 rounded-2xl pointer-events-none"></div>
              </div>
            </div>

            {/* Partículas ao redor */}
            <div className="flex gap-2 mt-4">
              {[...Array(5)].map((_, i) => (
                <div
                  key={i}
                  className="w-2 h-2 bg-red-500 rounded-full animate-bounce"
                  style={{
                    animationDelay: `${i * 0.1}s`,
                  }}
                ></div>
              ))}
            </div>
          </div>
        )}

        {drawState === 'complete' && winner && <WinnerCard winnerInfo={winner} />}
      </CardContent>

      <CardFooter className="border-t bg-gradient-to-r from-red-50 to-pink-50">
        <AlertDialog>
          <AlertDialogTrigger asChild>
            <Button
              size="lg"
              className="w-full bg-gradient-to-r from-red-600 to-pink-600 hover:from-red-700 hover:to-pink-700 text-white font-bold text-lg gap-2"
              disabled={drawState === 'spinning' || drawState === 'revealing' || isCouponsLoading || !coupons || coupons.length === 0}
            >
              {drawState === 'spinning' || drawState === 'revealing' ? (
                <>
                  <Loader2 className="h-5 w-5 animate-spin" />
                  SORTEANDO...
                </>
              ) : (
                <>
                  <PartyPopper className="h-5 w-5" />
                  {drawState === 'complete' ? '🎲 SORTEAR NOVO GANHADOR' : 'SORTEAR GANHADOR'}
                </>
              )}
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
              <AlertDialogAction onClick={handleDraw} className="bg-red-600 hover:bg-red-700">
                Sim, Sortear Agora
              </AlertDialogAction>
            </AlertDialogFooter>
          </AlertDialogContent>
        </AlertDialog>
      </CardFooter>

      <style jsx>{`
        @keyframes fall {
          to {
            transform: translateY(100vh) rotate(720deg);
            opacity: 0;
          }
        }

        @keyframes spin {
          from {
            transform: rotateZ(0deg);
          }
          to {
            transform: rotateZ(360deg);
          }
        }

        @keyframes fadeIn {
          from {
            opacity: 0;
            transform: scale(0.9);
          }
          to {
            opacity: 1;
            transform: scale(1);
          }
        }

        .animate-fadeIn {
          animation: fadeIn 0.5s ease-out;
        }

        @keyframes shimmer {
          0%, 100% {
            opacity: 1;
          }
          50% {
            opacity: 0.7;
          }
        }

        .animate-shimmer {
          animation: shimmer 2s ease-in-out infinite;
        }
      `}</style>
    </Card>
  );
}
