'use client';
import { useUser, FirebaseClientProvider } from '@/firebase';
import { useEffect } from 'react';
import Link from 'next/link';
import { doc, getDoc } from 'firebase/firestore';
import { signOut } from 'firebase/auth';
import { useRouter } from 'next/navigation';
import { useFirebase } from '@/firebase';
import AdminMenu from './components/AdminMenu';
import { Logo } from '@/components/Logo';

function AdminLayoutContent({ children }: { children: React.ReactNode }) {
  const { user, isUserLoading } = useUser();
  const { auth, firestore } = useFirebase();
  const router = useRouter();

  useEffect(() => {
    // Aguarda o fim do carregamento do usuário
    if (isUserLoading) return; 

    // Se não houver usuário, redireciona para o login
    if (!user) {
      router.push('/admin/login');
      return;
    }

    // Se o usuário estiver logado e os serviços do Firebase estiverem prontos,
    // verifica se ele tem a permissão de administrador.
    if (user && firestore && auth) {
      const checkAdmin = async () => {
        try {
          const adminRoleRef = doc(firestore, 'roles_admin', user.uid);
          const adminDoc = await getDoc(adminRoleRef);
          
          // Se o documento de admin não existir, o usuário não tem permissão.
          if (!adminDoc.exists()) {
            await signOut(auth); // Desloga o usuário por segurança
            router.push('/admin/login'); // Redireciona para o login
          }
        } catch (error) {
          console.error("Error checking admin status:", error);
          await signOut(auth);
          router.push('/admin/login');
        }
      };
      
      checkAdmin();
    }
  }, [user, isUserLoading, firestore, auth, router]);

  const handleLogout = async () => {
    if (auth) {
      await signOut(auth);
      router.push('/admin/login');
    }
  };

  if (isUserLoading || !user) {
    return (
      <div className="flex justify-center items-center h-screen">
        Carregando...
      </div>
    );
  }

  if (!auth || !firestore) {
    return (
      <div className="flex justify-center items-center h-screen">
        Conectando aos serviços...
      </div>
    );
  }

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
          <AdminMenu user={user} auth={auth} onLogout={handleLogout} />
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
