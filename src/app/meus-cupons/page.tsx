'use client';
import { useState, useRef, useMemo } from 'react';
import {
  collection,
  query,
  where,
  getDocs,
  Timestamp,
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
import { Search, Download, Calendar, ShoppingCart, DollarSign, Clock } from 'lucide-react';
import html2canvas from 'html2canvas';
import { format } from 'date-fns';
import { ScrollArea } from '@/components/ui/scroll-area';

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

function MeusCuponsPage() {
  const firestore = useFirestore();
  const [cpf, setCpf] = useState('');
  const [coupons, setCoupons] = useState<Coupon[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [searched, setSearched] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const couponContainerRef = useRef<HTMLDivElement>(null);


  const handleSearch = async () => {
    if (!firestore) return;
    const formattedCpf = cpf.replace(/\D/g, '');
    if (formattedCpf.length !== 11) {
      setError('Por favor, digite um CPF válido com 11 dígitos.');
      return;
    }

    setIsLoading(true);
    setSearched(true);
    setCoupons([]);
    setError(null);

    try {
      const q = query(
        collection(firestore, 'coupons'),
        where('cpf', '==', formattedCpf)
      );
      const querySnapshot = await getDocs(q);
      const foundCoupons: Coupon[] = [];
      querySnapshot.forEach((doc) => {
        foundCoupons.push({ id: doc.id, ...doc.data() } as Coupon);
      });
      setCoupons(
        foundCoupons.sort((a, b) =>
          a.couponNumber.localeCompare(b.couponNumber)
        )
      );
    } catch (e) {
      console.error(e);
      setError('Ocorreu um erro ao buscar seus cupons. Tente novamente.');
    } finally {
      setIsLoading(false);
    }
  };
  
  const handleSaveCoupon = () => {
    if (couponContainerRef.current && coupons.length > 0) {
      html2canvas(couponContainerRef.current, {
        scale: 2,
        useCORS: true,
        backgroundColor: null,
      }).then((canvas) => {
        const link = document.createElement('a');
        const firstCoupon = coupons[0].couponNumber;
        link.download = `meus-cupons-supermoda-${firstCoupon}.png`;
        link.href = canvas.toDataURL('image/png');
        link.click();
      });
    }
  };


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
                Digite seu CPF para encontrar todos os seus números da sorte.
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
                <div className="mt-8 text-center animate-in fade-in-50 duration-500">
                  {coupons.length > 0 ? (
                     <div className="flex flex-col items-center gap-6">
                        <div ref={couponContainerRef} className="bg-card rounded-2xl shadow-2xl w-full max-w-md overflow-hidden border">
                            {/* Header */}
                            <div className="bg-primary p-4 text-center">
                                <h2 className="text-2xl font-bold text-primary-foreground font-headline flex items-center justify-center gap-2">
                                    🎟️ Sorteio Supermoda!
                                </h2>
                            </div>
                            
                            <div className="p-6 space-y-6">
                                {/* Coupon Info */}
                                <div className="text-center">
                                    <p className="text-5xl font-black tracking-wider" style={{color: '#e30613'}}>{coupons[0].couponNumber}</p>
                                    <p className="text-lg text-muted-foreground mt-1">{coupons[0].fullName}</p>
                                </div>

                                {/* Multiple coupons */}
                                {coupons.length > 1 && (
                                    <div className="text-center">
                                        <p className="font-bold mb-2">Seus Cupons (Total: {coupons.length})</p>
                                        <ScrollArea className="h-28 w-full rounded-md border p-4">
                                            <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
                                                {coupons.slice(0, 12).map(coupon => (
                                                    <div key={coupon.id} className="border rounded-md p-2 text-center bg-muted/50">
                                                        <p className="font-bold text-sm">🏷️ {coupon.couponNumber}</p>
                                                    </div>
                                                ))}
                                            </div>
                                        </ScrollArea>
                                    </div>
                                )}
                                
                                {/* Divider */}
                                <div className="border-t-2 border-dashed w-full"></div>

                                {/* Purchase Info */}
                                <div className="grid grid-cols-1 sm:grid-cols-2 gap-x-4 gap-y-3 text-sm text-left">
                                    <div className="flex items-center gap-2">
                                        <DollarSign className="h-4 w-4 text-muted-foreground"/>
                                        <div>
                                            <p className="font-bold">Valor da Compra</p>
                                            <p>R$ {coupons[0].purchaseValue?.toLocaleString('pt-BR', { minimumFractionDigits: 2, maximumFractionDigits: 2 }) ?? 'N/A'}</p>
                                        </div>
                                    </div>
                                     <div className="flex items-center gap-2">
                                        <ShoppingCart className="h-4 w-4 text-muted-foreground"/>
                                        <div>
                                            <p className="font-bold">Nº da Compra</p>
                                            <p>{coupons[0].purchaseNumber ?? 'N/A'}</p>
                                        </div>
                                    </div>
                                    <div className="flex items-center gap-2">
                                        <Calendar className="h-4 w-4 text-muted-foreground"/>
                                        <div>
                                            <p className="font-bold">Data da Compra</p>
                                            <p>{coupons[0].purchaseDate ? format(coupons[0].purchaseDate.toDate(), 'dd/MM/yyyy') : 'N/A'}</p>
                                        </div>
                                    </div>
                                    <div className="flex items-center gap-2">
                                        <Clock className="h-4 w-4 text-muted-foreground"/>
                                        <div>
                                            <p className="font-bold">Data do Cadastro</p>
                                            <p>{coupons[0].registrationDate ? format(coupons[0].registrationDate.toDate(), 'dd/MM/yyyy HH:mm') : 'N/A'}</p>
                                        </div>
                                    </div>
                                </div>
                            </div>
                             {/* Footer */}
                            <div className="bg-muted p-4 mt-4 text-center">
                               <p className="text-sm font-bold text-muted-foreground">❤️ Supermoda!</p>
                               <p className="text-xs text-muted-foreground">Boa sorte no sorteio!</p>
                            </div>
                        </div>
                        <Button onClick={handleSaveCoupon} size="lg" className="bg-[#e30613] text-white hover:bg-[#f5b800] w-full max-w-md">
                            <Download className="mr-2" /> Baixar Cupom
                        </Button>
                    </div>
                  ) : (
                    <p className="text-center text-muted-foreground">
                      Nenhum cupom encontrado para o CPF informado.
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
