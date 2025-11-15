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

  const formatDate = (timestamp?: Timestamp) => {
    if (!timestamp) return 'N/A';
    return format(timestamp.toDate(), "dd/MM/yyyy 'às' HH:mm", {
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
    <div className="flex items-start gap-3">
        <div className="flex-shrink-0 text-muted-foreground mt-1">{icon}</div>
        <div>
            <p className="text-sm font-semibold text-muted-foreground">{label}</p>
            <p className="text-sm font-bold text-foreground">{value}</p>
        </div>
    </div>
  );

  return (
    <Card className="shadow-lg border-amber-400/50 bg-gradient-to-br from-yellow-50 to-amber-100 overflow-hidden">
      <CardHeader>
        <CardTitle className="text-xl font-bold text-center text-amber-600 flex items-center justify-center gap-2">
          <Sparkles /> Detalhes do Prêmio
        </CardTitle>
        <CardDescription className="text-center">
            Obrigado pela sua participação!
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-6">
        <div className="text-center p-6 rounded-lg bg-white/60 border border-amber-300 shadow-inner">
            <Gift className="h-12 w-12 mx-auto text-amber-500 mb-2"/>
            <p className="text-xs text-amber-700 font-semibold">PRÊMIO</p>
            <p className="text-2xl font-black text-transparent bg-gradient-to-r from-amber-600 to-yellow-500 bg-clip-text">
                {premio}
            </p>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-sm">
             <div className="flex items-center gap-3">
                <CheckCircle className="h-5 w-5 text-green-500"/>
                <Badge variant={status === 'raspado' ? 'default' : 'secondary'}>
                    {status.charAt(0).toUpperCase() + status.slice(1)}
                </Badge>
            </div>
            <div className="flex items-center gap-3">
                <Calendar className="h-5 w-5 text-muted-foreground"/>
                <span>Recebido em: {formatDate(liberadoEm)}</span>
            </div>
            <div className="flex items-center gap-3 col-span-full">
                <Clock className="h-5 w-5 text-muted-foreground"/>
                <span>Raspado em: {formatDate(raspadoEm)}</span>
            </div>
        </div>
        
        <div className="bg-green-100 border border-green-300 rounded-lg p-4 text-center">
            <DollarSign className="h-6 w-6 mx-auto text-green-600 mb-1"/>
            <p className="text-xs text-green-700 font-semibold">VALOR DA COMPRA</p>
            <p className="text-xl font-bold text-green-800">{formatCurrency(purchaseValue)}</p>
        </div>

        <div>
            <h3 className="font-bold text-center mb-2 text-muted-foreground">Informações da Compra</h3>
            <div className="space-y-4 rounded-lg border bg-background p-4">
                <InfoRow icon={<Calendar size={18}/>} label="Data da Compra" value={purchaseDate ? format(purchaseDate.toDate(), "dd 'de' MMMM 'de' yyyy", { locale: ptBR }) : 'N/A'} />
                {purchaseLocation && <InfoRow icon={<MapPin size={18}/>} label="Local" value={purchaseLocation} />}
                {purchasePhone && <InfoRow icon={<Phone size={18}/>} label="Telefone" value={purchasePhone} />}
                {couponNumber && <InfoRow icon={<Hash size={18}/>} label="Nº Cupom Principal" value={couponNumber} />}
            </div>
        </div>

        <Accordion type="single" collapsible className="w-full">
          <AccordionItem value="item-1">
            <AccordionTrigger>
                <div className='flex items-center gap-2'>
                    <User />
                    <span className='font-semibold'>Dados do Cliente</span>
                </div>
            </AccordionTrigger>
            <AccordionContent className='pt-4 space-y-4'>
                 <InfoRow icon={<User size={18}/>} label="Nome" value={fullName} />
                 <InfoRow icon={<Hash size={18}/>} label="CPF" value={cpf.replace(/(\d{3})(\d{3})(\d{3})(\d{2})/, '$1.$2.$3-$4')} />
            </AccordionContent>
          </AccordionItem>
        </Accordion>

      </CardContent>
    </Card>
  );
};
