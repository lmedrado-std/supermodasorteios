'use client';
import { useState, useEffect } from 'react';
import { useAuth, useUser } from '@/firebase';
import { 
  signInWithEmailAndPassword, 
  createUserWithEmailAndPassword 
} from 'firebase/auth';
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
import { LogIn, Loader2, Eye, EyeOff } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { useRouter } from 'next/navigation';
import { Header } from '@/components/Header';
import { Footer } from '@/components/Footer';

export default function LoginPage() {
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
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
    const email = 'admin@supermoda.com';

    try {
      // Tenta fazer o login primeiro
      await signInWithEmailAndPassword(auth, email, password);
      // O useEffect cuidará do redirecionamento após a mudança de estado do usuário.

    } catch (error: any) {
        // Se o usuário não existe E a senha digitada for 'supermoda', cria o usuário.
        if (error.code === 'auth/user-not-found' && password === 'supermoda') {
            try {
                await createUserWithEmailAndPassword(auth, email, 'supermoda');
                // O login é automático após a criação, e o useEffect fará o redirecionamento.
            } catch (creationError: any) {
                toast({
                    variant: 'destructive',
                    title: 'Erro ao Criar Admin',
                    description: `Não foi possível criar o usuário administrador: ${creationError.message}`,
                });
                setIsLoggingIn(false);
            }
        } else {
            // Lida com outros erros de login (senha errada, etc.)
            let description = 'Ocorreu um erro. Verifique suas credenciais e tente novamente.';
            if (error.code === 'auth/wrong-password' || error.code === 'auth/invalid-credential') {
                description = 'Senha incorreta.';
            } else if (error.code === 'auth/too-many-requests') {
                description = 'Muitas tentativas de login falharam. Tente novamente mais tarde.';
            }
            toast({
                variant: 'destructive',
                title: 'Erro de Acesso',
                description: description,
            });
            setIsLoggingIn(false); // Só reseta o loading em caso de erro
        }
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
                  <div className="relative">
                    <Input
                        id="password"
                        name="password"
                        type={showPassword ? "text" : "password"}
                        required
                        value={password}
                        onChange={(e) => setPassword(e.target.value)}
                        placeholder='Digite sua senha'
                        autoFocus
                    />
                    <Button
                        type="button"
                        variant="ghost"
                        size="icon"
                        className="absolute inset-y-0 right-0 h-full px-3"
                        onClick={() => setShowPassword(!showPassword)}
                    >
                        {showPassword ? <EyeOff /> : <Eye />}
                         <span className="sr-only">{showPassword ? 'Ocultar' : 'Mostrar'} senha</span>
                    </Button>
                  </div>
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
