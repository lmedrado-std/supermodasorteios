'use client';
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
  CardDescription,
} from '@/components/ui/card';
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from '@/components/ui/accordion';
import { Badge } from '@/components/ui/badge';
import {
  Sparkles,
  Gift,
  Calendar,
  CheckCircle,
  Clock,
  User,
  Hash,
  MapPin,
  Phone,
  DollarSign,
  Info
} from 'lucide-react';
import { format } from 'date-fns';
import { ptBR } from 'date-fns/locale';
import { Timestamp } from 'firebase/firestore';

type ScratchCoupon = {
  id: string;
  couponNumber: string;
  cpf: string;
  fullName: string;
  premio: string;
  purchaseValue: number;
  purchaseDate: Timestamp;
  purchaseLocation: string;
  purchasePhone: string;
  liberadoEm: Timestamp;
  raspadoEm?: Timestamp;
  status: 'disponivel' | 'raspado' | 'expirado';
};

interface ScratchCardDetailsProps {
  coupon: ScratchCoupon;
}

export const ScratchCardDetails = ({ coupon }: ScratchCardDetailsProps) => {
  const {
    premio,
    status,
    liberadoEm,
    raspadoEm,
    fullName,
    cpf,
    purchaseValue,
    purchaseDate,
    purchaseLocation,
    purchasePhone,
    couponNumber,
  } = coupon;

  const formatDate = (timestamp?: Timestamp, dateFormat = "dd/MM/yyyy 'às' HH:mm") => {
    if (!timestamp) return 'N/A';
    return format(timestamp.toDate(), dateFormat, {
      locale: ptBR,
    });
  };

  const formatCurrency = (value?: number) => {
    if (value === undefined || value === null) return 'N/A';
    return value.toLocaleString('pt-BR', {
      style: 'currency',
      currency: 'BRL',
    });
  };

  const InfoRow = ({ icon, label, value }: { icon: React.ReactNode, label: string, value: string | React.ReactNode }) => (
    <div className="flex items-start gap-4">
        <div className="flex-shrink-0 text-amber-600/80 mt-1">{icon}</div>
        <div>
            <p className="text-xs font-semibold text-muted-foreground">{label}</p>
            <p className="text-sm font-bold text-foreground">{value}</p>
        </div>
    </div>
  );

  return (
    <Card className="shadow-2xl border-amber-400/30 bg-gradient-to-br from-gray-50 via-amber-50 to-orange-50 overflow-hidden animate-in fade-in-50 duration-700">
      <CardHeader className="text-center p-6 bg-gradient-to-b from-white to-transparent">
        <Sparkles className="h-8 w-8 mx-auto text-amber-500 animate-pulse" />
        <CardTitle className="text-xl font-black text-amber-700 mt-2">
          Parabéns! Você Ganhou!
        </CardTitle>
        <CardDescription className="text-amber-900/80">
            Obrigado por participar da nossa promoção!
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-6 p-6">
        
        <div className="relative text-center p-8 rounded-2xl bg-gradient-to-br from-amber-400 via-orange-500 to-red-500 shadow-xl overflow-hidden">
             <div className="absolute inset-0 bg-grid-slate-100 [mask-image:linear-gradient(0deg,#fff,rgba(255,255,255,0.6))] opacity-20"></div>
             <div className="absolute inset-0 bg-gradient-to-t from-transparent to-white/20"></div>
             <div className="absolute -inset-12 bg-gradient-to-br from-yellow-300 via-transparent to-red-400 opacity-30 blur-2xl animate-pulse"></div>

            <div className='relative z-10'>
                <Gift className="h-12 w-12 mx-auto text-white drop-shadow-lg mb-2"/>
                <p className="text-xs text-white/80 font-semibold uppercase tracking-wider">Seu Prêmio</p>
                <p className="text-3xl font-black text-white drop-shadow-md mt-1">
                    {premio}
                </p>
            </div>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-x-4 gap-y-2 text-sm">
             <div className="flex items-center gap-3 p-2 rounded-lg bg-green-500/10">
                <CheckCircle className="h-5 w-5 text-green-500"/>
                <Badge variant="default" className="bg-green-600 hover:bg-green-700">
                    Prêmio Utilizado
                </Badge>
            </div>
             <div className="flex items-center gap-3 p-2 rounded-lg bg-gray-500/10">
                <Clock className="h-5 w-5 text-muted-foreground"/>
                <span className='text-muted-foreground'>Raspado em: <strong>{formatDate(raspadoEm)}</strong></span>
            </div>
        </div>

        <div>
            <h3 className="font-bold text-center mb-4 text-muted-foreground tracking-wide">Detalhes da Compra</h3>
            <div className="space-y-4 rounded-lg border bg-white/50 p-4 shadow-inner">
                <InfoRow icon={<DollarSign size={20}/>} label="Valor da Compra" value={<span className='text-lg font-extrabold text-green-700'>{formatCurrency(purchaseValue)}</span>} />
                <InfoRow icon={<Calendar size={18}/>} label="Data da Compra" value={purchaseDate ? format(purchaseDate.toDate(), "dd 'de' MMMM 'de' yyyy", { locale: ptBR }) : 'N/A'} />
                {purchaseLocation && <InfoRow icon={<MapPin size={18}/>} label="Local da Compra" value={purchaseLocation} />}
                {couponNumber && <InfoRow icon={<Hash size={18}/>} label="Nº Cupom Sorteio" value={couponNumber} />}
            </div>
        </div>

        <Accordion type="single" collapsible className="w-full">
          <AccordionItem value="item-1" className="border-b-0">
            <AccordionTrigger className="bg-gray-100 hover:bg-gray-200/70 px-4 rounded-lg transition-colors duration-300 [&[data-state=open]]:rounded-b-none">
                <div className='flex items-center gap-3'>
                    <User className='text-gray-600'/>
                    <span className='font-semibold text-gray-700'>Informações do Cliente</span>
                </div>
            </AccordionTrigger>
            <AccordionContent className='pt-4 space-y-4 bg-gray-50 rounded-b-lg px-4 pb-4 border border-t-0 border-gray-200'>
                 <InfoRow icon={<User size={18}/>} label="Nome Completo" value={fullName} />
                 <InfoRow icon={<Hash size={18}/>} label="CPF" value={cpf.replace(/(\d{3})(\d{3})(\d{3})(\d{2})/, '$1.$2.$3-$4')} />
                 {purchasePhone && <InfoRow icon={<Phone size={18}/>} label="Telefone" value={purchasePhone} />}
            </AccordionContent>
          </AccordionItem>
        </Accordion>

      </CardContent>
    </Card>
  );
};
