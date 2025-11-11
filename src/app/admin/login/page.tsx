'use client';
import { useState, useEffect } from 'react';
import { useAuth, useUser } from '@/firebase';
import {
  signInWithEmailAndPassword,
  createUserWithEmailAndPassword,
} from 'firebase/auth';
import { doc, setDoc } from 'firebase/firestore';
import { useFirestore } from '@/firebase';
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
  const firestore = useFirestore();
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
    if (!auth || !firestore) {
      toast({
        variant: 'destructive',
        title: 'Erro de Configuração',
        description: 'Serviços do Firebase não estão disponíveis.',
      });
      return;
    }

    setIsLoggingIn(true);
    const email = 'pix@nasupermoda.com';

    try {
      await signInWithEmailAndPassword(auth, email, password);
      // O sucesso do login acionará o useEffect no layout para redirecionar e verificar o admin.
    } catch (error: any) {
      const isUserNotFound = error.code === 'auth/user-not-found';
      const isMasterPassword = password === 'supermoda';
      const isWrongPassword = error.code === 'auth/wrong-password' || error.code === 'auth/invalid-credential';
      
      // Cenário 1: Usuário não existe e a senha é a mestra.
      // Ação: Criar o usuário e seu documento de permissão.
      if (isUserNotFound && isMasterPassword) {
        try {
          const userCredential = await createUserWithEmailAndPassword(auth, email, password);
          const newUser = userCredential.user;
          // Corrigido: Usar o UID do novo usuário para criar o documento de permissão.
          const adminRoleRef = doc(firestore, 'roles_admin', newUser.uid);
          await setDoc(adminRoleRef, { role: 'admin' });
          
          toast({
            title: 'Administrador Criado!',
            description: 'Login efetuado com sucesso. Lembre-se de alterar sua senha.',
          });
           // O login é automático após a criação, o useEffect no layout fará o redirecionamento.
        } catch (creationError: any) {
          toast({
            variant: 'destructive',
            title: 'Erro ao Criar Admin',
            description: `Não foi possível criar o usuário administrador: ${creationError.message}`,
          });
        }
      } else {
         // Cenário 2: Senha incorreta ou qualquer outro erro.
        let description = 'Ocorreu um erro. Verifique suas credenciais e tente novamente.';
        if (isWrongPassword) {
          description = 'Senha incorreta. Siga as instruções em "Problemas para acessar?" se necessário.';
        } else if (error.code === 'auth/too-many-requests') {
          description = 'Muitas tentativas de login falharam. Tente novamente mais tarde.';
        }
        
        toast({
          variant: 'destructive',
          title: 'Erro de Acesso',
          description: description,
        });
      }
    } finally {
        setIsLoggingIn(false);
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
                      type={showPassword ? 'text' : 'password'}
                      required
                      value={password}
                      onChange={(e) => setPassword(e.target.value)}
                      placeholder="Digite sua senha"
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
                      <span className="sr-only">
                        {showPassword ? 'Ocultar' : 'Mostrar'} senha
                      </span>
                    </Button>
                  </div>
                </div>
                <Button type="submit" className="w-full" disabled={isLoggingIn}>
                  {isLoggingIn ? (
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  ) : (
                    <LogIn className="mr-2 h-4 w-4" />
                  )}
                  {isLoggingIn ? 'Entrando...' : 'Entrar'}
                </Button>
              </form>
               <div className="mt-6 text-center text-sm text-muted-foreground p-4 bg-yellow-50 border border-yellow-200 rounded-lg">
                  <p className="font-bold text-yellow-800">Problemas para acessar?</p> 
                  <p className="mt-2">Se a senha 'supermoda' não funcionar, significa que o usuário administrador já existe com outra senha. Para resetar, você deve:</p>
                  <ol className="text-left list-decimal list-inside mt-2 space-y-1">
                      <li>Ir ao <a href="https://console.firebase.google.com/" target="_blank" rel="noopener noreferrer" className="underline text-primary">Console do Firebase</a>.</li>
                      <li>Navegar para <strong>Authentication</strong>.</li>
                      <li>Deletar o usuário <strong>pix@nasupermoda.com</strong>.</li>
                      <li>Voltar aqui e tentar logar com a senha 'supermoda' novamente.</li>
                  </ol>
              </div>
            </CardContent>
          </Card>
        </div>
      </main>
      <Footer />
    </div>
  );
}
