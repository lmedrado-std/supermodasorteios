'use client';
import { useState, useEffect } from 'react';
import { useAuth, useFirebase, useUser } from '@/firebase';
import { signInAnonymously } from 'firebase/auth';
import { doc, setDoc } from 'firebase/firestore';
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
import { LogIn } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { useRouter } from 'next/navigation';
import { Header } from '@/components/Header';
import { Footer } from '@/components/Footer';

export default function LoginPage() {
  const [password, setPassword] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const { toast } = useToast();
  const { auth, firestore } = useFirebase();
  const { user, isUserLoading } = useUser();
  const router = useRouter();
  
  // A senha estática para o painel administrativo.
  // No futuro, isso pode ser movido para uma variável de ambiente.
  const ADMIN_SECRET = 'supermoda';

  useEffect(() => {
    if (!isUserLoading && user) {
      // Se o usuário já está logado (anonimamente ou não), redireciona para o painel.
      router.push('/admin');
    }
  }, [user, isUserLoading, router]);

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!auth || !firestore) {
      toast({
        variant: 'destructive',
        title: 'Erro de Configuração',
        description: 'Serviços do Firebase não estão disponíveis.',
      });
      return;
    }
    
    setIsLoading(true);

    // 1. Verifica se a senha digitada corresponde à senha secreta.
    if (password !== ADMIN_SECRET) {
      toast({
        variant: 'destructive',
        title: 'Erro de Acesso',
        description: 'A senha está incorreta.',
      });
      setIsLoading(false);
      return;
    }

    try {
      // 2. Faz o login como um usuário anônimo.
      const userCredential = await signInAnonymously(auth);
      const anonymousUser = userCredential.user;

      // 3. Concede a role de administrador para este usuário anônimo.
      // O documento será criado se não existir, garantindo a permissão.
      const adminRoleRef = doc(firestore, 'roles_admin', anonymousUser.uid);
      await setDoc(adminRoleRef, {
        id: anonymousUser.uid,
        username: 'supermoda_admin_anon',
      });
      
      // O useEffect cuidará do redirecionamento para /admin.

    } catch (error: any) {
      console.error("Erro no login anônimo:", error);
      toast({
        variant: 'destructive',
        title: 'Erro de Autenticação',
        description: 'Não foi possível fazer o login anônimo. Verifique o console para mais detalhes.',
      });
    } finally {
      setIsLoading(false);
    }
  };

  // Enquanto verifica o estado de autenticação ou se o usuário já está logado, mostra um loading.
  if (isUserLoading || user) {
    return (
      <div className="flex justify-center items-center h-screen">
        Carregando...
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
                Acesso restrito via senha de segurança.
              </CardDescription>
            </CardHeader>
            <CardContent>
              <form onSubmit={handleLogin} className="space-y-4">
                <div>
                  <Label htmlFor="password">Senha de Acesso</Label>
                  <Input
                    id="password"
                    name="password"
                    type="password"
                    required
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    placeholder='Digite a senha de segurança'
                  />
                </div>
                <Button type="submit" className="w-full" disabled={isLoading}>
                  {isLoading ? 'Entrando...' : 'Entrar'}
                  <LogIn className="ml-2 h-4 w-4" />
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
