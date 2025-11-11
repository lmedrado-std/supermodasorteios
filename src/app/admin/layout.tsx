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
import { Loader2, ShieldAlert } from 'lucide-react';

type AuthStatus = 'loading' | 'admin' | 'guest' | 'unauthorized';

function AdminLayoutContent({ children }: { children: React.ReactNode }) {
  const { user, isUserLoading } = useUser();
  const { auth, firestore } = useFirebase();
  const router = useRouter();
  const pathname = usePathname();
  const [authStatus, setAuthStatus] = useState<AuthStatus>('loading');
  
  const isLoginPage = pathname === '/admin/login';

  useEffect(() => {
    // Controller to prevent state updates on unmounted component
    const abortController = new AbortController();

    if (isUserLoading) {
      setAuthStatus('loading');
      return;
    }

    if (!user) {
      setAuthStatus('guest');
      if (!isLoginPage) {
        router.push('/admin/login');
      }
      return;
    }

    // User is logged in, now check for admin role
    const checkAdmin = async () => {
      if (!firestore) return; // Wait for firestore to be available
      
      try {
        const adminRoleRef = doc(firestore, 'roles_admin', user.uid);
        const adminDoc = await getDoc(adminRoleRef);

        if (abortController.signal.aborted) return;

        if (adminDoc.exists() && adminDoc.data()?.role === 'admin') {
          setAuthStatus('admin');
          if (isLoginPage) {
            router.push('/admin');
          }
        } else {
          setAuthStatus('unauthorized');
          // Don't log out immediately, show an unauthorized message first
        }
      } catch (error) {
        console.error("Error checking admin status:", error);
        if (abortController.signal.aborted) return;
        setAuthStatus('unauthorized'); // Treat errors as unauthorized
      }
    };

    checkAdmin();

    return () => {
      abortController.abort(); // Cleanup on unmount
    };

  }, [user, isUserLoading, firestore, isLoginPage, router]);

  const handleLogout = async () => {
    if (auth) {
      await signOut(auth);
      setAuthStatus('guest'); // Manually set status after logout
      router.push('/admin/login');
    }
  };
  
  // 1. Central Loading State
  if (authStatus === 'loading') {
    return (
      <div className="flex flex-col justify-center items-center h-screen gap-4" aria-live="polite">
        <Loader2 className="h-8 w-8 animate-spin" />
        <p>Verificando permissões...</p>
      </div>
    );
  }

  // 2. Guest user trying to access login page
  if (authStatus === 'guest' && isLoginPage) {
    return <>{children}</>;
  }
  
  // 3. Unauthorized user (logged in but not admin)
  if (authStatus === 'unauthorized') {
     return (
       <div className="flex flex-col justify-center items-center h-screen gap-4 text-center p-4">
         <ShieldAlert className="h-12 w-12 text-destructive" />
         <h1 className="text-2xl font-bold">Acesso Negado</h1>
         <p className="text-muted-foreground max-w-md">
           Você não tem permissão para acessar esta área. Se você acredita que isso é um erro, contate o administrador do sistema.
         </p>
         <button onClick={handleLogout} className="mt-4 text-primary underline">
            Fazer login com outra conta
         </button>
      </div>
    );
  }

  // 4. Authorized Admin
  if (authStatus === 'admin' && !isLoginPage) {
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

   // Fallback state, usually shows loader while transitioning
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
