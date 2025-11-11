'use client';
import { useState, useEffect } from 'react';
import { useAuth, useUser } from '@/firebase';
import {
  signInWithEmailAndPassword,
  onAuthStateChanged,
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
import { LogIn } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import Link from 'next/link';
import { Logo } from '@/components/Logo';
import { useRouter } from 'next/navigation';

export default function LoginPage() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const { toast } = useToast();
  const auth = useAuth();
  const { user, isUserLoading } = useUser();
  const router = useRouter();

  useEffect(() => {
    if (!isUserLoading && user) {
      router.push('/admin');
    }
  }, [user, isUserLoading, router]);

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);

    // Use a fixed email and allow any password for admin login as per original logic.
    // In a real app, you would validate both.
    const adminEmail = 'admin@supermoda.com';

    try {
      await signInWithEmailAndPassword(auth, adminEmail, password);
      // Let the useEffect handle the redirect
    } catch (error: any) {
      // If the admin user doesn't exist, create it.
      if (error.code === 'auth/user-not-found') {
        try {
          await signInWithEmailAndPassword(auth, adminEmail, password);
        } catch (creationError: any) {
            toast({
                variant: 'destructive',
                title: 'Erro de Acesso',
                description: 'Senha incorreta ou usuário não encontrado.',
            });
        }
      } else {
         toast({
            variant: 'destructive',
            title: 'Erro de Acesso',
            description: 'Senha incorreta.',
          });
      }
    } finally {
      setIsLoading(false);
    }
  };
  
    if (isUserLoading || user) {
        return <div className="flex justify-center items-center h-screen">Carregando...</div>;
    }


  return (
    <main className="flex items-center justify-center min-h-screen bg-background p-4">
      <div className="w-full max-w-md">
        <div className="flex justify-center mb-6">
          <Link href="/" className="inline-block" aria-label="Voltar para a página inicial">
            <Logo />
          </Link>
        </div>
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
  );
}
