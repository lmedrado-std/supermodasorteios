'use client';
import { useState, useMemo } from 'react';
import { useFirestore, useCollection, useMemoFirebase } from '@/firebase';
import {
  collection,
  addDoc,
  serverTimestamp,
  query,
  orderBy,
  doc,
  deleteDoc,
  Timestamp
} from 'firebase/firestore';
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
  CardDescription,
  CardFooter,
} from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { useToast } from '@/hooks/use-toast';
import { Loader2, Sparkles, Trash2, Tag, CheckCircle, Gift, Copy } from 'lucide-react';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import { Badge } from '@/components/ui/badge';
import { format } from 'date-fns';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from '@/components/ui/alert-dialog';
import { CurrencyInput } from '@/components/CurrencyInput';


type ScratchCoupon = {
  id: string;
  cpf: string;
  fullName: string;
  premio: string;
  purchaseValue: number;
  purchaseDate: Timestamp;
  purchaseLocation: string;
  purchasePhone: string;
  couponNumber: string;
  status: 'disponivel' | 'raspado';
  liberadoEm: { seconds: number };
  raspadoEm?: { seconds: number };
};

export function ScratchCouponManager() {
  const firestore = useFirestore();
  const { toast } = useToast();

  const [cpf, setCpf] = useState('');
  const [fullName, setFullName] = useState('');
  const [premio, setPremio] = useState('');
  const [purchaseValue, setPurchaseValue] = useState<number | undefined>();
  const [purchaseDate, setPurchaseDate] = useState('');
  const [purchaseLocation, setPurchaseLocation] = useState('');
  const [purchasePhone, setPurchasePhone] = useState('');
  const [couponNumber, setCouponNumber] = useState('');

  const [isReleasing, setIsReleasing] = useState(false);
  const [isDeleting, setIsDeleting] = useState<string | null>(null);
  const [filter, setFilter] = useState<'all' | 'disponivel' | 'raspado'>('all');

  const scratchCouponsQuery = useMemoFirebase(
    () =>
      firestore
        ? query(collection(firestore, 'scratch_coupons'), orderBy('liberadoEm', 'desc'))
        : null,
    [firestore]
  );

  const { data: scratchCoupons, isLoading } = useCollection<ScratchCoupon>(scratchCouponsQuery);
  
  const filteredCoupons = useMemo(() => {
    if (!scratchCoupons) return [];
    if (filter === 'all') return scratchCoupons;
    return scratchCoupons.filter(coupon => coupon.status === filter);
  }, [scratchCoupons, filter]);


  const handleRelease = async () => {
    if (!firestore) return;

    const formattedCpf = cpf.replace(/\D/g, '');
    if (formattedCpf.length !== 11) {
      toast({
        variant: 'destructive',
        title: 'CPF Inválido',
        description: 'O CPF deve conter 11 dígitos.',
      });
      return;
    }

    if (!premio.trim() || !fullName.trim() || !purchaseValue || !purchaseDate) {
      toast({
        variant: 'destructive',
        title: 'Campos Obrigatórios',
        description: 'Preencha todos os campos obrigatórios para liberar o cupom.',
      });
      return;
    }

    setIsReleasing(true);
    try {
      await addDoc(collection(firestore, 'scratch_coupons'), {
        cpf: formattedCpf,
        fullName,
        premio,
        purchaseValue,
        purchaseDate: Timestamp.fromDate(new Date(purchaseDate)),
        purchaseLocation,
        purchasePhone,
        couponNumber,
        status: 'disponivel',
        liberadoEm: serverTimestamp(),
        raspadoEm: null,
      });

      toast({
        title: 'Sucesso!',
        description: `Raspadinha liberada para o CPF ${formattedCpf}.`,
      });
      
      // Reset form
      setCpf('');
      setFullName('');
      setPremio('');
      setPurchaseValue(undefined);
      setPurchaseDate('');
      setPurchaseLocation('');
      setPurchasePhone('');
      setCouponNumber('');

    } catch (error) {
      console.error('Error releasing scratch coupon:', error);
      toast({
        variant: 'destructive',
        title: 'Erro ao Liberar',
        description: 'Não foi possível liberar a raspadinha. Tente novamente.',
      });
    } finally {
      setIsReleasing(false);
    }
  };
  
  const handleDelete = async (id: string) => {
    if (!firestore) return;
    setIsDeleting(id);
    try {
        await deleteDoc(doc(firestore, 'scratch_coupons', id));
        toast({
            title: 'Sucesso!',
            description: 'Raspadinha excluída.',
        });
    } catch (error) {
        console.error("Error deleting scratch coupon: ", error);
        toast({
            variant: 'destructive',
            title: 'Erro ao excluir',
            description: 'Não foi possível excluir a raspadinha. Tente novamente.',
        });
    } finally {
        setIsDeleting(null);
    }
  };

  const handleDuplicate = (coupon: ScratchCoupon) => {
    setCpf(coupon.cpf);
    setFullName(coupon.fullName);
    setPremio(coupon.premio);
    setPurchaseValue(coupon.purchaseValue);
    if (coupon.purchaseDate) {
      setPurchaseDate(format(coupon.purchaseDate.toDate(), 'yyyy-MM-dd'));
    }
    setPurchaseLocation(coupon.purchaseLocation);
    setPurchasePhone(coupon.purchasePhone);
    setCouponNumber(''); // Clear coupon number to avoid accidental duplicates
    toast({
        title: 'Cupom Duplicado!',
        description: 'Os dados foram copiados para o formulário. Ajuste e libere um novo cupom.'
    });
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };


  return (
    <div className="grid gap-8 md:grid-cols-1 lg:grid-cols-2">
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Sparkles className="h-5 w-5 text-primary" />
            Lançar Raspadinha
          </CardTitle>
          <CardDescription>
            Libere um cupom de prêmio instantâneo para um cliente específico.
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
           <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="cpf-release">CPF do Cliente*</Label>
                <Input
                  id="cpf-release"
                  placeholder="11 dígitos"
                  value={cpf}
                  onChange={(e) => setCpf(e.target.value)}
                  maxLength={11}
                />
              </div>
              <div className="space-y-2">
                  <Label htmlFor="fullName-release">Nome Completo*</Label>
                  <Input
                  id="fullName-release"
                  placeholder="Nome do cliente"
                  value={fullName}
                  onChange={(e) => setFullName(e.target.value)}
                  />
              </div>
          </div>
          <div className="space-y-2">
            <Label htmlFor="premio-release">Prêmio*</Label>
            <Input
              id="premio-release"
              placeholder="Ex: R$ 50 em compras, 10% de desconto"
              value={premio}
              onChange={(e) => setPremio(e.target.value)}
            />
          </div>
           <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
               <div className="space-y-2">
                <Label htmlFor="value-release">Valor da Compra*</Label>
                <CurrencyInput value={purchaseValue} onValueChange={setPurchaseValue} />
              </div>
              <div className="space-y-2">
                <Label htmlFor="date-release">Data da Compra*</Label>
                <Input
                  id="date-release"
                  type="date"
                  value={purchaseDate}
                  onChange={(e) => setPurchaseDate(e.target.value)}
                />
              </div>
           </div>
           <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-2">
                  <Label htmlFor="phone-release">Telefone</Label>
                  <Input
                  id="phone-release"
                  placeholder="(99) 99999-9999"
                  value={purchasePhone}
                  onChange={(e) => setPurchasePhone(e.target.value)}
                  />
              </div>
               <div className="space-y-2">
                <Label htmlFor="coupon-number-release">Nº do Cupom Sorteio</Label>
                <Input
                  id="coupon-number-release"
                  placeholder="SM-00001 (Opcional)"
                  value={couponNumber}
                  onChange={(e) => setCouponNumber(e.target.value)}
                />
              </div>
           </div>
            <div className="space-y-2">
                <Label htmlFor="location-release">Local da Compra</Label>
                <Input
                id="location-release"
                placeholder="Endereço da loja"
                value={purchaseLocation}
                onChange={(e) => setPurchaseLocation(e.target.value)}
                />
            </div>
        </CardContent>
        <CardFooter>
          <Button onClick={handleRelease} disabled={isReleasing || !cpf || !premio || !fullName || !purchaseValue || !purchaseDate}>
            {isReleasing ? (
              <Loader2 className="mr-2 h-4 w-4 animate-spin" />
            ) : (
              <Gift className="mr-2 h-4 w-4" />
            )}
            {isReleasing ? 'Liberando...' : 'Liberar Cupom'}
          </Button>
        </CardFooter>
      </Card>

      <Card className="lg:col-span-1">
        <CardHeader>
          <CardTitle>Histórico de Raspadinhas</CardTitle>
          <CardDescription>
            Total de {filteredCoupons?.length ?? 0} de {scratchCoupons?.length ?? 0} raspadinhas liberadas.
          </CardDescription>
           <div className="flex items-center gap-2 pt-4">
            <Button
              variant={filter === 'all' ? 'default' : 'outline'}
              size="sm"
              onClick={() => setFilter('all')}
            >
              Todos
            </Button>
            <Button
              variant={filter === 'disponivel' ? 'default' : 'outline'}
              size="sm"
              onClick={() => setFilter('disponivel')}
            >
              Disponíveis
            </Button>
            <Button
              variant={filter === 'raspado' ? 'default' : 'outline'}
              size="sm"
              onClick={() => setFilter('raspado')}
            >
              Raspados
            </Button>
          </div>
        </CardHeader>
        <CardContent className="p-0">
          <div className="overflow-x-auto max-h-[400px]">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>CPF</TableHead>
                  <TableHead>Prêmio</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead>Data Liberação</TableHead>
                  <TableHead>Data Raspado</TableHead>
                  <TableHead className="text-right">Ações</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {isLoading && (
                  <TableRow>
                    <TableCell colSpan={6} className="h-24 text-center">
                      Carregando...
                    </TableCell>
                  </TableRow>
                )}
                {!isLoading && filteredCoupons.length > 0 ? (
                  filteredCoupons.map((coupon) => (
                    <TableRow key={coupon.id}>
                      <TableCell>{coupon.cpf.replace(/(\d{3})(\d{3})(\d{3})(\d{2})/, '$1.$2.$3-$4')}</TableCell>
                      <TableCell className="font-medium">{coupon.premio}</TableCell>
                      <TableCell>
                        <Badge variant={coupon.status === 'disponivel' ? 'secondary' : 'default'} className={coupon.status === 'raspado' ? 'bg-destructive' : ''}>
                          {coupon.status === 'disponivel' ? (
                             <Tag className="mr-1 h-3 w-3" />
                          ) : (
                             <CheckCircle className="mr-1 h-3 w-3" />
                          )}
                          {coupon.status === 'disponivel' ? 'Disponível' : 'Raspado'}
                        </Badge>
                      </TableCell>
                      <TableCell>
                        {coupon.liberadoEm ? format(new Date(coupon.liberadoEm.seconds * 1000), 'dd/MM/yy HH:mm') : 'N/A'}
                      </TableCell>
                       <TableCell>
                        {coupon.raspadoEm ? format(new Date(coupon.raspadoEm.seconds * 1000), 'dd/MM/yy HH:mm') : '-'}
                      </TableCell>
                       <TableCell className="text-right">
                        <div className='flex items-center justify-end gap-1'>
                             <Button variant="ghost" size="icon" onClick={() => handleDuplicate(coupon)}>
                                <Copy className="h-4 w-4 text-blue-500" />
                                <span className="sr-only">Duplicar</span>
                            </Button>
                            <AlertDialog>
                                <AlertDialogTrigger asChild>
                                    <Button variant="ghost" size="icon" disabled={isDeleting === coupon.id}>
                                    {isDeleting === coupon.id ? <Loader2 className="h-4 w-4 animate-spin"/> : <Trash2 className="h-4 w-4 text-destructive"/>}
                                    </Button>
                                </AlertDialogTrigger>
                                <AlertDialogContent>
                                    <AlertDialogHeader>
                                    <AlertDialogTitle>Confirmar Exclusão</AlertDialogTitle>
                                    <AlertDialogDescription>
                                        Tem certeza que deseja excluir esta raspadinha para o CPF {coupon.cpf}? A ação não pode ser desfeita.
                                    </AlertDialogDescription>
                                    </AlertDialogHeader>
                                    <AlertDialogFooter>
                                    <AlertDialogCancel>Cancelar</AlertDialogCancel>
                                    <AlertDialogAction onClick={() => handleDelete(coupon.id)}>Excluir</AlertDialogAction>
                                    </AlertDialogFooter>
                                </AlertDialogContent>
                            </AlertDialog>
                        </div>
                      </TableCell>
                    </TableRow>
                  ))
                ) : (
                  !isLoading && (
                    <TableRow>
                      <TableCell colSpan={6} className="h-24 text-center">
                        Nenhuma raspadinha encontrada para este filtro.
                      </TableCell>
                    </TableRow>
                  )
                )}
              </TableBody>
            </Table>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}

    