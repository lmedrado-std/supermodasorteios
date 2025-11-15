'use client';
import { useState, useMemo } from 'react';
import {
  collection,
  query,
  where,
  getDocs,
  Timestamp,
  doc,
  updateDoc,
  serverTimestamp,
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
import { Search, ChevronLeft } from 'lucide-react';
import { ScratchCard } from '@/components/ScratchCard';
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import Link from 'next/link';
import Image from 'next/image';
import { ScratchCardDetails } from '@/components/ScratchCardDetails';


type ScratchCoupon = {
  id: string;
  couponNumber: string;
  cpf: string;
  fullName: string;
  premio: string;
  purchaseValue: number;
  purchaseDate: Timestamp;
  purchaseLocation: string;
  purchasePhone: string;
  liberadoEm: Timestamp;
  raspadoEm?: Timestamp;
  status: 'disponivel' | 'raspado' | 'expirado';
};

function RaspadinhasPage() {
  const firestore = useFirestore();
  const [cpf, setCpf] = useState('');
  const [scratchCoupons, setScratchCoupons] = useState<ScratchCoupon[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [searched, setSearched] = useState(false);
  const [error, setError] = useState<string | null>(null);
  
  const handleSearch = async () => {
    if (!firestore) return;
    const formattedCpf = cpf.replace(/\D/g, '');
    if (formattedCpf.length !== 11) {
      setError('Por favor, digite um CPF válido com 11 dígitos.');
      return;
    }

    setIsLoading(true);
    setSearched(true);
    setScratchCoupons([]);
    setError(null);

    try {
      const scratchQuery = query(collection(firestore, 'scratch_coupons'), where('cpf', '==', formattedCpf));
      const scratchSnapshot = await getDocs(scratchQuery);
      const foundScratchCoupons: ScratchCoupon[] = [];
      scratchSnapshot.forEach((doc) => {
         foundScratchCoupons.push({ id: doc.id, ...doc.data() } as ScratchCoupon);
      });

      const sortedScratchCoupons = foundScratchCoupons.sort((a, b) => {
          if (a.status === 'disponivel' && b.status !== 'disponivel') return -1;
          if (a.status !== 'disponivel' && b.status === 'disponivel') return 1;
          return b.liberadoEm.seconds - a.liberadoEm.seconds;
      });
      setScratchCoupons(sortedScratchCoupons);
      
    } catch (e) {
      console.error(e);
      setError('Ocorreu um erro ao buscar suas raspadinhas. Tente novamente.');
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
        // Optimistically update the local state to change the card's appearance
        setScratchCoupons(prev => prev.map(c => c.id === id ? {...c, status: 'raspado', raspadoEm: new Timestamp(Math.floor(Date.now() / 1000), 0) } as ScratchCoupon : c));
    } catch (error) {
        console.error("Error scratching coupon:", error);
    }
  };
  
  const availableCoupons = useMemo(() => scratchCoupons.filter(c => c.status === 'disponivel'), [scratchCoupons]);
  const usedCoupons = useMemo(() => scratchCoupons.filter(c => c.status === 'raspado'), [scratchCoupons]);
  
  const hasAnyResults = scratchCoupons.length > 0;

  return (
    <div className="flex flex-col min-h-screen">
      <Header />
      <main className="flex-grow container mx-auto px-4 py-8 md:py-12">
        <div className="max-w-2xl mx-auto">
          {!searched || isLoading ? (
             <Card className="shadow-lg border-primary/20">
              <CardHeader>
                <CardTitle className="text-2xl md:text-3xl font-bold text-center text-primary">
                  Cupons Raspáveis
                </CardTitle>
                <CardDescription className="text-center pt-2">
                  Digite seu CPF para encontrar suas raspadinhas premiadas.
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
                    {isLoading ? 'Buscando...' : 'Buscar Raspadinhas'}
                    <Search className="ml-2 h-4 w-4" />
                  </Button>
                  {error && (
                    <p className="text-sm text-destructive text-center">{error}</p>
                  )}
                </div>
              </CardContent>
            </Card>
          ) : (
            <div className="animate-in fade-in-50 duration-500">
                <div className="flex items-center mb-4">
                    <Button variant="ghost" size="icon" onClick={() => { setSearched(false); setCpf(''); setScratchCoupons([]); }}>
                        <ChevronLeft/>
                    </Button>
                    <h1 className="text-xl font-bold ml-2">Cupons Raspáveis</h1>
                </div>
                {hasAnyResults ? (
                    <Tabs defaultValue="disponiveis" className="w-full">
                        <TabsList className="grid w-full grid-cols-2">
                            <TabsTrigger value="disponiveis">Disponíveis ({availableCoupons.length})</TabsTrigger>
                            <TabsTrigger value="utilizados">Utilizados ({usedCoupons.length})</TabsTrigger>
                        </TabsList>
                        <TabsContent value="disponiveis" className="mt-6">
                            {availableCoupons.length > 0 ? (
                                <div className="space-y-6">
                                    {availableCoupons.map(coupon => 
                                        <ScratchCard key={coupon.id} coupon={coupon} onScratch={handleScratchCoupon} />
                                    )}
                                </div>
                            ) : (
                                <div className="text-center py-10 px-4">
                                     <Image src="https://picsum.photos/seed/no-coupon/200/200" alt="Ilustração de cupom" width={150} height={150} className="mx-auto mb-4 opacity-50" data-ai-hint="empty state illustration" />
                                    <h3 className="text-lg font-bold">Nenhum Cupom Raspável disponível!</h3>
                                    <p className="text-muted-foreground mt-2">Você já raspou todos os seus cupons, ou não possui novos. Volte em breve!</p>
                                     <Button asChild className="mt-6">
                                        <Link href="/">Voltar</Link>
                                    </Button>
                                </div>
                            )}
                        </TabsContent>
                        <TabsContent value="utilizados" className="mt-6">
                             {usedCoupons.length > 0 ? (
                                <div className="space-y-6">
                                    {usedCoupons.map(coupon => (
                                        <ScratchCardDetails key={coupon.id} coupon={coupon} />
                                    ))}
                                </div>
                            ) : (
                                 <div className="text-center py-10 px-4">
                                    <Image src="https://picsum.photos/seed/used-coupon/200/200" alt="Ilustração de cupom usado" width={150} height={150} className="mx-auto mb-4 opacity-50" data-ai-hint="empty state illustration" />
                                    <h3 className="text-lg font-bold">Nenhum cupom utilizado.</h3>
                                    <p className="text-muted-foreground mt-2">Seu histórico de cupons raspados aparecerá aqui.</p>
                                     <Button asChild className="mt-6">
                                        <Link href="/">Voltar</Link>
                                    </Button>
                                </div>
                            )}
                        </TabsContent>
                    </Tabs>
                ) : (
                     <div className="text-center py-16 px-4">
                         <Image src="https://picsum.photos/seed/no-scratch-card/200/200" alt="Ilustração de cupom" width={150} height={150} className="mx-auto mb-4 opacity-50" data-ai-hint="empty state illustration" />
                        <h3 className="text-xl font-bold">Nenhum Cupom Raspável disponível!</h3>
                        <p className="text-muted-foreground mt-2 max-w-sm mx-auto">No momento não existem Cupons Raspáveis disponíveis para você tentar a sorte!</p>
                        <Button onClick={() => { setSearched(false); setCpf(''); }} className="mt-6">
                           Voltar
                        </Button>
                    </div>
                )}
            </div>
          )}
        </div>
      </main>
      <Footer />
    </div>
  );
}

export default function RaspadinhasPageWrapper() {
    return (
        <FirebaseClientProvider>
            <RaspadinhasPage />
        </FirebaseClientProvider>
    )
}
