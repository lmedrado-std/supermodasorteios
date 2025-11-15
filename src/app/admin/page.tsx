'use client';
import { AdminTable } from './components/AdminTable';
import { SettingsManager } from './components/SettingsManager';
import { RaffleDraw } from './components/RaffleDraw';
import { WinnerHistory } from './components/WinnerHistory';
import { ScratchCouponManager } from './components/ScratchCouponManager';
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Ticket, Settings, PartyPopper, History, LogOut, Sparkles } from 'lucide-react';
import { useAuth } from '@/firebase';
import { signOut } from 'firebase/auth';
import { Button } from '@/components/ui/button';
import { useToast } from '@/hooks/use-toast';

export default function AdminPage() {
  const auth = useAuth();
  const { toast } = useToast();

  const handleLogout = async () => {
    if (!auth) return;
    try {
      await signOut(auth);
      toast({ title: 'Você saiu com sucesso.' });
      // O redirecionamento será tratado pelo AdminLayout que detectará a ausência de usuário.
    } catch (error) {
      toast({ variant: 'destructive', title: 'Erro ao sair', description: 'Não foi possível fazer logout.' });
    }
  };

  return (
    <div className="space-y-4">
      <div className="flex justify-end">
        <Button onClick={handleLogout} variant="outline">
          <LogOut className="mr-2 h-4 w-4" />
          Sair
        </Button>
      </div>
      <Tabs defaultValue="coupons" className="space-y-4">
        <TabsList className="grid w-full grid-cols-2 md:grid-cols-5 h-auto">
          <TabsTrigger value="coupons" className="py-2 text-xs sm:text-sm">
              <Ticket className="mr-1 sm:mr-2 h-4 w-4" />
              Cupons Sorteio
          </TabsTrigger>
           <TabsTrigger value="scratch" className="py-2 text-xs sm:text-sm">
              <Sparkles className="mr-1 sm:mr-2 h-4 w-4" />
              Raspadinhas
          </TabsTrigger>
          <TabsTrigger value="raffle" className="py-2 text-xs sm:text-sm">
              <PartyPopper className="mr-1 sm:mr-2 h-4 w-4" />
              Sorteio
          </TabsTrigger>
          <TabsTrigger value="settings" className="py-2 text-xs sm:text-sm">
              <Settings className="mr-1 sm:mr-2 h-4 w-4" />
              Configurações
          </TabsTrigger>
          <TabsTrigger value="history" className="py-2 text-xs sm:text-sm">
              <History className="mr-1 sm:mr-2 h-4 w-4" />
              Histórico
          </TabsTrigger>
        </TabsList>
        
        <TabsContent value="coupons">
          <AdminTable />
        </TabsContent>
        
        <TabsContent value="scratch">
          <ScratchCouponManager />
        </TabsContent>

        <TabsContent value="raffle">
          <div className="max-w-2xl mx-auto">
              <RaffleDraw />
          </div>
        </TabsContent>

        <TabsContent value="settings">
          <div className="max-w-2xl mx-auto">
              <SettingsManager />
          </div>
        </TabsContent>
        
        <TabsContent value="history">
          <WinnerHistory />
        </TabsContent>
      </Tabs>
    </div>
  );
}
