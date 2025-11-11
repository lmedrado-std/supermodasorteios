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
import { Search, Download } from 'lucide-react';
import { Logo } from '@/components/Logo';
import html2canvas from 'html2canvas';


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
        backgroundColor: null,
        scale: 2,
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
                    <div className="space-y-6">
                        <div ref={couponContainerRef} className="bg-gradient-to-br from-background to-secondary/50 p-6 rounded-lg border-2 border-dashed border-primary/50 shadow-lg inline-block w-full max-w-md">
                          <div className="text-center space-y-4">
                              <Logo className="h-10 w-auto mx-auto"/>
                              <p className="text-muted-foreground">Parabéns! Aqui estão seus números da sorte.</p>
                              <p className="text-2xl font-bold text-primary">{coupons[0].fullName}</p>
                              <div className="bg-primary/10 border border-primary/20 rounded-md px-4 py-3 space-y-2">
                                  <p className="text-sm font-semibold text-primary">Seus Números da Sorte:</p>
                                  <div className="grid grid-cols-2 gap-x-4 gap-y-2">
                                    {coupons.map(coupon => (
                                      <p key={coupon.id} className="text-2xl font-bold tracking-wider text-foreground">{coupon.couponNumber}</p>
                                    ))}
                                  </div>
                              </div>
                              <p className="text-xs text-muted-foreground pt-2">Boa Sorte no sorteio! 🍀</p>
                          </div>
                      </div>
                      <Button onClick={handleSaveCoupon} className="w-full max-w-xs mx-auto">
                        Salvar Meus Cupons
                        <Download className="ml-2 h-4 w-4" />
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
