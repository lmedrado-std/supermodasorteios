'use client';
import { useState } from 'react';
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
import { format } from 'date-fns';

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
                    pattern="\d{11}"
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
                <div className="mt-8">
                  {coupons.length > 0 ? (
                    <div className="space-y-4">
                       <h3 className="text-lg font-semibold text-center">
                        Cupons encontrados para {coupons[0].fullName}:
                      </h3>
                      <ul className="grid grid-cols-2 sm:grid-cols-3 gap-4">
                        {coupons.map((coupon) => (
                          <li
                            key={coupon.id}
                            className="bg-primary/10 border border-primary/20 rounded-md p-4 text-center"
                          >
                            <p className="font-bold text-xl text-primary tracking-wider">
                              {coupon.couponNumber}
                            </p>
                            <p className="text-xs text-muted-foreground">
                              {format(
                                coupon.registrationDate.toDate(),
                                'dd/MM/yy'
                              )}
                            </p>
                          </li>
                        ))}
                      </ul>
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
