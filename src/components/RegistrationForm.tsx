'use client';

import { useEffect, useRef, useState } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Alert, AlertDescription, AlertTitle } from './ui/alert';
import { CheckCircle2, Download, Ticket, Info } from 'lucide-react';
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
} from 'firebase/firestore';
import { useFirestore } from '@/firebase';
import { errorEmitter } from '@/firebase/error-emitter';
import { FirestorePermissionError } from '@/firebase/errors';
import html2canvas from 'html2canvas';
import { Logo } from './Logo';

const initialState: {
  message: string | null;
  coupons?: string[];
  fullName?: string | null;
} = {
  message: null,
  coupons: [],
  fullName: null,
};

type RaffleSettings = {
  valuePerCoupon: number;
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
        if (settingsDoc.exists() && settingsDoc.data().valuePerCoupon > 0) {
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
      html2canvas(couponContainerRef.current, {
        backgroundColor: null,
        scale: 2,
      }).then((canvas) => {
        const link = document.createElement('a');
        const firstCoupon = state.coupons ? state.coupons[0] : 'cupom';
        link.download = `cupons-supermoda-${firstCoupon}.png`;
        link.href = canvas.toDataURL('image/png');
        link.click();
      });
    }
  };

  const generateCouponAction = async (formData: FormData) => {
    if (!firestore) {
      setState({ message: 'Serviço de banco de dados não disponível.' });
      return;
    }

    const nome = formData.get('nome') as string;
    const cpf = (formData.get('cpf') as string).replace(/\D/g, '');
    const numeroCompra = formData.get('numeroCompra') as string;
    const valorCompraStr = (formData.get('valorCompra') as string).replace(',', '.');
    const valorCompra = parseFloat(valorCompraStr);

    if (!nome || !cpf || !numeroCompra || !valorCompraStr) {
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

    const q = query(
      collection(firestore, 'coupons'),
      where('cpf', '==', cpf),
      where('purchaseNumber', '==', numeroCompra)
    );
    const querySnapshot = await getDocs(q);

    if (!querySnapshot.empty) {
      setState({
        message: 'Já existe um cupom cadastrado para este CPF e número de compra.',
      });
      return;
    }
    
    // Use the settings from state
    const valuePerCoupon = raffleSettings ? raffleSettings.valuePerCoupon : 200;

    const couponsToGenerate = Math.floor(valorCompra / valuePerCoupon);

    if (couponsToGenerate < 1) {
        setState({ message: `O valor da compra deve ser de no mínimo R$ ${valuePerCoupon.toFixed(2).replace('.',',')} para gerar um cupom.` });
        return;
    }

    const counterRef = doc(firestore, 'counters', 'coupons');

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
                couponNumber: couponNumber,
                registrationDate: serverTimestamp(),
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
      });
    }).catch((error: any) => {
      console.error("Transaction failed: ", error);
      if (error.name === 'FirebaseError' && (error.code === 'permission-denied' || error.code === 'unauthenticated')) {
        const permissionError = new FirestorePermissionError({
          path: 'coupons/{couponId} OR counters/coupons',
          operation: 'write',
          requestResourceData: { fullName: nome, cpf, purchaseNumber: numeroCompra, purchaseValue: valorCompra },
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
            <AlertTitle>Sucesso! Seus cupons foram gerados!</AlertTitle>
            <AlertDescription>
              Salve a imagem abaixo para não perdê-los.
            </AlertDescription>
          </Alert>

          <div ref={couponContainerRef} className="bg-gradient-to-br from-background to-secondary/50 p-6 rounded-lg border-2 border-dashed border-primary/50 shadow-lg inline-block w-full max-w-md">
              <div className="text-center space-y-4">
                  <Logo className="h-10 w-auto mx-auto"/>
                  <p className="text-muted-foreground">Parabéns! Guarde seus números da sorte.</p>
                  <p className="text-2xl font-bold text-primary">{state.fullName}</p>
                  <div className="bg-primary/10 border border-primary/20 rounded-md px-4 py-3 space-y-2">
                      <p className="text-sm font-semibold text-primary">Seus Números da Sorte:</p>
                      <div className="grid grid-cols-2 gap-x-4 gap-y-2">
                        {state.coupons?.map(coupon => (
                          <p key={coupon} className="text-2xl font-bold tracking-wider text-foreground">{coupon}</p>
                        ))}
                      </div>
                  </div>
                  <p className="text-xs text-muted-foreground pt-2">Boa Sorte no sorteio! 🍀</p>
              </div>
          </div>

          <div className="mt-6 flex flex-col items-center gap-4">
            <Button onClick={handleSaveCoupon} className="w-full max-w-xs mx-auto">
                Salvar Imagem
                <Download className="ml-2 h-4 w-4" />
            </Button>
            <Button variant="outline" onClick={() => { setShowSuccess(false); setState(initialState); }} className="w-full max-w-xs mx-auto">
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
          generateCouponAction(new FormData(e.currentTarget));
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
        <div>
          <Label htmlFor="valorCompra">Valor da Compra (R$)</Label>
          <Input id="valorCompra" name="valorCompra" placeholder="Ex: 250,50" required inputMode="decimal" />
           {raffleSettings && (
            <div className="mt-2 flex items-center gap-2 text-sm text-muted-foreground bg-secondary/50 p-2 rounded-md">
                <Info className="h-4 w-4 flex-shrink-0" />
                <span>A cada <strong>R$ {raffleSettings.valuePerCoupon.toFixed(2).replace('.', ',')}</strong> em compras, você ganha 1 cupom.</span>
            </div>
           )}
        </div>
        <SubmitButton />
      </form>
    </div>
  );
}
