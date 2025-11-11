'use client';

import { useActionState, useEffect } from 'react';
import { useFormStatus } from 'react-dom';
import { login } from '@/app/actions';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from '@/components/ui/card';
import { LogIn } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import Link from 'next/link';
import { Logo } from '@/components/Logo';

const initialState = { message: null, errors: {} };

function LoginButton() {
  const { pending } = useFormStatus();
  return (
    <Button type="submit" className="w-full" disabled={pending}>
      {pending ? 'Entrando...' : 'Entrar'}
      <LogIn className="ml-2 h-4 w-4" />
    </Button>
  );
}

export default function LoginPage() {
  const [state, dispatch] = useActionState(login, initialState);
  const { toast } = useToast();

  useEffect(() => {
    if (state?.message) {
      toast({
        variant: 'destructive',
        title: 'Erro de Acesso',
        description: state.message,
      });
    }
  }, [state, toast]);

  return (
    <main className="flex items-center justify-center min-h-screen bg-background p-4">
      <div className="w-full max-w-md">
        <div className="flex justify-center mb-6">
            <Link href="/" className="inline-block" aria-label="Voltar para a página inicial">
                <Logo/>
            </Link>
        </div>
        <Card className="shadow-lg">
          <CardHeader>
            <CardTitle className="text-2xl font-bold text-center">Painel Administrativo</CardTitle>
            <CardDescription className="text-center pt-2">
              Acesso restrito.
            </CardDescription>
          </CardHeader>
          <CardContent>
            <form action={dispatch} className="space-y-4">
              <div>
                <Label htmlFor="password">Senha</Label>
                <Input id="password" name="password" type="password" required />
                {state.errors?.password && <p className="text-sm font-medium text-destructive mt-1">{state.errors.password[0]}</p>}
              </div>
              <LoginButton />
            </form>
          </CardContent>
        </Card>
      </div>
    </main>
  );
}
