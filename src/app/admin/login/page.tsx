'use client';
import { useState, useEffect } from 'react';
import { useAuth, useFirebase, useUser } from '@/firebase';
import {
  signInWithEmailAndPassword,
  createUserWithEmailAndPassword,
} from 'firebase/auth';
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

  useEffect(() => {
    if (!isUserLoading && user) {
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
    const adminEmail = 'admin@supermoda.com';

    try {
      // 1. Tenta fazer o login
      await signInWithEmailAndPassword(auth, adminEmail, password);
      // O useEffect cuidará do redirecionamento
    } catch (error: any) {
      if (error.code === 'auth/user-not-found') {
        // 2. Se o usuário não existe, cria o usuário e a role de admin
        try {
           if (password.length < 6) {
             toast({
                variant: 'destructive',
                title: 'Senha muito curta',
                description: 'A senha para o novo admin deve ter no mínimo 6 caracteres.',
            });
            return;
          }

          const userCredential = await createUserWithEmailAndPassword(
            auth,
            adminEmail,
            password
          );
          const newAdminUser = userCredential.user;

          // Cria o documento de role para dar permissão de admin
          const adminRoleRef = doc(firestore, 'roles_admin', newAdminUser.uid);
          await setDoc(adminRoleRef, {
            id: newAdminUser.uid,
            username: 'admin',
          });

          toast({
            title: 'Administrador Criado',
            description: 'Sua conta de administrador foi criada com sucesso.',
          });
          // O login é feito automaticamente após a criação, o useEffect redirecionará
        } catch (creationError: any) {
           let creationErrorMessage = 'Não foi possível criar o usuário administrador.';
           if (creationError.code === 'auth/weak-password') {
             creationErrorMessage = 'A senha é muito fraca. Use pelo menos 6 caracteres.';
           } else if (creationError.code === 'auth/email-already-in-use') {
              creationErrorMessage = 'Este e-mail já está em uso por outro processo.';
           }
           toast({
            variant: 'destructive',
            title: 'Erro ao Criar Admin',
            description: creationErrorMessage,
          });
        }
      } else {
        // 3. Se for outro erro (senha errada, etc.)
        let errorMessage = 'Ocorreu um erro desconhecido. Verifique sua conexão.';
        if (error.code === 'auth/wrong-password' || error.code === 'auth/invalid-credential') {
            errorMessage = 'A senha está incorreta.';
        } else if (error.code === 'auth/too-many-requests') {
            errorMessage = 'Muitas tentativas de login. Tente novamente mais tarde.';
        } else if (error.code === 'auth/network-request-failed') {
            errorMessage = 'Erro de rede. Verifique sua conexão com a internet.';
        }
        toast({
          variant: 'destructive',
          title: 'Erro de Acesso',
          description: errorMessage,
        });
      }
    } finally {
      setIsLoading(false);
    }
  };

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
                Acesso restrito.
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
