'use client';

import { useEffect, useRef, useState, useMemo } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Alert, AlertDescription, AlertTitle } from './ui/alert';
import { CheckCircle2, Download, Ticket, Info, Calendar, ShoppingCart, DollarSign, Clock, List, Phone } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import {
  collection,
  query,
  where,
  getDocs,
  runTransaction,
  doc,
  serverTimestamp,
  writeBatch,
  getDoc,
  Timestamp,
} from 'firebase/firestore';
import { useFirestore, useMemoFirebase } from '@/firebase';
import { errorEmitter } from '@/firebase/error-emitter';
import { FirestorePermissionError } from '@/firebase/errors';
import html2canvas from 'html2canvas';
import { format, parseISO, startOfDay, endOfDay } from 'date-fns';
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group';
import { ScrollArea } from './ui/scroll-area';
import { Checkbox } from './ui/checkbox';
import { CouponListModal } from './CouponListModal';
import { useForm } from 'react-hook-form';
import { z } from 'zod';
import { zodResolver } from '@hookform/resolvers/zod';
import { Form, FormControl, FormDescription, FormField, FormItem, FormLabel, FormMessage } from '@/components/ui/form';
import { CurrencyInput } from './CurrencyInput';


const formSchema = z.object({
  nome: z.string().min(3, { message: 'O nome deve ter no mínimo 3 caracteres.' }),
  cpf: z.string().refine(val => /^\d{11}$/.test(val.replace(/\D/g, '')), {
    message: 'CPF inválido. Deve conter 11 dígitos.',
  }),
  telefone: z.string().refine(val => /^\d{10,11}$/.test(val.replace(/\D/g, '')), {
    message: 'Telefone inválido. Deve ter 10 ou 11 dígitos.',
  }),
  numeroCompra: z.string().min(1, { message: 'O número da compra é obrigatório.' }),
  valorCompra: z.number().min(0.01, { message: 'O valor da compra deve ser maior que zero.' }),
  dataCompra: z.string().min(1, { message: 'A data da compra é obrigatória.' }),
  quiz: z.enum(['supermoda', 'other-a', 'other-b'], {
    required_error: 'Você precisa selecionar uma resposta.',
  }),
  terms: z.literal<boolean>(true, {
    errorMap: () => ({ message: 'Você deve aceitar os termos para continuar.' }),
  }),
});


type FormValues = z.infer<typeof formSchema>;


const initialState: {
  message: string | null;
  coupons?: string[];
  fullName?: string | null;
  telefone?: string | null;
  purchaseValue?: number | null;
  purchaseNumber?: string | null;
  registrationDate?: Date | null;
  purchaseDate?: Date | null;
} = {
  message: null,
  coupons: [],
  fullName: null,
  telefone: null,
  purchaseValue: null,
  purchaseNumber: null,
  registrationDate: null,
  purchaseDate: null,
};

type RaffleSettings = {
  valuePerCoupon: number;
  campaignStartDate?: Timestamp;
  campaignEndDate?: Timestamp;
};

function SubmitButton({ isPending }: { isPending: boolean }) {
  return (
    <Button type="submit" className="w-full text-lg py-6" disabled={isPending}>
      {isPending ? 'Gerando...' : 'Gerar Cupom(ns)'}
      <Ticket className="ml-2 h-5 w-5" />
    </Button>
  );
}

export function RegistrationForm() {
  const firestore = useFirestore();
  const [state, setState] = useState(initialState);
  const [showSuccess, setShowSuccess] = useState(false);
  const [raffleSettings, setRaffleSettings] = useState<RaffleSettings | null>(null);
  const couponContainerRef = useRef<HTMLDivElement>(null);
  const { toast } = useToast();

  const form = useForm<FormValues>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      nome: '',
      cpf: '',
      telefone: '',
      numeroCompra: '',
      dataCompra: '',
    },
  });

  const { formState, reset } = form;

  useEffect(() => {
    if (!firestore) return;

    const fetchSettings = async () => {
      try {
        const settingsDocRef = doc(firestore, 'settings/raffle');
        const settingsDoc = await getDoc(settingsDocRef);
        if (settingsDoc.exists()) {
          setRaffleSettings(settingsDoc.data() as RaffleSettings);
        } else {
          setRaffleSettings({ valuePerCoupon: 200 });
        }
      } catch (e) {
        console.warn("Could not fetch raffle settings. Using default value.", e);
        setRaffleSettings({ valuePerCoupon: 200 });
      }
    };

    fetchSettings();
  }, [firestore]);


  useEffect(() => {
    if (state.message) {
      toast({
        variant: 'destructive',
        title: 'Erro no Cadastro',
        description: state.message,
      });
      setState(p => ({ ...p, message: null }));
    } else if (state.coupons && state.coupons.length > 0) {
      setShowSuccess(true);
      reset();
    }
  }, [state, toast, reset]);

  const handleSaveCoupon = () => {
    if (couponContainerRef.current) {
        const couponNode = couponContainerRef.current;
        html2canvas(couponNode, {
            scale: 2,
            useCORS: true,
            backgroundColor: null, 
        }).then((canvas) => {
            const link = document.createElement('a');
            const firstCoupon = state.coupons ? state.coupons[0] : 'cupom';
            link.download = `cupom-supermoda-${firstCoupon}.png`;
            link.href = canvas.toDataURL('image/png');
            link.click();
        });
    }
  };

  const generateCouponAction = async (formData: FormValues) => {
    if (!firestore || !raffleSettings) {
      setState({ ...initialState, message: 'Serviço de banco de dados ou configurações não disponíveis.' });
      return;
    }
    
    const {
      nome,
      cpf: rawCpf,
      telefone: rawTelefone,
      numeroCompra,
      valorCompra,
      dataCompra: dataCompraStr,
    } = formData;

    const cpf = rawCpf.replace(/\D/g, '');
    const telefone = rawTelefone.replace(/\D/g, '');
    
    const dataCompra = parseISO(dataCompraStr);
    if (isNaN(dataCompra.getTime())) {
        setState({ ...initialState, message: 'Data da compra inválida.' });
        return;
    }

    if (raffleSettings.campaignStartDate && raffleSettings.campaignEndDate) {
        const startDate = startOfDay(raffleSettings.campaignStartDate.toDate());
        const endDate = endOfDay(raffleSettings.campaignEndDate.toDate());
        if (dataCompra < startDate || dataCompra > endDate) {
            setState({
                ...initialState,
                message: `A data da compra deve estar entre ${format(startDate, 'dd/MM/yyyy')} e ${format(endDate, 'dd/MM/yyyy')}.`
            });
            return;
        }
    } else {
        setState({ ...initialState, message: 'O período da campanha não está configurado. Contate o administrador.' });
        return;
    }

    const q = query(
      collection(firestore, 'coupons'),
      where('purchaseNumber', '==', numeroCompra)
    );
    const querySnapshot = await getDocs(q);

    if (!querySnapshot.empty) {
      setState({
        ...initialState,
        message: 'Este número de compra já foi utilizado para gerar cupons.',
      });
      return;
    }
    
    const valuePerCoupon = raffleSettings.valuePerCoupon > 0 ? raffleSettings.valuePerCoupon : 200;
    const couponsToGenerate = Math.floor(valorCompra / valuePerCoupon);

    if (couponsToGenerate < 1) {
        setState({ ...initialState, message: `O valor da compra deve ser de no mínimo R$ ${valuePerCoupon.toFixed(2).replace('.',',')} para gerar um cupom.` });
        return;
    }

    const counterRef = doc(firestore, 'counters', 'coupons');

    try {
        const generatedCoupons = await runTransaction(firestore, async (transaction) => {
            const counterDoc = await transaction.get(counterRef);
            let currentNumber = 0;
            if (counterDoc.exists()) {
                currentNumber = counterDoc.data().lastNumber || 0;
            } else {
                transaction.set(counterRef, { lastNumber: 0 });
            }
            
            const newCoupons: string[] = [];
            const couponDataList = [];
            
            for (let i = 0; i < couponsToGenerate; i++) {
                const nextNumber = currentNumber + i + 1;
                const couponNumber = `SM-${String(nextNumber).padStart(5, '0')}`;
                newCoupons.push(couponNumber);

                const couponData = {
                    fullName: nome,
                    cpf,
                    telefone,
                    purchaseNumber: numeroCompra,
                    purchaseValue: valorCompra,
                    purchaseDate: Timestamp.fromDate(dataCompra),
                    couponNumber: couponNumber,
                    registrationDate: serverTimestamp(),
                };
                couponDataList.push(couponData);
            }
            
            const finalCounterNumber = currentNumber + couponsToGenerate;
            transaction.set(counterRef, { lastNumber: finalCounterNumber }, { merge: true });

            return { newCoupons, couponDataList };
        });

        const batch = writeBatch(firestore);
        generatedCoupons.couponDataList.forEach(couponData => {
            const couponRef = doc(collection(firestore, 'coupons'));
            const finalCouponData = { ...couponData, id: couponRef.id };
            batch.set(couponRef, finalCouponData);
        });

        await batch.commit();

        setState({
            message: null,
            coupons: generatedCoupons.newCoupons,
            fullName: nome,
            telefone: telefone,
            purchaseValue: valorCompra,
            purchaseNumber: numeroCompra,
            registrationDate: new Date(),
            purchaseDate: dataCompra,
        });

    } catch (error: any) {
        if (error.name === 'FirebaseError' && (error.code === 'permission-denied' || error.code === 'unauthenticated')) {
            const couponDataExample = {
                fullName: nome,
                cpf,
                telefone,
                purchaseNumber: numeroCompra,
                purchaseValue: valorCompra,
                purchaseDate: Timestamp.fromDate(dataCompra),
                couponNumber: "SM-XXXXX",
                registrationDate: serverTimestamp(),
            };

            const permissionError = new FirestorePermissionError({
                path: 'coupons/{couponId}',
                operation: 'create',
                requestResourceData: couponDataExample,
            });
            errorEmitter.emit('permission-error', permissionError);
            setState({ ...initialState, message: 'Erro de permissão. Verifique os detalhes e tente novamente.' });
        } else {
            setState({
                ...initialState,
                message: error.message || 'Erro no servidor. Não foi possível gerar o cupom.',
            });
        }
    }
  };

  if (showSuccess) {
    const couponsCount = state.coupons?.length ?? 0;
    const showCouponRange = couponsCount > 12;

    return (
       <div className="text-center animate-in fade-in-50 slide-in-from-bottom-5 duration-500">
          <Alert
            variant="default"
            className="mb-6 bg-green-100 border-green-400 text-green-700 dark:bg-green-900/50 dark:border-green-700 dark:text-green-300"
          >
            <CheckCircle2 className="h-4 w-4 text-green-600 dark:text-green-400" />
            <AlertTitle>Sucesso! Seu(s) cupom(ns) foi(foram) gerado(s)!</AlertTitle>
            <AlertDescription>
              Salve a imagem abaixo para não perdê-la.
            </AlertDescription>
          </Alert>
            
          <div className="flex flex-col items-center gap-6">
            <div ref={couponContainerRef} className="bg-card rounded-2xl shadow-2xl w-full max-w-md overflow-hidden border">
                {/* Header */}
                <div className="bg-primary p-4 text-center">
                    <h2 className="text-2xl font-bold text-primary-foreground font-headline flex items-center justify-center gap-2">
                        🎟️ Sorteio Supermoda!
                    </h2>
                </div>
                
                <div className="p-6 space-y-6">
                    {/* Coupon Info */}
                    <div className="text-center">
                        <p className="text-5xl font-black tracking-wider" style={{color: '#e30613'}}>{state.coupons?.[0]}</p>
                        <p className="text-lg text-muted-foreground mt-1">{state.fullName}</p>
                    </div>

                    {/* Multiple coupons */}
                    {couponsCount > 1 && (
                        <div className="text-center">
                            <p className="font-bold mb-2">Seus Cupons (Total: {couponsCount})</p>
                            {showCouponRange ? (
                                <div className="border rounded-md p-3 text-center bg-muted/50">
                                    <p className="font-bold text-sm">
                                       🎟️ Você gerou {couponsCount} cupons nesta compra!
                                    </p>
                                    <p className="font-semibold text-sm text-primary">{state.coupons?.[0]} a {state.coupons?.[couponsCount - 1]}</p>
                                    <CouponListModal coupons={state.coupons ?? []} />
                                </div>
                            ) : (
                                <ScrollArea className="h-28 w-full rounded-md border p-4">
                                    <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
                                        {state.coupons?.map(coupon => (
                                            <div key={coupon} className="border rounded-md p-2 text-center bg-muted/50">
                                                <p className="font-bold text-sm">🏷️ {coupon}</p>
                                            </div>
                                        ))}
                                    </div>
                                </ScrollArea>
                            )}
                        </div>
                    )}
                    
                    {/* Divider */}
                    <div className="border-t-2 border-dashed w-full"></div>

                    {/* Purchase Info */}
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-x-4 gap-y-3 text-sm text-left">
                        <div className="flex items-center gap-2">
                            <DollarSign className="h-4 w-4 text-muted-foreground"/>
                            <div>
                                <p className="font-bold">Valor da Compra</p>
                                <p>R$ {state.purchaseValue?.toLocaleString('pt-BR', { minimumFractionDigits: 2, maximumFractionDigits: 2 }) ?? 'N/A'}</p>
                            </div>
                        </div>
                         <div className="flex items-center gap-2">
                            <ShoppingCart className="h-4 w-4 text-muted-foreground"/>
                            <div>
                                <p className="font-bold">Nº da Compra</p>
                                <p>{state.purchaseNumber ?? 'N/A'}</p>
                            </div>
                        </div>
                        <div className="flex items-center gap-2">
                            <Calendar className="h-4 w-4 text-muted-foreground"/>
                            <div>
                                <p className="font-bold">Data da Compra</p>
                                <p>{state.purchaseDate ? format(state.purchaseDate, 'dd/MM/yyyy') : 'N/A'}</p>
                            </div>
                        </div>
                        <div className="flex items-center gap-2">
                            <Clock className="h-4 w-4 text-muted-foreground"/>
                            <div>
                                <p className="font-bold">Data do Cadastro</p>
                                <p>{state.registrationDate ? format(state.registrationDate, 'dd/MM/yyyy HH:mm') : 'N/A'}</p>
                            </div>
                        </div>
                    </div>

                </div>

                 {/* Footer */}
                <div className="bg-muted p-4 mt-4 text-center">
                   <p className="text-sm font-bold text-muted-foreground">❤️ Supermoda!</p>
                   <p className="text-xs text-muted-foreground">Boa sorte no sorteio!</p>
                </div>
            </div>

            <Button onClick={handleSaveCoupon} size="lg" className="bg-[#e30613] text-white hover:bg-[#f5b800] w-full max-w-md">
                <Download className="mr-2" /> Baixar Cupom
            </Button>

             <Button variant="outline" onClick={() => { setShowSuccess(false); setState(initialState); reset(); }} className="w-full max-w-sm mx-auto">
                Registrar Novo Cupom
            </Button>
          </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
       <Form {...form}>
        <form
            onSubmit={form.handleSubmit(generateCouponAction)}
            className="space-y-4"
        >
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <FormField
                    control={form.control}
                    name="nome"
                    render={({ field }) => (
                        <FormItem>
                            <FormLabel>Nome Completo</FormLabel>
                            <FormControl>
                                <Input placeholder="Seu nome completo" {...field} />
                            </FormControl>
                            <FormMessage />
                        </FormItem>
                    )}
                />
                <FormField
                    control={form.control}
                    name="cpf"
                    render={({ field }) => (
                        <FormItem>
                            <FormLabel>CPF</FormLabel>
                            <FormControl>
                                <Input placeholder="Apenas números" {...field} maxLength={11} />
                            </FormControl>
                            <FormMessage />
                        </FormItem>
                    )}
                />
            </div>

             <FormField
                control={form.control}
                name="telefone"
                render={({ field }) => (
                    <FormItem>
                        <FormLabel>Telefone (WhatsApp)</FormLabel>
                        <FormControl>
                            <Input placeholder="(99) 99999-9999" type="tel" {...field} />
                        </FormControl>
                        <FormMessage />
                    </FormItem>
                )}
            />

            <FormField
                control={form.control}
                name="numeroCompra"
                render={({ field }) => (
                    <FormItem>
                        <FormLabel>Número da Compra</FormLabel>
                        <FormControl>
                            <Input placeholder="Ex: 123456" {...field} />
                        </FormControl>
                         <p className="text-xs text-muted-foreground mt-1">Este número deve ser o mesmo da nota fiscal para validação na loja.</p>
                        <FormMessage />
                    </FormItem>
                )}
            />
        
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                 <FormField
                    control={form.control}
                    name="valorCompra"
                    render={({ field }) => (
                        <FormItem>
                            <FormLabel>Valor da Compra (R$)</FormLabel>
                            <FormControl>
                                <CurrencyInput
                                    value={field.value}
                                    onValueChange={field.onChange}
                                />
                            </FormControl>
                            <FormMessage />
                        </FormItem>
                    )}
                />
                <FormField
                    control={form.control}
                    name="dataCompra"
                    render={({ field }) => (
                        <FormItem>
                            <FormLabel>Data da Compra</FormLabel>
                            <FormControl>
                                <Input type="date" {...field} />
                            </FormControl>
                            <FormMessage />
                        </FormItem>
                    )}
                />
            </div>

            <FormField
              control={form.control}
              name="quiz"
              render={({ field }) => (
                <FormItem className="space-y-3">
                  <FormLabel>Qual é a loja que te deixa na moda e ainda te dá a chance de ganhar prêmios?</FormLabel>
                  <FormControl>
                    <RadioGroup
                      onValueChange={field.onChange}
                      defaultValue={field.value}
                      className="flex flex-col space-y-1"
                    >
                      <FormItem className="flex items-center space-x-3 space-y-0">
                        <FormControl>
                          <RadioGroupItem value="supermoda" />
                        </FormControl>
                        <FormLabel className="font-normal">
                          Claro que é a Supermoda!
                        </FormLabel>
                      </FormItem>
                      <FormItem className="flex items-center space-x-3 space-y-0">
                        <FormControl>
                          <RadioGroupItem value="other-a" />
                        </FormControl>
                        <FormLabel className="font-normal">
                          Talvez outra loja...
                        </FormLabel>
                      </FormItem>
                      <FormItem className="flex items-center space-x-3 space-y-0">
                        <FormControl>
                          <RadioGroupItem value="other-b" />
                        </FormControl>
                        <FormLabel className="font-normal">
                          Ainda estou descobrindo 😄
                        </FormLabel>
                      </FormItem>
                    </RadioGroup>
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            
            <FormField
              control={form.control}
              name="terms"
              render={({ field }) => (
                <FormItem className="flex flex-row items-start space-x-3 space-y-0 rounded-md border p-4">
                  <FormControl>
                    <Checkbox
                      checked={field.value}
                      onCheckedChange={field.onChange}
                    />
                  </FormControl>
                  <div className="space-y-1 leading-none">
                    <FormLabel>
                     Declaro que todas as informações são verídicas.
                    </FormLabel>
                    <FormDescription>
                       Estou ciente de que, para a validação do prêmio, deverei cumprir todos os requisitos da promoção.
                    </FormDescription>
                     <FormMessage />
                  </div>
                </FormItem>
              )}
            />


           {raffleSettings && (
            <div className="mt-2 flex flex-col gap-2 text-sm text-muted-foreground bg-secondary/10 p-3 rounded-lg border border-secondary/20">
                <div className="flex items-center gap-2">
                    <Info className="h-4 w-4 flex-shrink-0 text-secondary" />
                    <span>A cada <strong>R$ {raffleSettings.valuePerCoupon > 0 ? raffleSettings.valuePerCoupon.toFixed(2).replace('.', ',') : 'N/A'}</strong> em compras, você ganha 1 cupom.</span>
                </div>
                {raffleSettings.campaignStartDate && raffleSettings.campaignEndDate && (
                    <div className="flex items-center gap-2">
                        <Calendar className="h-4 w-4 flex-shrink-0 text-secondary" />
                        <span>Campanha válida para compras de <strong>{format(raffleSettings.campaignStartDate.toDate(), 'dd/MM/yy')}</strong> a <strong>{format(raffleSettings.campaignEndDate.toDate(), 'dd/MM/yy')}</strong>.</span>
                    </div>
                )}
            </div>
           )}
            <SubmitButton isPending={formState.isSubmitting} />
        </form>
       </Form>
    </div>
  );
}

    