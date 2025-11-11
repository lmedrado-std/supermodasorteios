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

  useEffect(() => {
    if (isUserLoading) {
      return; // Aguarda a verificação inicial do usuário
    }

    if (!user) {
      // Se não há usuário e já estamos na página de login, não faz nada.
      // Se estiver em outra página admin, redireciona para o login.
      if (pathname !== '/admin/login') {
        router.push('/admin/login');
      }
      // Garante que o estado de admin está limpo para não logados
      if (isAdmin !== false) setIsAdmin(false); 
      return;
    }

    // Se o usuário está logado, mas o status de admin ainda não foi verificado
    if (isAdmin === null && firestore) {
      const checkAdmin = async () => {
        try {
          const adminRoleRef = doc(firestore, 'roles_admin', user.uid);
          const adminDoc = await getDoc(adminRoleRef);
          
          if (adminDoc.exists()) {
            setIsAdmin(true);
            // Se for admin e estiver na página de login, redireciona para o painel principal
            if (pathname === '/admin/login') {
                router.push('/admin');
            }
          } else {
            setIsAdmin(false);
            if (auth) await signOut(auth); // Desloga por segurança
            router.push('/admin/login'); // Redireciona para o login
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
    
  }, [user, isUserLoading, firestore, auth, router, pathname, isAdmin]);

  const handleLogout = async () => {
    if (auth) {
      await signOut(auth);
      router.push('/admin/login');
    }
  };

  // Tela de carregamento enquanto o estado do usuário está sendo determinado
  if (isUserLoading || (user && isAdmin === null)) {
    return (
      <div className="flex flex-col justify-center items-center h-screen gap-4">
        <Loader2 className="h-8 w-8 animate-spin" />
        <p>{user ? 'Verificando permissões...' : 'Verificando autenticação...'}</p>
      </div>
    );
  }

  // Se o usuário não está logado e está na página de login, mostra a página de login.
  if (!user && pathname === '/admin/login') {
    return <>{children}</>;
  }
  
  // Se o usuário está logado e é admin, mostra o layout do admin.
  if (user && isAdmin) {
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

  // Fallback para qualquer outro caso (ex: usuário não-admin tentando acessar uma página)
  // O useEffect já deve ter redirecionado, mas isso serve como uma segurança.
   return (
       <div className="flex flex-col justify-center items-center h-screen gap-4">
         <Loader2 className="h-8 w-8 animate-spin" />
         <p>Redirecionando...</p>
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
