'use client';
import { useState, useRef } from 'react';
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
import { Search } from 'lucide-react';
import html2canvas from 'html2canvas';
import { CouponLogo } from '@/components/CouponLogo';
import { QRCodePlaceholder } from '@/components/QRCodePlaceholder';


type Coupon = {
  id: string;
  fullName: string;
  cpf: string;
  purchaseNumber: string;
  purchaseValue: number;
  couponNumber: string;
  registrationDate: Timestamp;
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
        backgroundColor: '#dc2626',
        scale: 2,
        useCORS: true,
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
                        <div ref={couponContainerRef} className="bg-red-600 rounded-2xl p-2 shadow-2xl w-full max-w-sm">
                            <div className="relative bg-white rounded-xl p-6 text-center space-y-4">
                                {/* Perforated edges effect */}
                                <div className="absolute top-28 -left-3 w-6 h-6 bg-red-600 rounded-full"></div>
                                <div className="absolute top-28 -right-3 w-6 h-6 bg-red-600 rounded-full"></div>
                                
                                <h2 className="text-2xl font-bold text-red-600">Supermoda Raffle Coupon</h2>
                                <div className="border-t-2 border-dashed border-gray-300 w-full my-4 pt-4 flex justify-between items-center">
                                    <div>
                                        <p className="text-3xl md:text-4xl font-black tracking-wider text-transparent bg-clip-text bg-gradient-to-b from-yellow-300 to-amber-500" style={{textShadow: '1px 1px 2px rgba(0,0,0,0.2)'}}>{coupons[0].couponNumber}</p>
                                    </div>
                                    <div className="text-right">
                                       <p className="text-sm font-bold text-red-600 uppercase">{coupons[0].fullName}</p>
                                    </div>
                                </div>
                                
                                {coupons.length > 1 && (
                                  <div className="grid grid-cols-2 gap-x-4 gap-y-1 text-lg font-bold text-gray-700">
                                    {coupons.slice(1).map(coupon => <p key={coupon.id}>{coupon.couponNumber}</p>)}
                                  </div>
                                )}


                                <div className="pt-4 flex flex-col items-center justify-center gap-4">
                                    <CouponLogo className="w-32 h-auto" />
                                    <div className="p-1 border-2 border-amber-400 rounded-lg inline-block">
                                       <QRCodePlaceholder className="w-28 h-28" />
                                    </div>
                                </div>

                                <div className="flex justify-between items-center pt-4">
                                    <p className="text-xs font-semibold text-amber-600">♦︎♦︎ Good luck!</p>
                                    <Button onClick={handleSaveCoupon} size="sm" className="bg-red-600 text-white rounded-full px-6 shadow-md border-2 border-amber-400 hover:bg-red-700">
                                        Download
                                    </Button>
                                </div>
                            </div>
                        </div>
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
