'use client';

import { useEffect, useRef, useState } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Alert, AlertDescription, AlertTitle } from './ui/alert';
import { CheckCircle2, Download, Ticket, Info, Calendar } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import {
  collection,
  query,
  where,
  getDocs,
  runTransaction,
  doc,
  serverTimestamp,
  writeBatch,
  getDoc,
  Timestamp,
} from 'firebase/firestore';
import { useFirestore } from '@/firebase';
import { errorEmitter } from '@/firebase/error-emitter';
import { FirestorePermissionError } from '@/firebase/errors';
import html2canvas from 'html2canvas';
import { CouponLogo } from './CouponLogo';
import { format, parseISO, startOfDay, endOfDay } from 'date-fns';
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group';

const initialState: {
  message: string | null;
  coupons?: string[];
  fullName?: string | null;
  purchaseValue?: number | null;
  purchaseNumber?: string | null;
  registrationDate?: Date | null;
  purchaseDate?: Date | null;
} = {
  message: null,
  coupons: [],
  fullName: null,
  purchaseValue: null,
  purchaseNumber: null,
  registrationDate: null,
  purchaseDate: null,
};

type RaffleSettings = {
  valuePerCoupon: number;
  campaignStartDate?: Timestamp;
  campaignEndDate?: Timestamp;
};

function SubmitButton() {
  const [pending, setPending] = useState(false);

  useEffect(() => {
    const form = document.querySelector('form');
    if (!form) return;

    const handleSubmit = () => setPending(true);
    const handleFormEnd = () => setPending(false);

    form.addEventListener('submit', handleSubmit);
    // This is a custom event to signal the end of processing
    document.addEventListener('formProcessingEnd', handleFormEnd);
    
    return () => {
      form.removeEventListener('submit', handleSubmit);
      document.removeEventListener('formProcessingEnd', handleFormEnd);
    };
  }, []);

  return (
    <Button type="submit" className="w-full text-lg py-6" disabled={pending}>
      {pending ? 'Gerando...' : 'Gerar Cupom(ns)'}
      <Ticket className="ml-2 h-5 w-5" />
    </Button>
  );
}

export function RegistrationForm() {
  const firestore = useFirestore();
  const [state, setState] = useState(initialState);
  const [showSuccess, setShowSuccess] = useState(false);
  const [raffleSettings, setRaffleSettings] = useState<RaffleSettings | null>(null);
  const formRef = useRef<HTMLFormElement>(null);
  const couponContainerRef = useRef<HTMLDivElement>(null);
  const { toast } = useToast();

  const signalFormEnd = () => {
    document.dispatchEvent(new CustomEvent('formProcessingEnd'));
  };
  
  useEffect(() => {
    if (!firestore) return;

    const fetchSettings = async () => {
      try {
        const settingsDocRef = doc(firestore, 'settings/raffle');
        const settingsDoc = await getDoc(settingsDocRef);
        if (settingsDoc.exists()) {
          setRaffleSettings(settingsDoc.data() as RaffleSettings);
        } else {
          // Fallback to a default if not set
          setRaffleSettings({ valuePerCoupon: 200 });
        }
      } catch (e) {
        console.warn("Could not fetch raffle settings. Using default value.", e);
        setRaffleSettings({ valuePerCoupon: 200 });
      }
    };

    fetchSettings();
  }, [firestore]);


  useEffect(() => {
    if (state.message) {
      // Error from server (e.g., duplicate, db error)
      toast({
        variant: 'destructive',
        title: 'Erro no Cadastro',
        description: state.message,
      });
      setState(initialState); // Reset state after showing toast
      signalFormEnd();
    } else if (state.coupons && state.coupons.length > 0) {
      // Success
      setShowSuccess(true);
      formRef.current?.reset();
      signalFormEnd();
      // Auto-hide logic is removed to allow user to save image
    }
  }, [state, toast]);

  const handleSaveCoupon = () => {
    if (couponContainerRef.current) {
        const couponNode = couponContainerRef.current;
        html2canvas(couponNode, {
            backgroundColor: '#dc2626', // Match the background
            scale: 2,
            useCORS: true,
        }).then((canvas) => {
            const link = document.createElement('a');
            const firstCoupon = state.coupons ? state.coupons[0] : 'cupom';
            link.download = `cupom-supermoda-${firstCoupon}.png`;
            link.href = canvas.toDataURL('image/png');
            link.click();
        });
    }
  };

  const generateCouponAction = async (formData: FormData) => {
    if (!firestore || !raffleSettings) {
      setState({ message: 'Serviço de banco de dados ou configurações não disponíveis.' });
      return;
    }
    
    const quizAnswer = formData.get('quiz') as string;
    if (quizAnswer !== 'supermoda') {
        setState({ message: 'Resposta incorreta. Tente novamente!' });
        return;
    }

    const nome = formData.get('nome') as string;
    const cpf = (formData.get('cpf') as string).replace(/\D/g, '');
    const numeroCompra = formData.get('numeroCompra') as string;
    const valorCompraStr = (formData.get('valorCompra') as string).replace(',', '.');
    const valorCompra = parseFloat(valorCompraStr);
    const dataCompraStr = formData.get('dataCompra') as string;

    if (!nome || !cpf || !numeroCompra || !valorCompraStr || !dataCompraStr) {
      setState({ message: 'Preencha todos os campos.' });
      return;
    }
    if (cpf.length !== 11) {
      setState({ message: 'CPF deve ter 11 dígitos.' });
      return;
    }
    if (isNaN(valorCompra) || valorCompra <= 0) {
        setState({ message: 'Valor da compra inválido.' });
        return;
    }
    
    const dataCompra = parseISO(dataCompraStr);
    if (isNaN(dataCompra.getTime())) {
        setState({ message: 'Data da compra inválida.' });
        return;
    }

    // Campaign date validation
    if (raffleSettings.campaignStartDate && raffleSettings.campaignEndDate) {
        const startDate = startOfDay(raffleSettings.campaignStartDate.toDate());
        const endDate = endOfDay(raffleSettings.campaignEndDate.toDate());
        if (dataCompra < startDate || dataCompra > endDate) {
            setState({
                message: `A data da compra deve estar entre ${format(startDate, 'dd/MM/yyyy')} e ${format(endDate, 'dd/MM/yyyy')}.`
            });
            return;
        }
    } else {
        setState({ message: 'O período da campanha não está configurado. Contate o administrador.' });
        return;
    }

    const q = query(
      collection(firestore, 'coupons'),
      where('purchaseNumber', '==', numeroCompra)
    );
    const querySnapshot = await getDocs(q);

    if (!querySnapshot.empty) {
      setState({
        message: 'Este número de compra já foi utilizado para gerar cupons.',
      });
      return;
    }
    
    // Use the settings from state
    const valuePerCoupon = raffleSettings.valuePerCoupon > 0 ? raffleSettings.valuePerCoupon : 200;

    const couponsToGenerate = Math.floor(valorCompra / valuePerCoupon);

    if (couponsToGenerate < 1) {
        setState({ message: `O valor da compra deve ser de no mínimo R$ ${valuePerCoupon.toFixed(2).replace('.',',')} para gerar um cupom.` });
        return;
    }

    const counterRef = doc(firestore, 'counters', 'coupons');
    const registrationDate = new Date();

    runTransaction(firestore, async (transaction) => {
        const counterDoc = await transaction.get(counterRef);
        let currentNumber = 0;
        if (counterDoc.exists()) {
            currentNumber = counterDoc.data().lastNumber || 0;
        } else {
            transaction.set(counterRef, { lastNumber: 0 });
        }
        
        const newCoupons: string[] = [];
        const batch = writeBatch(firestore);

        for (let i = 0; i < couponsToGenerate; i++) {
            const nextNumber = currentNumber + i + 1;
            const couponNumber = `SM-${String(nextNumber).padStart(5, '0')}`;
            newCoupons.push(couponNumber);

            const couponRef = doc(collection(firestore, 'coupons'));
            const couponData = {
                id: couponRef.id,
                fullName: nome,
                cpf,
                purchaseNumber: numeroCompra,
                purchaseValue: valorCompra,
                purchaseDate: Timestamp.fromDate(dataCompra),
                couponNumber: couponNumber,
                registrationDate: Timestamp.fromDate(registrationDate),
            };
            batch.set(couponRef, couponData);
        }

        const finalCounterNumber = currentNumber + couponsToGenerate;
        transaction.set(counterRef, { lastNumber: finalCounterNumber }, { merge: true });

        await batch.commit();
        return newCoupons;
    }).then((generatedCoupons) => {
      setState({
        message: null,
        coupons: generatedCoupons,
        fullName: nome,
        purchaseValue: valorCompra,
        purchaseNumber: numeroCompra,
        registrationDate: registrationDate,
        purchaseDate: dataCompra,
      });
    }).catch((error: any) => {
      console.error("Transaction failed: ", error);
      if (error.name === 'FirebaseError' && (error.code === 'permission-denied' || error.code === 'unauthenticated')) {
        const permissionError = new FirestorePermissionError({
          path: 'coupons/{couponId} OR counters/coupons',
          operation: 'write',
          requestResourceData: { fullName: nome, cpf, numeroCompra, purchaseValue: valorCompra },
        });
        errorEmitter.emit('permission-error', permissionError);
        setState({ message: 'Erro de permissão. Contate o administrador.' });
      } else {
         setState({
            message: error.message || 'Erro no servidor. Não foi possível gerar o cupom. Tente novamente mais tarde.',
         });
      }
    });
  };

  if (showSuccess) {
    return (
       <div className="text-center animate-in fade-in-50 slide-in-from-bottom-5 duration-500">
          <Alert
            variant="default"
            className="mb-6 bg-green-100 border-green-400 text-green-700 dark:bg-green-900/50 dark:border-green-700 dark:text-green-300"
          >
            <CheckCircle2 className="h-4 w-4 text-green-600 dark:text-green-400" />
            <AlertTitle>Sucesso! Seu(s) cupom(ns) foi(foram) gerado(s)!</AlertTitle>
            <AlertDescription>
              Salve a imagem abaixo para não perdê-la.
            </AlertDescription>
          </Alert>
            
          <div className="flex flex-col items-center gap-6">
            <div ref={couponContainerRef} className="bg-red-600 rounded-2xl p-2 shadow-2xl w-full max-w-sm">
                <div className="relative bg-white rounded-xl p-6 text-center space-y-4">
                    {/* Perforated edges effect */}
                    <div className="absolute top-28 -left-3 w-6 h-6 bg-red-600 rounded-full"></div>
                    <div className="absolute top-28 -right-3 w-6 h-6 bg-red-600 rounded-full"></div>
                    
                    <h2 className="text-2xl font-bold text-red-600 font-headline">Sorteio Supermoda</h2>
                    {state.coupons && state.coupons.length > 0 && (
                        <div className="bg-amber-100 border-2 border-dashed border-amber-400 rounded-lg py-1 px-3 inline-block">
                           <p className="text-sm font-bold text-amber-800">Você gerou <span className="text-base">{state.coupons.length}</span> cupom(ns) nesta compra!</p>
                        </div>
                    )}
                    <div className="border-t-2 border-dashed border-gray-300 w-full my-4 pt-4 flex justify-between items-center">
                        <div>
                            <p className="text-3xl md:text-4xl font-black tracking-wider text-transparent bg-clip-text bg-gradient-to-b from-yellow-300 to-amber-500" style={{textShadow: '1px 1px 2px rgba(0,0,0,0.2)'}}>{state.coupons?.[0]}</p>
                        </div>
                        <div className="text-right">
                           <p className="text-sm font-bold text-red-600 uppercase">{state.fullName}</p>
                        </div>
                    </div>

                    {state.coupons && state.coupons.length > 1 && (
                      <div className="grid grid-cols-2 gap-x-4 gap-y-1 text-lg font-bold text-gray-700">
                        {state.coupons.slice(1).map(coupon => <p key={coupon}>{coupon}</p>)}
                      </div>
                    )}

                    <div className="pt-4 flex flex-col items-center justify-center gap-4">
                        <CouponLogo className="w-40 h-auto" />
                    </div>

                    <div className="text-left text-xs text-gray-600 space-y-1 pt-4 border-t border-dashed">
                       <p><span className="font-bold">Data Cadastro:</span> {state.registrationDate ? format(state.registrationDate, 'dd/MM/yyyy HH:mm') : 'N/A'}</p>
                      <p><span className="font-bold">Data Compra:</span> {state.purchaseDate ? format(state.purchaseDate, 'dd/MM/yyyy') : 'N/A'}</p>
                      <p><span className="font-bold">Valor Compra:</span> R$ {state.purchaseValue?.toLocaleString('pt-BR', { minimumFractionDigits: 2, maximumFractionDigits: 2 }) ?? 'N/A'}</p>
                      <p><span className="font-bold">Nº Compra:</span> {state.purchaseNumber ?? 'N/A'}</p>
                    </div>

                    <div className="flex justify-between items-center pt-4">
                        <p className="text-xs font-semibold text-amber-600">♦︎♦︎ Boa Sorte!</p>
                        <Button onClick={handleSaveCoupon} size="sm" className="bg-red-600 text-white rounded-full px-6 shadow-md border-2 border-amber-400 hover:bg-red-700">
                            <Download className="mr-2" /> Salvar
                        </Button>
                    </div>
                </div>
            </div>

             <Button variant="outline" onClick={() => { setShowSuccess(false); setState(initialState); }} className="w-full max-w-sm mx-auto">
                Registrar Novo Cupom
            </Button>
          </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <form
        ref={formRef}
        action={generateCouponAction}
        className="space-y-4"
        onSubmit={(e) => {
          e.preventDefault();
          const formData = new FormData(e.currentTarget);
          generateCouponAction(formData);
        }}
      >
        <div>
          <Label htmlFor="nome">Nome Completo</Label>
          <Input id="nome" name="nome" placeholder="Seu nome completo" required />
        </div>
        <div>
          <Label htmlFor="cpf">CPF</Label>
          <Input
            id="cpf"
            name="cpf"
            placeholder="Apenas números"
            required
            maxLength={11}
          />
        </div>
        <div>
          <Label htmlFor="numeroCompra">Número da Compra</Label>
          <Input id="numeroCompra" name="numeroCompra" placeholder="Ex: 123456" required />
          <p className="text-xs text-muted-foreground mt-1">Este número deve ser o mesmo da nota fiscal para validação na loja.</p>
        </div>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
                <Label htmlFor="valorCompra">Valor da Compra (R$)</Label>
                <Input id="valorCompra" name="valorCompra" placeholder="Ex: 250,50" required inputMode="decimal" />
            </div>
            <div>
                <Label htmlFor="dataCompra">Data da Compra</Label>
                <Input id="dataCompra" name="dataCompra" type="date" required />
            </div>
        </div>

        <div className="space-y-3">
          <Label>Qual é a loja que te deixa na moda e ainda te dá a chance de ganhar prêmios?</Label>
          <RadioGroup name="quiz" required className="flex flex-col space-y-1">
            <div className="flex items-center space-x-2">
              <RadioGroupItem value="supermoda" id="r1" />
              <Label htmlFor="r1" className="font-normal">Claro que é a Supermoda!</Label>
            </div>
            <div className="flex items-center space-x-2">
              <RadioGroupItem value="other-a" id="r2" />
              <Label htmlFor="r2" className="font-normal">Talvez outra loja...</Label>
            </div>
            <div className="flex items-center space-x-2">
              <RadioGroupItem value="other-b" id="r3" />
              <Label htmlFor="r3" className="font-normal">Ainda estou descobrindo 😄</Label>
            </div>
          </RadioGroup>
        </div>

           {raffleSettings && (
            <div className="mt-2 flex flex-col gap-2 text-sm text-muted-foreground bg-secondary/10 p-3 rounded-lg border border-secondary/20">
                <div className="flex items-center gap-2">
                    <Info className="h-4 w-4 flex-shrink-0 text-secondary" />
                    <span>A cada <strong>R$ {raffleSettings.valuePerCoupon > 0 ? raffleSettings.valuePerCoupon.toFixed(2).replace('.', ',') : 'N/A'}</strong> em compras, você ganha 1 cupom.</span>
                </div>
                {raffleSettings.campaignStartDate && raffleSettings.campaignEndDate && (
                    <div className="flex items-center gap-2">
                        <Calendar className="h-4 w-4 flex-shrink-0 text-secondary" />
                        <span>Campanha válida para compras de <strong>{format(raffleSettings.campaignStartDate.toDate(), 'dd/MM/yy')}</strong> a <strong>{format(raffleSettings.campaignEndDate.toDate(), 'dd/MM/yy')}</strong>.</span>
                    </div>
                )}
            </div>
           )}
        <SubmitButton />
      </form>
    </div>
  );
}
