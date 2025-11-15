'use client';
import { useState, useRef, useMemo, useEffect } from 'react';
import {
  collection,
  query,
  where,
  getDocs,
  Timestamp,
  doc,
  updateDoc,
  serverTimestamp,
  limit,
} from 'firebase/firestore';
import { useFirestore, FirebaseClientProvider } from '@/firebase';
import { Header } from '@/components/Header';
import { Footer } from '@/components/Footer';
import {
  Card,
  CardHeader,
  CardTitle,
  CardDescription,
  CardContent,
} from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Label } from '@/components/ui/label';
import { Search, Download, Calendar, ShoppingCart, DollarSign, Clock, Sparkles, Gift, CheckCircle } from 'lucide-react';
import html2canvas from 'html2canvas';
import { format } from 'date-fns';
import { CouponListModal } from '@/components/CouponListModal';

type Coupon = {
  id: string;
  fullName: string;
  cpf: string;
  purchaseNumber: string;
  purchaseValue: number;
  couponNumber: string;
  registrationDate: Timestamp;
  purchaseDate: Timestamp;
};

type ScratchCoupon = {
  id: string;
  cpf: string;
  premio: string;
  status: 'disponivel' | 'raspado';
  liberadoEm: Timestamp;
  raspadoEm?: Timestamp;
};

type GroupedCoupons = {
  [key: string]: Coupon[];
};

const ScratchCard = ({ coupon, onScratch }: { coupon: ScratchCoupon; onScratch: (id: string) => void }) => {
  const [isScratched, setIsScratched] = useState(coupon.status === 'raspado');
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const isDrawing = useRef(false);

  // Initialize canvas for scratching effect
  useEffect(() => {
    if (isScratched || !canvasRef.current) return;
    const canvas = canvasRef.current;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    // Make it responsive
    const rect = canvas.parentElement!.getBoundingClientRect();
    canvas.width = rect.width;
    canvas.height = rect.height;

    // Fill with scratchable overlay
    ctx.fillStyle = '#d1d5db'; // gray-300
    ctx.fillRect(0, 0, canvas.width, canvas.height);
    
    ctx.globalCompositeOperation = 'destination-out';
    ctx.lineWidth = 30;
    ctx.lineCap = 'round';

    const draw = (e: MouseEvent | TouchEvent) => {
        if (!isDrawing.current) return;
        const touch = e.type === 'touchmove' ? (e as TouchEvent).touches[0] : null;
        const mouseEvent = e as MouseEvent;
        
        const x = touch ? touch.clientX - rect.left : mouseEvent.clientX - rect.left;
        const y = touch ? touch.clientY - rect.top : mouseEvent.clientY - rect.top;

        ctx.lineTo(x, y);
        ctx.stroke();
        ctx.beginPath();
        ctx.moveTo(x, y);
    }
    
    const startDrawing = (e: MouseEvent | TouchEvent) => {
        isDrawing.current = true;
        draw(e);
    }
    
    const stopDrawing = () => {
        isDrawing.current = false;
        ctx.beginPath();
        
        // Check if scratched enough
        const pixels = ctx.getImageData(0, 0, canvas.width, canvas.height);
        const transparentPixels = Array.from(pixels.data).filter((_val, i) => (i + 1) % 4 === 0 && _val === 0).length;
        if (transparentPixels / (canvas.width * canvas.height) > 0.6) {
           handleScratch();
        }
    }

    const handleScratch = () => {
        if (!isScratched) {
            setIsScratched(true);
            onScratch(coupon.id);
        }
    };

    canvas.addEventListener('mousedown', startDrawing);
    canvas.addEventListener('mouseup', stopDrawing);
    canvas.addEventListener('mousemove', draw);
    canvas.addEventListener('touchstart', startDrawing, { passive: true });
    canvas.addEventListener('touchend', stopDrawing);
    canvas.addEventListener('touchmove', draw, { passive: true });

    return () => {
        canvas.removeEventListener('mousedown', startDrawing);
        canvas.removeEventListener('mouseup', stopDrawing);
        canvas.removeEventListener('mousemove', draw);
        canvas.removeEventListener('touchstart', startDrawing);
        canvas.removeEventListener('touchend', stopDrawing);
        canvas.removeEventListener('touchmove', draw);
    };

  }, [isScratched, onScratch, coupon.id]);

  return (
    <Card className="shadow-lg border-amber-400/50 bg-gradient-to-br from-yellow-50 to-amber-100">
      <CardHeader>
        <CardTitle className="text-xl md:text-2xl font-bold text-center text-amber-600 flex items-center justify-center gap-2">
            <Sparkles /> Raspadinha Premiada!
        </CardTitle>
      </CardHeader>
      <CardContent className="text-center space-y-4">
        <p className="text-muted-foreground">
          Você tem um prêmio instantâneo! Raspe abaixo para descobrir o que você ganhou.
        </p>
        <div className={`relative w-full h-32 rounded-lg border-2 border-dashed border-amber-400 flex items-center justify-center transition-all duration-500 ${isScratched ? 'bg-gradient-to-br from-amber-300 to-yellow-400' : 'bg-gray-100'}`}>
          <div className="z-10 text-center">
            <p className="text-lg font-bold text-amber-900">{coupon.premio}</p>
            {isScratched && (
                <div className='mt-2 text-xs text-amber-800 animate-in fade-in-50'>
                    <p>Prêmio resgatado!</p>
                    <p>Data: {coupon.raspadoEm ? format(coupon.raspadoEm.toDate(), 'dd/MM/yy HH:mm') : format(new Date(), 'dd/MM/yy HH:mm')}</p>
                </div>
            )}
          </div>
          {!isScratched && (
             <canvas ref={canvasRef} className="absolute inset-0 z-20 w-full h-full cursor-pointer rounded-md"></canvas>
          )}
        </div>
        {coupon.status === 'raspado' && !isScratched && (
             <div className="flex items-center justify-center gap-2 text-green-600">
                <CheckCircle className="h-4 w-4" />
                <p className="font-semibold text-sm">Esta raspadinha já foi utilizada.</p>
            </div>
        )}
      </CardContent>
    </Card>
  )
};


const CouponCard = ({ purchaseCoupons }: { purchaseCoupons: Coupon[] }) => {
    const couponContainerRef = useRef<HTMLDivElement>(null);
    const firstCoupon = purchaseCoupons[0];
    const couponsCount = purchaseCoupons.length;
    const showCouponRange = couponsCount > 12;

    const handleSaveCoupon = () => {
        if (couponContainerRef.current) {
        html2canvas(couponContainerRef.current, {
            scale: 2,
            useCORS: true,
            backgroundColor: null,
        }).then((canvas) => {
            const link = document.createElement('a');
            link.download = `cupom-supermoda-${firstCoupon.purchaseNumber}.png`;
            link.href = canvas.toDataURL('image/png');
            link.click();
        });
        }
    };

    return (
        <div className="flex flex-col items-center gap-6">
            <div ref={couponContainerRef} className="bg-card rounded-2xl shadow-2xl w-full max-w-md overflow-hidden border">
                <div className="bg-primary p-4 text-center">
                    <h2 className="text-2xl font-bold text-primary-foreground font-headline flex items-center justify-center gap-2">
                        🎟️ Sorteio Supermoda!
                    </h2>
                </div>
                
                <div className="p-6 space-y-6">
                    <div className="text-center">
                        <p className="text-5xl font-black tracking-wider" style={{color: '#e30613'}}>{firstCoupon.couponNumber}</p>
                        <p className="text-lg text-muted-foreground mt-1">{firstCoupon.fullName}</p>
                    </div>

                    {couponsCount > 1 && (
                        <div className="text-center">
                            <p className="font-bold mb-2">Seus Cupons nesta Compra (Total: {couponsCount})</p>
                            {showCouponRange ? (
                                <div className="border rounded-md p-3 text-center bg-muted/50">
                                    <p className="font-bold text-sm">
                                        🎟️ Você possui {couponsCount} cupons!
                                    </p>
                                    <p className="font-semibold text-sm text-primary">{purchaseCoupons[0].couponNumber} a {purchaseCoupons[couponsCount - 1].couponNumber}</p>
                                    <CouponListModal coupons={purchaseCoupons.map(c => c.couponNumber)} />
                                </div>
                            ) : (
                               <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
                                    {purchaseCoupons.map(coupon => (
                                        <div key={coupon.id} className="border rounded-md p-2 text-center bg-muted/50">
                                            <p className="font-bold text-sm">🏷️ {coupon.couponNumber}</p>
                                        </div>
                                    ))}
                                </div>
                            )}
                        </div>
                    )}
                    
                    <div className="border-t-2 border-dashed w-full"></div>

                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-x-4 gap-y-3 text-sm text-left">
                        <div className="flex items-center gap-2">
                            <DollarSign className="h-4 w-4 text-muted-foreground"/>
                            <div>
                                <p className="font-bold">Valor da Compra</p>
                                <p>R$ {firstCoupon.purchaseValue?.toLocaleString('pt-BR', { minimumFractionDigits: 2, maximumFractionDigits: 2 }) ?? 'N/A'}</p>
                            </div>
                        </div>
                        <div className="flex items-center gap-2">
                            <ShoppingCart className="h-4 w-4 text-muted-foreground"/>
                            <div>
                                <p className="font-bold">Nº da Compra</p>
                                <p>{firstCoupon.purchaseNumber ?? 'N/A'}</p>
                            </div>
                        </div>
                        <div className="flex items-center gap-2">
                            <Calendar className="h-4 w-4 text-muted-foreground"/>
                            <div>
                                <p className="font-bold">Data da Compra</p>
                                <p>{firstCoupon.purchaseDate ? format(firstCoupon.purchaseDate.toDate(), 'dd/MM/yyyy') : 'N/A'}</p>
                            </div>
                        </div>
                        <div className="flex items-center gap-2">
                            <Clock className="h-4 w-4 text-muted-foreground"/>
                            <div>
                                <p className="font-bold">Data do Cadastro</p>
                                <p>{firstCoupon.registrationDate ? format(firstCoupon.registrationDate.toDate(), 'dd/MM/yyyy HH:mm') : 'N/A'}</p>
                            </div>
                        </div>
                    </div>
                </div>
                <div className="bg-muted p-4 mt-4 text-center">
                    <p className="text-sm font-bold text-muted-foreground">❤️ Supermoda!</p>
                    <p className="text-xs text-muted-foreground">Boa sorte no sorteio!</p>
                </div>
            </div>
            <Button onClick={handleSaveCoupon} size="lg" className="bg-[#e30613] text-white hover:bg-[#f5b800] w-full max-w-md">
                <Download className="mr-2" /> Baixar Cupom da Compra
            </Button>
        </div>
    );
};


function MeusCuponsPage() {
  const firestore = useFirestore();
  const [cpf, setCpf] = useState('');
  const [groupedCoupons, setGroupedCoupons] = useState<GroupedCoupons>({});
  const [scratchCoupons, setScratchCoupons] = useState<ScratchCoupon[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [searched, setSearched] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [totalCoupons, setTotalCoupons] = useState(0);
  const [fullName, setFullName] = useState('');

  const handleSearch = async () => {
    if (!firestore) return;
    const formattedCpf = cpf.replace(/\D/g, '');
    if (formattedCpf.length !== 11) {
      setError('Por favor, digite um CPF válido com 11 dígitos.');
      return;
    }

    setIsLoading(true);
    setSearched(true);
    setGroupedCoupons({});
    setScratchCoupons([]);
    setError(null);
    setTotalCoupons(0);
    setFullName('');

    try {
      // Fetch raffle coupons
      const raffleQuery = query(collection(firestore, 'coupons'), where('cpf', '==', formattedCpf));
      const raffleSnapshot = await getDocs(raffleQuery);
      const foundRaffleCoupons: Coupon[] = [];
      raffleSnapshot.forEach((doc) => {
        foundRaffleCoupons.push({ id: doc.id, ...doc.data() } as Coupon);
      });

      const sortedRaffleCoupons = foundRaffleCoupons.sort((a, b) => a.couponNumber.localeCompare(b.couponNumber));
      const groups: GroupedCoupons = sortedRaffleCoupons.reduce((acc, coupon) => {
        const key = coupon.purchaseNumber;
        if (!acc[key]) acc[key] = [];
        acc[key].push(coupon);
        return acc;
      }, {} as GroupedCoupons);

      setGroupedCoupons(groups);
      setTotalCoupons(sortedRaffleCoupons.length);
      if (sortedRaffleCoupons.length > 0) {
        setFullName(sortedRaffleCoupons[0].fullName);
      }
      
      // Fetch scratch coupons
      const scratchQuery = query(collection(firestore, 'scratch_coupons'), where('cpf', '==', formattedCpf));
      const scratchSnapshot = await getDocs(scratchQuery);
      const foundScratchCoupons: ScratchCoupon[] = [];
      scratchSnapshot.forEach((doc) => {
         foundScratchCoupons.push({ id: doc.id, ...doc.data() } as ScratchCoupon);
      });

      // Sort scratch coupons: available first, then by date
      const sortedScratchCoupons = foundScratchCoupons.sort((a, b) => {
          if (a.status === 'disponivel' && b.status !== 'disponivel') return -1;
          if (a.status !== 'disponivel' && b.status === 'disponivel') return 1;
          return b.liberadoEm.seconds - a.liberadoEm.seconds;
      });
      setScratchCoupons(sortedScratchCoupons);

      if (sortedRaffleCoupons.length === 0 && foundScratchCoupons.length > 0 && !fullName) {
        // If we don't have a name yet, try to find one from any coupon associated with the CPF
        const nameQuery = query(
          collection(firestore, 'coupons'),
          where('cpf', '==', formattedCpf),
          limit(1)
        );
        const nameSnapshot = await getDocs(nameQuery);
        if (!nameSnapshot.empty) {
          setFullName(nameSnapshot.docs[0].data().fullName);
        } else {
          setFullName('Cliente');
        }
      }

    } catch (e) {
      console.error(e);
      setError('Ocorreu um erro ao buscar seus cupons. Tente novamente.');
    } finally {
      setIsLoading(false);
    }
  };

  const handleScratchCoupon = async (id: string) => {
    if (!firestore) return;
    const couponRef = doc(firestore, 'scratch_coupons', id);
    try {
        await updateDoc(couponRef, {
            status: 'raspado',
            raspadoEm: serverTimestamp()
        });
        // Update local state to reflect the change immediately
        setScratchCoupons(prev => prev.map(c => c.id === id ? {...c, status: 'raspado', raspadoEm: new Timestamp(Math.floor(Date.now() / 1000), 0) } as ScratchCoupon : c));
    } catch (error) {
        console.error("Error scratching coupon:", error);
    }
  };
  
  const hasRaffleResults = Object.keys(groupedCoupons).length > 0;
  const hasScratchResults = scratchCoupons.length > 0;

  return (
    <div className="flex flex-col min-h-screen">
      <Header />
      <main className="flex-grow container mx-auto px-4 py-8 md:py-12">
        <div className="max-w-2xl mx-auto">
          <Card className="shadow-lg border-primary/20">
            <CardHeader>
              <CardTitle className="text-2xl md:text-3xl font-bold text-center text-primary">
                Consultar Meus Cupons
              </CardTitle>
              <CardDescription className="text-center pt-2">
                Digite seu CPF para encontrar todos os seus números da sorte e raspadinhas.
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="flex flex-col gap-4">
                <div className="space-y-2">
                  <Label htmlFor="cpf-search">CPF</Label>
                  <Input
                    id="cpf-search"
                    name="cpf"
                    placeholder="Apenas números"
                    value={cpf}
                    onChange={(e) => setCpf(e.target.value)}
                    maxLength={11}
                  />
                </div>
                <Button
                  onClick={handleSearch}
                  disabled={isLoading || cpf.length < 11}
                  className="w-full"
                >
                  {isLoading ? 'Buscando...' : 'Buscar Cupons'}
                  <Search className="ml-2 h-4 w-4" />
                </Button>

                {error && (
                  <p className="text-sm text-destructive text-center">{error}</p>
                )}
              </div>

              {searched && !isLoading && (
                <div className="mt-8 animate-in fade-in-50 duration-500">
                  {hasRaffleResults || hasScratchResults ? (
                     <div className="space-y-10">
                       <div className="text-center">
                          <h2 className="text-xl font-bold">Olá, {fullName}!</h2>
                          {(hasRaffleResults || hasScratchResults) && (
                            <p className="text-muted-foreground">
                                {hasRaffleResults && `Você tem um total de ${totalCoupons} cupons de sorteio.`}
                                {hasRaffleResults && hasScratchResults && " E também "}
                                {hasScratchResults && `${scratchCoupons.length} raspadinha(s).`}
                            </p>
                          )}
                       </div>
                        
                        {/* Scratch Coupons */}
                        {scratchCoupons.map(coupon => (
                           <ScratchCard key={coupon.id} coupon={coupon} onScratch={handleScratchCoupon} />
                        ))}

                       {/* Raffle Coupons */}
                       {Object.keys(groupedCoupons).map(purchaseNumber => (
                          <CouponCard key={purchaseNumber} purchaseCoupons={groupedCoupons[purchaseNumber]} />
                       ))}
                    </div>
                  ) : (
                    <p className="text-center text-muted-foreground">
                      Nenhum cupom ou raspadinha encontrado para o CPF informado.
                    </p>
                  )}
                </div>
              )}
            </CardContent>
          </Card>
        </div>
      </main>
      <Footer />
    </div>
  );
}


export default function MeusCuponsPageWrapper() {
    return (
        <FirebaseClientProvider>
            <MeusCuponsPage />
        </FirebaseClientProvider>
    )
}
