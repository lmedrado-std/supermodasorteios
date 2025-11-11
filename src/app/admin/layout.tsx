'use client';
import { useUser, FirebaseClientProvider } from '@/firebase';
import { useEffect, useState } from 'react';
import Link from 'next/link';
import { doc, getDoc } from 'firebase/firestore';
import { signOut } from 'firebase/auth';
import { usePathname, useRouter } from 'next/navigation';
import { useFirebase } from '@/firebase';
import AdminMenu from './components/AdminMenu';
import { Logo } from '@/components/Logo';
import { Loader2 } from 'lucide-react';

function AdminLayoutContent({ children }: { children: React.ReactNode }) {
  const { user, isUserLoading } = useUser();
  const { auth, firestore } = useFirebase();
  const router = useRouter();
  const pathname = usePathname();
  const [isAdmin, setIsAdmin] = useState<boolean | null>(null);
  const isLoginPage = pathname === '/admin/login';

  useEffect(() => {
    // Se ainda estiver verificando o usuário, não faz nada.
    if (isUserLoading) {
      return;
    }

    // Se NÃO há usuário...
    if (!user) {
      // e não estamos na página de login, redireciona para lá.
      if (!isLoginPage) {
        router.push('/admin/login');
      }
      return;
    }

    // Se HÁ usuário e estamos na página de login, redireciona para o painel.
    if (user && isLoginPage) {
        router.push('/admin');
        return;
    }

    // Se HÁ usuário, não estamos na página de login e ainda não verificamos se é admin...
    if (user && !isLoginPage && isAdmin === null && firestore) {
      const checkAdmin = async () => {
        try {
          const adminRoleRef = doc(firestore, 'roles_admin', user.uid);
          const adminDoc = await getDoc(adminRoleRef);
          
          if (adminDoc.exists()) {
            setIsAdmin(true); // É admin, permite o acesso.
          } else {
            setIsAdmin(false); // Não é admin.
            if (auth) await signOut(auth); // Desloga...
            router.push('/admin/login'); // ...e redireciona para o login.
          }
        } catch (error) {
          console.error("Error checking admin status:", error);
          setIsAdmin(false);
          if (auth) await signOut(auth);
          router.push('/admin/login');
        }
      };

      checkAdmin();
    }
    
  }, [user, isUserLoading, firestore, auth, router, pathname, isAdmin, isLoginPage]);

  const handleLogout = async () => {
    if (auth) {
      setIsAdmin(null); // Reseta o estado de admin
      await signOut(auth);
      router.push('/admin/login');
    }
  };

  // Tela de carregamento principal enquanto verifica o usuário
  if (isUserLoading) {
    return (
      <div className="flex flex-col justify-center items-center h-screen gap-4">
        <Loader2 className="h-8 w-8 animate-spin" />
        <p>Verificando autenticação...</p>
      </div>
    );
  }

  // Se for a página de login e não houver usuário, exibe a página.
  if (isLoginPage && !user) {
    return <>{children}</>;
  }

  // Se for uma página protegida e o usuário for admin, exibe o layout.
  if (!isLoginPage && user && isAdmin) {
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
              <nav className="flex items-center gap-0 md:gap-2 text-sm text-muted-foreground">
                  <Link href="/" className="hover:text-primary hover:underline px-1 sm:px-2">
                    Início
                  </Link>
                  <Link href="/meus-cupons" className="hover:text-primary hover:underline px-1 sm:px-2">
                    Cupons
                  </Link>
                   <Link href="/regulamento" className="hover:text-primary hover:underline px-1 sm:px-2">
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

   // Se nenhuma das condições acima for atendida, mostra um loader genérico.
   return (
       <div className="flex flex-col justify-center items-center h-screen gap-4">
         <Loader2 className="h-8 w-8 animate-spin" />
         <p>Carregando...</p>
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
