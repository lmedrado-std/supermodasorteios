'use client';
import { useState, useEffect } from 'react';
import { useDoc, useFirestore, useMemoFirebase } from '@/firebase';
import { doc, Timestamp } from 'firebase/firestore';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import { CalendarClock, PartyPopper } from 'lucide-react';
import { endOfDay } from 'date-fns';

type RaffleSettings = {
  campaignEndDate?: Timestamp;
};

type TimeLeft = {
  days: number;
  hours: number;
  minutes: number;
  seconds: number;
};

export function CountdownTimer() {
  const firestore = useFirestore();
  const settingsDocRef = useMemoFirebase(
    () => (firestore ? doc(firestore, 'settings/raffle') : null),
    [firestore]
  );
  const { data: settings, isLoading } = useDoc<RaffleSettings>(settingsDocRef);
  const [timeLeft, setTimeLeft] = useState<TimeLeft | null>(null);
  const [isClient, setIsClient] = useState(false);

  useEffect(() => {
    setIsClient(true);
  }, []);

  useEffect(() => {
    if (!settings?.campaignEndDate || !isClient) {
      return;
    }

    const endDate = endOfDay(settings.campaignEndDate.toDate());

    const calculateTimeLeft = () => {
      const difference = +endDate - +new Date();
      let timeLeft: TimeLeft | null = null;

      if (difference > 0) {
        timeLeft = {
          days: Math.floor(difference / (1000 * 60 * 60 * 24)),
          hours: Math.floor((difference / (1000 * 60 * 60)) % 24),
          minutes: Math.floor((difference / 1000 / 60) % 60),
          seconds: Math.floor((difference / 1000) % 60),
        };
      }
      return timeLeft;
    };
    
    setTimeLeft(calculateTimeLeft());
    
    const timer = setInterval(() => {
      setTimeLeft(calculateTimeLeft());
    }, 1000);

    return () => clearInterval(timer);
  }, [settings, isClient]);

  if (isLoading || !isClient) {
    return (
        <div className="h-28 flex items-center justify-center">
            <div className="animate-pulse flex space-x-4">
                <div className="rounded-md bg-muted h-16 w-16"></div>
                <div className="rounded-md bg-muted h-16 w-16"></div>
                <div className="rounded-md bg-muted h-16 w-16"></div>
                <div className="rounded-md bg-muted h-16 w-16"></div>
            </div>
      </div>
    );
  }

  if (!timeLeft) {
    return (
       <Alert className="text-center bg-secondary/10 border-secondary/20">
            <PartyPopper className="h-5 w-5 mx-auto mb-2 text-secondary"/>
            <AlertTitle className="font-bold">Campanha Encerrada!</AlertTitle>
            <AlertDescription>
                O período para cadastro de novos cupons terminou. Boa sorte a todos os participantes!
            </AlertDescription>
        </Alert>
    );
  }

  const TimeBox = ({ value, label }: { value: number; label: string }) => (
    <div className="flex flex-col items-center justify-center bg-primary text-primary-foreground rounded-lg p-3 md:p-4 shadow-lg min-w-[60px] md:min-w-[70px]">
      <span className="text-2xl md:text-3xl font-bold tracking-tight">
        {String(value).padStart(2, '0')}
      </span>
      <span className="text-xs uppercase">{label}</span>
    </div>
  );

  return (
    <div className="flex flex-col items-center gap-4">
      <div className="flex items-center gap-2 text-sm text-center font-semibold text-muted-foreground">
        <CalendarClock className="h-4 w-4" />
        <p>A promoção termina em:</p>
      </div>
      <div className="flex items-center justify-center gap-2 md:gap-4">
        <TimeBox value={timeLeft.days} label="Dias" />
        <TimeBox value={timeLeft.hours} label="Horas" />
        <TimeBox value={timeLeft.minutes} label="Minutos" />
        <TimeBox value={timeLeft.seconds} label="Segundos" />
      </div>
    </div>
  );
}
