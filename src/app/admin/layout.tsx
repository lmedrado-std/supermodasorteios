'use client';
import { useUser, FirebaseClientProvider } from '@/firebase';
import { useEffect, useState } from 'react';
import Link from 'next/link';
import { doc, getDoc } from 'firebase/firestore';
import { signOut } from 'firebase/auth';
import { useRouter } from 'next/navigation';
import { useFirebase } from '@/firebase';
import AdminMenu from './components/AdminMenu';
import { Logo } from '@/components/Logo';
import { Loader2 } from 'lucide-react';

function AdminLayoutContent({ children }: { children: React.ReactNode }) {
  const { user, isUserLoading } = useUser();
  const { auth, firestore } = useFirebase();
  const router = useRouter();
  const [isAdmin, setIsAdmin] = useState<boolean | null>(null);
  const [isCheckingAdmin, setIsCheckingAdmin] = useState(true);

  useEffect(() => {
    // 1. Aguarda o fim do carregamento do usuário
    if (isUserLoading) {
      return;
    }

    // 2. Se não houver usuário, redireciona para o login
    if (!user) {
      router.push('/admin/login');
      return;
    }

    // 3. Se houver um usuário, verifica se ele é admin
    const checkAdmin = async () => {
      if (!firestore || !auth) return;

      try {
        const adminRoleRef = doc(firestore, 'roles_admin', user.uid);
        const adminDoc = await getDoc(adminRoleRef);

        if (adminDoc.exists()) {
          setIsAdmin(true);
        } else {
          setIsAdmin(false);
          await signOut(auth); // Desloga por segurança
          router.push('/admin/login'); // Redireciona
        }
      } catch (error) {
        console.error("Error checking admin status:", error);
        setIsAdmin(false);
        await signOut(auth);
        router.push('/admin/login');
      } finally {
        setIsCheckingAdmin(false);
      }
    };

    checkAdmin();

  }, [user, isUserLoading, firestore, auth, router]);

  const handleLogout = async () => {
    if (auth) {
      await signOut(auth);
      router.push('/admin/login');
    }
  };

  // Estado de carregamento principal enquanto verifica auth e permissões
  if (isUserLoading || isCheckingAdmin || isAdmin === null) {
    let message = "Verificando autenticação...";
    if (!isUserLoading && isCheckingAdmin) {
      message = "Verificando permissões...";
    }
    return (
      <div className="flex flex-col justify-center items-center h-screen gap-4">
        <Loader2 className="h-8 w-8 animate-spin" />
        <p>{message}</p>
      </div>
    );
  }

  // Se a verificação terminou e o usuário não é admin (embora o useEffect já deva ter redirecionado)
  if (!isAdmin) {
    return (
       <div className="flex flex-col justify-center items-center h-screen gap-4">
         <p>Acesso negado. Redirecionando para o login...</p>
      </div>
    );
  }

  // Se tudo estiver OK, exibe o layout do admin
  return (
    <div className="min-h-screen bg-muted/40">
      <header className="bg-background shadow-sm sticky top-0 z-50">
        <div className="container mx-auto flex items-center justify-between p-4">
          <div className="flex items-center gap-4">
            <Link href="/">
              <Logo className="h-8 md:h-10 w-auto" />
            </Link>
            <h1 className="text-xl md:text-2xl font-bold text-foreground font-headline hidden md:block">
              Painel Administrativo
            </h1>
          </div>
          <nav className="flex items-center gap-2 md:gap-4 text-sm text-muted-foreground">
              <Link href="/" className="hover:text-primary hover:underline px-2">
                Início
              </Link>
              <Link href="/meus-cupons" className="hover:text-primary hover:underline px-2">
                Cupons
              </Link>
               <Link href="/regulamento" className="hover:text-primary hover:underline px-2">
                Regulamento
              </Link>
          </nav>
          {user && auth && <AdminMenu user={user} auth={auth} onLogout={handleLogout} />}
        </div>
      </header>
      <main className="container mx-auto px-4 py-8">
        <h1 className="text-xl md:text-2xl font-bold text-foreground font-headline mb-4 md:hidden">
            Painel Administrativo
        </h1>
        {children}
      </main>
    </div>
  );
}


export default function AdminLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <FirebaseClientProvider>
      <AdminLayoutContent>{children}</AdminLayoutContent>
    </FirebaseClientProvider>
  );
}
