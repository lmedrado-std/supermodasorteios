'use client';

import { useActionState, useEffect, useRef, useState } from 'react';
import { useFormStatus } from 'react-dom';
import {
  addDocumentNonBlocking,
  useFirestore,
} from '@/firebase';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Alert, AlertDescription, AlertTitle } from './ui/alert';
import { CheckCircle2, Ticket } from 'lucide-react';
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

const initialState: {
  message: string | null;
  errors?: any;
  coupon?: string | null;
} = {
  message: null,
  errors: {},
  coupon: null,
};

function SubmitButton() {
  const { pending } = useFormStatus();
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
  const { toast } = useToast();

  useEffect(() => {
    if (state.coupon) {
      // Success
      setShowSuccess(true);
      formRef.current?.reset();
      const timer = setTimeout(() => {
        setShowSuccess(false);
      }, 10000);
      return () => clearTimeout(timer);
    } else if (state.message && !state.errors) {
      // Error from server (e.g., duplicate, db error)
      toast({
        variant: 'destructive',
        title: 'Erro no Cadastro',
        description: state.message,
      });
    }
  }, [state, toast]);

  const generateCouponAction = async (formData: FormData) => {
    const nome = formData.get('nome') as string;
    const cpf = formData.get('cpf') as string;
    const numeroCompra = formData.get('numeroCompra') as string;

    if (!nome || !cpf || !numeroCompra) {
      return setState({ message: 'Preencha todos os campos.' });
    }
    if (cpf.length !== 11 || !/^\d+$/.test(cpf)) {
      return setState({ message: 'CPF deve ter 11 dígitos e conter apenas números.' });
    }

    try {
      const q = query(
        collection(firestore, 'coupons'),
        where('cpf', '==', cpf),
        where('purchaseNumber', '==', numeroCompra)
      );
      const querySnapshot = await getDocs(q);

      if (!querySnapshot.empty) {
        return setState({
          message:
            'Já existe um cupom cadastrado para este CPF e número de compra.',
        });
      }

      const counterRef = doc(firestore, 'counters', 'coupons');

      const newCouponNumberStr = await runTransaction(firestore, async (transaction) => {
        const counterDoc = await transaction.get(counterRef);
        let nextNumber = 1;
        if (counterDoc.exists()) {
          nextNumber = (counterDoc.data().lastNumber || 0) + 1;
        }
        transaction.set(counterRef, { lastNumber: nextNumber }, { merge: true });
        
        const couponNumber = `SM-${String(nextNumber).padStart(5, '0')}`;
        
        const couponRef = doc(collection(firestore, "coupons"));
        
        transaction.set(couponRef, {
            id: couponRef.id,
            fullName: nome,
            cpf,
            purchaseNumber: numeroCompra,
            couponNumber: couponNumber,
            registrationDate: serverTimestamp(),
        });

        return couponNumber;
      });


      setState({
        message: 'Cadastro realizado com sucesso!',
        coupon: newCouponNumberStr,
      });
    } catch (error) {
      console.error(error);
      setState({
        message:
          'Erro no servidor. Não foi possível gerar o cupom. Tente novamente mais tarde.',
      });
    }
  };

  return (
    <div className="space-y-6">
      <form ref={formRef} action={generateCouponAction} className="space-y-4">
        <div>
          <Label htmlFor="nome">Nome Completo</Label>
          <Input
            id="nome"
            name="nome"
            placeholder="Seu nome completo"
            required
            aria-describedby="nome-error"
          />
          {state.errors?.nome && (
            <p id="nome-error" className="text-sm font-medium text-destructive mt-1">
              {state.errors.nome[0]}
            </p>
          )}
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
            aria-describedby="cpf-error"
          />
          {state.errors?.cpf && (
            <p id="cpf-error" className="text-sm font-medium text-destructive mt-1">
              {state.errors.cpf[0]}
            </p>
          )}
        </div>
        <div>
          <Label htmlFor="numeroCompra">Número da Compra</Label>
          <Input
            id="numeroCompra"
            name="numeroCompra"
            placeholder="Ex: 123456"
            required
            aria-describedby="compra-error"
          />
          {state.errors?.numeroCompra && (
            <p id="compra-error" className="text-sm font-medium text-destructive mt-1">
              {state.errors.numeroCompra[0]}
            </p>
          )}
        </div>
        <SubmitButton />
      </form>

      {showSuccess && state.coupon && (
        <Alert
          variant="default"
          className="bg-green-100 border-green-400 text-green-700 dark:bg-green-900/50 dark:border-green-700 dark:text-green-300"
        >
          <CheckCircle2 className="h-4 w-4 text-green-600 dark:text-green-400" />
          <AlertTitle>Sucesso!</AlertTitle>
          <AlertDescription>
            {state.message} Seu número da sorte é:{' '}
            <span className="font-bold text-lg">{state.coupon}</span>
          </AlertDescription>
        </Alert>
      )}
    </div>
  );
}
