'use client';

import { useEffect, useRef, useState } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Alert, AlertDescription, AlertTitle } from './ui/alert';
import { CheckCircle2, Download, Ticket } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import {
  collection,
  query,
  where,
  getDocs,
  runTransaction,
  doc,
  serverTimestamp,
} from 'firebase/firestore';
import { useFirestore } from '@/firebase';
import { errorEmitter } from '@/firebase/error-emitter';
import { FirestorePermissionError } from '@/firebase/errors';
import html2canvas from 'html2canvas';
import { Logo } from './Logo';

const initialState: {
  message: string | null;
  coupon?: string | null;
  fullName?: string | null;
} = {
  message: null,
  coupon: null,
  fullName: null,
};

function SubmitButton() {
  const [pending, setPending] = useState(false);

  useEffect(() => {
    // A simple way to manage form pending state without useFormStatus
    const form = document.querySelector('form');
    if (!form) return;

    const handleSubmit = () => {
      setPending(true);
    };

    const handleReset = () => {
      setPending(false);
    };
    
    // This is a simplification; a real app might need a more robust state management
    form.addEventListener('submit', handleSubmit);
    // Assuming form is reset on success/error which stops pending
    // We don't have a direct 'end' event, so this is an approximation.
    
    return () => {
      form.removeEventListener('submit', handleSubmit);
    };
  }, []);


  return (
    <Button type="submit" className="w-full text-lg py-6" disabled={pending}>
      {pending ? 'Gerando...' : 'Gerar Cupom'}
      <Ticket className="ml-2 h-5 w-5" />
    </Button>
  );
}

export function RegistrationForm() {
  const firestore = useFirestore();
  const [state, setState] = useState(initialState);
  const [showSuccess, setShowSuccess] = useState(false);
  const formRef = useRef<HTMLFormElement>(null);
  const couponRef = useRef<HTMLDivElement>(null);
  const { toast } = useToast();

  useEffect(() => {
    if (state.coupon) {
      // Success
      setShowSuccess(true);
      formRef.current?.reset();
      const timer = setTimeout(() => {
        setShowSuccess(false);
        setState(initialState); // Reset state
      }, 20000); // Increased time to allow saving
      return () => clearTimeout(timer);
    } else if (state.message) {
      // Error from server (e.g., duplicate, db error)
      toast({
        variant: 'destructive',
        title: 'Erro no Cadastro',
        description: state.message,
      });
      setState(initialState); // Reset state after showing toast
    }
  }, [state, toast]);

  const handleSaveCoupon = () => {
    if (couponRef.current) {
      html2canvas(couponRef.current, {
        backgroundColor: null, // Use element's background
        scale: 2, // Increase resolution
      }).then((canvas) => {
        const link = document.createElement('a');
        link.download = `cupom-supermoda-${state.coupon}.png`;
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

    if (!nome || !cpf || !numeroCompra) {
      setState({ message: 'Preencha todos os campos.' });
      return;
    }
    if (cpf.length !== 11) {
      setState({ message: 'CPF deve ter 11 dígitos.' });
      return;
    }

    // Check for duplicates first
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
    
    const counterRef = doc(firestore, 'counters', 'coupons');

    runTransaction(firestore, async (transaction) => {
      const counterDoc = await transaction.get(counterRef);
      let nextNumber = 1;
      if (counterDoc.exists()) {
        nextNumber = (counterDoc.data().lastNumber || 0) + 1;
      }
      
      const couponNumber = `SM-${String(nextNumber).padStart(5, '0')}`;
      const couponRef = doc(collection(firestore, 'coupons'));
      
      const couponData = {
        id: couponRef.id,
        fullName: nome,
        cpf,
        purchaseNumber: numeroCompra,
        couponNumber: couponNumber,
        registrationDate: serverTimestamp(),
      };
      
      // Perform transaction writes
      transaction.set(counterRef, { lastNumber: nextNumber }, { merge: true });
      transaction.set(couponRef, couponData);

      return couponNumber;
    }).then((newCouponNumberStr) => {
      setState({
        message: 'Cadastro realizado com sucesso!',
        coupon: newCouponNumberStr,
        fullName: nome,
      });
    }).catch((error: any) => {
      // This is our new, detailed error handling.
      if (error.name === 'FirebaseError' && (error.code === 'permission-denied' || error.code === 'unauthenticated')) {
        // We can guess the operation was a write.
        // The exact failing doc isn't known without parsing the error, but we know the collections.
        const permissionError = new FirestorePermissionError({
          path: 'coupons/{couponId} OR counters/coupons', // Path that likely failed
          operation: 'write',
          requestResourceData: { fullName: nome, cpf, purchaseNumber: numeroCompra },
        });
        errorEmitter.emit('permission-error', permissionError);
      } else {
         setState({
            message: error.message || 'Erro no servidor. Não foi possível gerar o cupom. Tente novamente mais tarde.',
         });
      }
    });
  };

  return (
    <div className="space-y-6">
      {!showSuccess && (
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
              pattern="\d{11}"
            />
          </div>
          <div>
            <Label htmlFor="numeroCompra">Número da Compra</Label>
            <Input id="numeroCompra" name="numeroCompra" placeholder="Ex: 123456" required />
          </div>
          <SubmitButton />
        </form>
      )}

      {showSuccess && state.coupon && (
        <div className="text-center">
            <Alert
              variant="default"
              className="mb-4 bg-green-100 border-green-400 text-green-700 dark:bg-green-900/50 dark:border-green-700 dark:text-green-300"
            >
              <CheckCircle2 className="h-4 w-4 text-green-600 dark:text-green-400" />
              <AlertTitle>Sucesso!</AlertTitle>
              <AlertDescription>
                Seu cupom foi gerado! Salve a imagem abaixo.
              </AlertDescription>
            </Alert>

            <div ref={couponRef} className="bg-card p-6 rounded-lg border-2 border-dashed border-primary/50 shadow-lg inline-block">
                <div className="text-center space-y-4">
                    <Logo className="h-10 w-auto mx-auto"/>
                    <p className="text-muted-foreground">Parabéns pelo seu cupom!</p>
                    <p className="text-lg font-bold">{state.fullName}</p>
                    <div className="bg-primary text-primary-foreground rounded-md px-6 py-3">
                        <p className="text-sm">Seu Número da Sorte é:</p>
                        <p className="text-3xl font-bold tracking-wider">{state.coupon}</p>
                    </div>
                    <p className="text-xs text-muted-foreground pt-2">Boa Sorte!</p>
                </div>
            </div>

            <Button onClick={handleSaveCoupon} className="mt-6 w-full max-w-xs mx-auto">
                Salvar Imagem
                <Download className="ml-2 h-4 w-4" />
            </Button>
        </div>
      )}
    </div>
  );
}
