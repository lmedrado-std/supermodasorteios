'use client';
import { AdminTable } from './components/AdminTable';
import { SettingsManager } from './components/SettingsManager';
import { RaffleManager } from './components/RaffleManager';
import { WinnerHistory } from './components/WinnerHistory';
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Ticket, Settings, PartyPopper, History } from 'lucide-react';

export default function AdminPage() {
  return (
    <Tabs defaultValue="coupons" className="space-y-4">
      <TabsList className="grid w-full grid-cols-2 md:grid-cols-4 h-auto">
        <TabsTrigger value="coupons" className="py-2">
            <Ticket className="mr-2" />
            Cupons
        </TabsTrigger>
        <TabsTrigger value="raffle" className="py-2">
            <PartyPopper className="mr-2" />
            Sorteio
        </TabsTrigger>
        <TabsTrigger value="settings" className="py-2">
            <Settings className="mr-2" />
            Configurações
        </TabsTrigger>
        <TabsTrigger value="history" className="py-2">
            <History className="mr-2" />
            Histórico
        </TabsTrigger>
      </TabsList>
      
      <TabsContent value="coupons">
        <AdminTable />
      </TabsContent>
      
      <TabsContent value="raffle">
        <div className="max-w-2xl mx-auto">
            <RaffleManager />
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
  );
}
