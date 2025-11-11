'use client';
import { useAuth, useFirebase, useUser } from '@/firebase';
import {
  signInWithEmailAndPassword,
  signOut,
  createUserWithEmailAndPassword,
} from 'firebase/auth';
import { useEffect } from 'react';
import { AdminTable } from './components/AdminTable';
import { Button } from '@/components/ui/button';
import { LogOut } from 'lucide-react';
import { Logo } from '@/components/Logo';
import Link from 'next/link';
import { doc, getDoc } from 'firebase/firestore';
import { useRouter } from 'next/navigation';

export default function AdminPage() {
  const { user, isUserLoading } = useUser();
  const { auth, firestore } = useFirebase();
  const router = useRouter();

  useEffect(() => {
    if (!isUserLoading && !user) {
      router.push('/admin/login');
    } else if (user && firestore) {
      const checkAdmin = async () => {
        const adminRoleRef = doc(firestore, 'roles_admin', user.uid);
        const adminDoc = await getDoc(adminRoleRef);
        if (!adminDoc.exists()) {
          router.push('/admin/login');
        }
      };
      checkAdmin();
    }
  }, [user, isUserLoading, firestore, router]);

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

  return (
    <div className="min-h-screen bg-background">
      <header className="bg-card shadow-sm">
        <div className="container mx-auto flex items-center justify-between p-4">
          <Link href="/">
            <Logo className="h-8 md:h-10 w-auto" />
          </Link>
          <h1 className="text-xl md:text-2xl font-bold text-foreground font-headline">
            Cupons Gerados
          </h1>
          <form
            onSubmit={(e) => {
              e.preventDefault();
              handleLogout();
            }}
          >
            <Button type="submit" variant="outline">
              <span className="hidden sm:inline">Sair</span>
              <LogOut className="h-4 w-4 sm:ml-2" />
            </Button>
          </form>
        </div>
      </header>
      <main className="container mx-auto px-4 py-8">
        <AdminTable />
      </main>
    </div>
  );
}
