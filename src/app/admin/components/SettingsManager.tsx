'use client';
import { useState, useEffect } from 'react';
import { useFirestore, useDoc, useMemoFirebase } from '@/firebase';
import { doc, setDoc } from 'firebase/firestore';
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

const SETTINGS_DOC_PATH = 'settings/raffle';

export function SettingsManager() {
  const firestore = useFirestore();
  const settingsDocRef = useMemoFirebase(
    () => (firestore ? doc(firestore, SETTINGS_DOC_PATH) : null),
    [firestore]
  );

  const { data: settings, isLoading: isLoadingSettings } = useDoc<{
    valuePerCoupon: number;
  }>(settingsDocRef);

  const [valuePerCoupon, setValuePerCoupon] = useState<string>('');
  const [isSaving, setIsSaving] = useState(false);
  const { toast } = useToast();

  useEffect(() => {
    if (settings && typeof settings.valuePerCoupon === 'number') {
      setValuePerCoupon(String(settings.valuePerCoupon));
    }
  }, [settings]);

  const handleSave = async () => {
    if (!settingsDocRef) return;

    const numericValue = parseFloat(valuePerCoupon);

    if (isNaN(numericValue) || numericValue <= 0) {
      toast({
        variant: 'destructive',
        title: 'Valor Inválido',
        description: 'O valor por cupom deve ser um número maior que zero.',
      });
      return;
    }

    setIsSaving(true);
    try {
      await setDoc(
        settingsDocRef,
        { valuePerCoupon: numericValue },
        { merge: true }
      );
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

  return (
    <Card>
      <CardHeader>
        <CardTitle>Configurações do Sorteio</CardTitle>
        <CardDescription>
          Defina as regras para a geração de cupons.
        </CardDescription>
      </CardHeader>
      <CardContent>
        {isLoadingSettings ? (
          <div className="flex items-center space-x-2">
            <Loader2 className="h-5 w-5 animate-spin" />
            <span>Carregando configurações...</span>
          </div>
        ) : (
          <div className="space-y-2">
            <Label htmlFor="value-per-coupon">Valor por Cupom (R$)</Label>
            <Input
              id="value-per-coupon"
              type="number"
              value={valuePerCoupon}
              onChange={(e) => setValuePerCoupon(e.target.value)}
              placeholder="Ex: 200"
            />
            <p className="text-xs text-muted-foreground">
              A cada X reais em compras, o cliente ganha 1 cupom.
            </p>
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
