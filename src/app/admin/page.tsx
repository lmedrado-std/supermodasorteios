'use client';
import { useUser } from '@/firebase';
import { useEffect } from 'react';
import { AdminTable } from './components/AdminTable';
import { SettingsManager } from './components/SettingsManager';
import { Logo } from '@/components/Logo';
import Link from 'next/link';
import {
  doc,
  getDoc,
  Firestore,
} from 'firebase/firestore';
import {
  Auth,
  signOut,
} from 'firebase/auth';
import { useRouter } from 'next/navigation';
import { useFirebase } from '@/firebase';
import AdminMenu from './components/AdminMenu';
import { RaffleManager } from './components/RaffleManager';
import { WinnerHistory } from './components/WinnerHistory';

export default function AdminPage() {
  const { user, isUserLoading } = useUser();
  const { auth, firestore } = useFirebase();
  const router = useRouter();

  useEffect(() => {
    if (isUserLoading) return; // Aguarde o carregamento do usuário
    if (!user) {
      router.push('/admin/login');
    } else if (firestore) {
      const checkAdmin = async () => {
        try {
          const adminRoleRef = doc(firestore, 'roles_admin', user.uid);
          const adminDoc = await getDoc(adminRoleRef);
          if (!adminDoc.exists()) {
            // Se não é admin, desloga e redireciona
            if (auth) await signOut(auth);
            router.push('/admin/login');
          }
        } catch (error) {
          console.error("Error checking admin status:", error);
          if (auth) await signOut(auth);
          router.push('/admin/login');
        }
      };
      checkAdmin();
    }
  }, [user, isUserLoading, firestore, auth, router]);

  const handleLogout = async (auth: Auth) => {
    await signOut(auth);
    router.push('/admin/login');
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
    )
  }

  return (
    <div className="min-h-screen bg-background">
      <header className="bg-card shadow-sm">
        <div className="container mx-auto flex items-center justify-between p-4">
          <Link href="/">
            <Logo className="h-8 md:h-10 w-auto" />
          </Link>
          <h1 className="text-xl md:text-2xl font-bold text-foreground font-headline">
            Painel Administrativo
          </h1>
          <AdminMenu user={user} auth={auth} onLogout={() => handleLogout(auth)} />
        </div>
      </header>
      <main className="container mx-auto px-4 py-8 space-y-8">
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          <div className="lg:col-span-2 space-y-8">
             <SettingsManager />
             <RaffleManager />
             <WinnerHistory />
          </div>
          <div className="lg:col-span-1">
            {/* Você pode adicionar outros cards ou informações aqui no futuro */}
          </div>
        </div>
        <AdminTable />
      </main>
    </div>
  );
}
