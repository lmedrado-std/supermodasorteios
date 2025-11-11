import { cookies } from 'next/headers';
import { redirect } from 'next/navigation';
import { getAllCoupons, logout } from '@/app/actions';
import { AdminTable } from './components/AdminTable';
import { Button } from '@/components/ui/button';
import { LogOut } from 'lucide-react';
import { Logo } from '@/components/Logo';
import Link from 'next/link';

export default async function AdminPage() {
  const authCookie = cookies().get('supermoda_auth');
  if (!authCookie || authCookie.value !== 'true') {
    redirect('/admin/login');
  }

  const coupons = await getAllCoupons();

  return (
    <div className="min-h-screen bg-background">
      <header className="bg-card shadow-sm">
        <div className="container mx-auto flex items-center justify-between p-4">
          <Link href="/">
            <Logo className="h-8 md:h-10 w-auto" />
          </Link>
          <h1 className="text-xl md:text-2xl font-bold text-foreground font-headline">Cupons Gerados</h1>
          <form action={logout}>
            <Button type="submit" variant="outline">
              <span className="hidden sm:inline">Sair</span>
              <LogOut className="h-4 w-4 sm:ml-2" />
            </Button>
          </form>
        </div>
      </header>
      <main className="container mx-auto px-4 py-8">
        <AdminTable coupons={coupons} />
      </main>
    </div>
  );
}
