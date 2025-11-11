'use client';

import { useFormState, useFormStatus } from 'react-dom';
import { generateCoupon } from '@/app/actions';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { useEffect, useRef, useState } from 'react';
import { Alert, AlertDescription, AlertTitle } from './ui/alert';
import { CheckCircle2, Ticket } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';

const initialState: { message: string | null; errors?: any; coupon?: string | null } = {
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
  const [state, dispatch] = useFormState(generateCoupon, initialState);
  const [showSuccess, setShowSuccess] = useState(false);
  const formRef = useRef<HTMLFormElement>(null);
  const { toast } = useToast();

  useEffect(() => {
    if (state.coupon) { // Success
      setShowSuccess(true);
      formRef.current?.reset();
      const timer = setTimeout(() => {
        setShowSuccess(false);
      }, 10000);
      return () => clearTimeout(timer);
    } else if (state.message && !state.errors) { // Error from server (e.g., duplicate, db error)
        toast({
            variant: "destructive",
            title: "Erro no Cadastro",
            description: state.message,
        });
    }
  }, [state, toast]);

  return (
    <div className="space-y-6">
      <form ref={formRef} action={dispatch} className="space-y-4">
        <div>
          <Label htmlFor="nome">Nome Completo</Label>
          <Input id="nome" name="nome" placeholder="Seu nome completo" required aria-describedby="nome-error" />
          {state.errors?.nome && <p id="nome-error" className="text-sm font-medium text-destructive mt-1">{state.errors.nome[0]}</p>}
        </div>
        <div>
          <Label htmlFor="cpf">CPF</Label>
          <Input id="cpf" name="cpf" placeholder="Apenas números" required maxLength={11} pattern="\d{11}" aria-describedby="cpf-error"/>
          {state.errors?.cpf && <p id="cpf-error" className="text-sm font-medium text-destructive mt-1">{state.errors.cpf[0]}</p>}
        </div>
        <div>
          <Label htmlFor="numeroCompra">Número da Compra</Label>
          <Input id="numeroCompra" name="numeroCompra" placeholder="Ex: 123456" required aria-describedby="compra-error" />
          {state.errors?.numeroCompra && <p id="compra-error" className="text-sm font-medium text-destructive mt-1">{state.errors.numeroCompra[0]}</p>}
        </div>
        <SubmitButton />
      </form>

      {showSuccess && state.coupon && (
        <Alert variant="default" className="bg-green-100 border-green-400 text-green-700 dark:bg-green-900/50 dark:border-green-700 dark:text-green-300">
          <CheckCircle2 className="h-4 w-4 text-green-600 dark:text-green-400" />
          <AlertTitle>Sucesso!</AlertTitle>
          <AlertDescription>
            {state.message} Seu número da sorte é: <span className="font-bold text-lg">{state.coupon}</span>
          </AlertDescription>
        </Alert>
      )}
    </div>
  );
}
