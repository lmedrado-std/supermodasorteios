'use client';
import { useState, useEffect } from 'react';
import { useFirestore, useDoc, useMemoFirebase } from '@/firebase';
import { doc, setDoc, Timestamp } from 'firebase/firestore';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import {
  Card,
  CardHeader,
  CardTitle,
  CardDescription,
  CardContent,
  CardFooter,
} from '@/components/ui/card';
import { useToast } from '@/hooks/use-toast';
import { Loader2 } from 'lucide-react';
import { Calendar } from '@/components/ui/calendar';
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from '@/components/ui/popover';
import { Calendar as CalendarIcon } from 'lucide-react';
import { format } from 'date-fns';
import { ptBR } from 'date-fns/locale';

const SETTINGS_DOC_PATH = 'settings/raffle';

type RaffleSettings = {
  valuePerCoupon: number;
  campaignStartDate?: Timestamp;
  campaignEndDate?: Timestamp;
};

export function SettingsManager() {
  const firestore = useFirestore();
  const settingsDocRef = useMemoFirebase(
    () => (firestore ? doc(firestore, SETTINGS_DOC_PATH) : null),
    [firestore]
  );

  const { data: settings, isLoading: isLoadingSettings } =
    useDoc<RaffleSettings>(settingsDocRef);

  const [valuePerCoupon, setValuePerCoupon] = useState<string>('');
  const [startDate, setStartDate] = useState<Date>();
  const [endDate, setEndDate] = useState<Date>();
  const [isSaving, setIsSaving] = useState(false);
  const { toast } = useToast();

  useEffect(() => {
    if (settings) {
      if (typeof settings.valuePerCoupon === 'number') {
        setValuePerCoupon(String(settings.valuePerCoupon).replace('.', ','));
      }
      if (settings.campaignStartDate) {
        setStartDate(settings.campaignStartDate.toDate());
      }
      if (settings.campaignEndDate) {
        setEndDate(settings.campaignEndDate.toDate());
      }
    }
  }, [settings]);

  const handleSave = async () => {
    if (!settingsDocRef) return;

    const numericValue = parseFloat(valuePerCoupon.replace(',', '.'));

    if (isNaN(numericValue) || numericValue <= 0) {
      toast({
        variant: 'destructive',
        title: 'Valor Inválido',
        description: 'O valor por cupom deve ser um número maior que zero.',
      });
      return;
    }
    
    if (startDate && endDate && startDate > endDate) {
       toast({
        variant: 'destructive',
        title: 'Datas Inválidas',
        description: 'A data de início não pode ser posterior à data de fim.',
      });
      return;
    }

    setIsSaving(true);
    try {
      const dataToSave: any = { 
          valuePerCoupon: numericValue,
          campaignStartDate: startDate ? Timestamp.fromDate(startDate) : null,
          campaignEndDate: endDate ? Timestamp.fromDate(endDate) : null,
      };

      await setDoc(settingsDocRef, dataToSave, { merge: true });

      toast({
        title: 'Sucesso!',
        description: 'Configurações salvas.',
      });
    } catch (error) {
      console.error('Error saving settings:', error);
      toast({
        variant: 'destructive',
        title: 'Erro ao Salvar',
        description:
          'Não foi possível salvar as configurações. Tente novamente.',
      });
    } finally {
      setIsSaving(false);
    }
  };

  const DatePicker = ({
    date,
    setDate,
    label,
  }: {
    date: Date | undefined;
    setDate: (date: Date | undefined) => void;
    label: string;
  }) => (
    <div className="space-y-2">
      <Label>{label}</Label>
      <Popover>
        <PopoverTrigger asChild>
          <Button
            variant={'outline'}
            className="w-full justify-start text-left font-normal"
          >
            <CalendarIcon className="mr-2 h-4 w-4" />
            {date ? format(date, 'PPP', { locale: ptBR }) : <span>Escolha uma data</span>}
          </Button>
        </PopoverTrigger>
        <PopoverContent className="w-auto p-0">
          <Calendar
            mode="single"
            selected={date}
            onSelect={setDate}
            initialFocus
          />
        </PopoverContent>
      </Popover>
    </div>
  );

  return (
    <Card>
      <CardHeader>
        <CardTitle>Configurações da Campanha</CardTitle>
        <CardDescription>
          Defina as regras para a geração de cupons e o período da campanha.
        </CardDescription>
      </CardHeader>
      <CardContent>
        {isLoadingSettings ? (
          <div className="flex items-center space-x-2">
            <Loader2 className="h-5 w-5 animate-spin" />
            <span>Carregando configurações...</span>
          </div>
        ) : (
          <div className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="value-per-coupon">Valor por Cupom (R$)</Label>
              <Input
                id="value-per-coupon"
                type="text"
                inputMode="decimal"
                value={valuePerCoupon}
                onChange={(e) => setValuePerCoupon(e.target.value)}
                placeholder="Ex: 200,00"
              />
              <p className="text-xs text-muted-foreground">
                A cada X reais em compras, o cliente ganha 1 cupom.
              </p>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <DatePicker date={startDate} setDate={setStartDate} label="Início da Campanha" />
              <DatePicker date={endDate} setDate={setEndDate} label="Fim da Campanha" />
            </div>
          </div>
        )}
      </CardContent>
      <CardFooter>
        <Button onClick={handleSave} disabled={isSaving || isLoadingSettings}>
          {isSaving && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
          {isSaving ? 'Salvando...' : 'Salvar Configurações'}
        </Button>
      </CardFooter>
    </Card>
  );
}
