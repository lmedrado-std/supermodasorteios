'use client';
import { useState, useEffect } from 'react';
import { useAuth, useUser } from '@/firebase';
import { signInWithEmailAndPassword } from 'firebase/auth';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import {
  Card,
  CardHeader,
  CardTitle,
  CardDescription,
  CardContent,
} from '@/components/ui/card';
import { LogIn, Loader2 } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { useRouter } from 'next/navigation';
import { Header } from '@/components/Header';
import { Footer } from '@/components/Footer';

export default function LoginPage() {
  const [password, setPassword] = useState('');
  const [isLoggingIn, setIsLoggingIn] = useState(false);
  const { toast } = useToast();
  const auth = useAuth();
  const { user, isUserLoading } = useUser();
  const router = useRouter();

  useEffect(() => {
    // Se o usuário já estiver logado (e o carregamento inicial terminou), redireciona para o painel
    if (!isUserLoading && user) {
      router.push('/admin');
    }
  }, [user, isUserLoading, router]);

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!auth) {
      toast({
        variant: 'destructive',
        title: 'Erro de Configuração',
        description: 'Serviços do Firebase não estão disponíveis.',
      });
      return;
    }
    
    setIsLoggingIn(true);

    try {
      const email = 'admin@supermoda.com';
      await signInWithEmailAndPassword(auth, email, password);
      // O useEffect cuidará do redirecionamento para /admin após a mudança de estado do usuário.
    } catch (error: any) {
      let description = 'Ocorreu um erro. Verifique suas credenciais e tente novamente.';
      if (error.code === 'auth/wrong-password' || error.code === 'auth/user-not-found' || error.code === 'auth/invalid-credential') {
        description = 'Senha incorreta.';
      } else if (error.code === 'auth/too-many-requests') {
        description = 'Muitas tentativas. Tente novamente mais tarde.';
      }
      toast({
        variant: 'destructive',
        title: 'Erro de Acesso',
        description: description,
      });
      setIsLoggingIn(false); // Só reseta o loading em caso de erro
    }
  };

  // Enquanto verifica o estado de autenticação ou se o usuário já está logado, mostra um loading.
  if (isUserLoading || user) {
    return (
      <div className="flex flex-col justify-center items-center h-screen gap-4">
        <Loader2 className="h-8 w-8 animate-spin" />
        <p>Carregando...</p>
      </div>
    );
  }

  return (
    <div className="flex flex-col min-h-screen bg-background">
      <Header />
      <main className="flex-grow flex items-center justify-center p-4">
        <div className="w-full max-w-md">
          <Card className="shadow-lg">
            <CardHeader>
              <CardTitle className="text-2xl font-bold text-center">
                Painel Administrativo
              </CardTitle>
              <CardDescription className="text-center pt-2">
                Acesso restrito para administradores.
              </CardDescription>
            </CardHeader>
            <CardContent>
              <form onSubmit={handleLogin} className="space-y-4">
                <div>
                  <Label htmlFor="password">Senha</Label>
                  <Input
                    id="password"
                    name="password"
                    type="password"
                    required
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    placeholder='Digite sua senha'
                    autoFocus
                  />
                </div>
                <Button type="submit" className="w-full" disabled={isLoggingIn}>
                  {isLoggingIn ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <LogIn className="mr-2 h-4 w-4" />}
                  {isLoggingIn ? 'Entrando...' : 'Entrar'}
                </Button>
              </form>
            </CardContent>
          </Card>
        </div>
      </main>
      <Footer />
    </div>
  );
}
