'use client';
import { useState } from 'react';
import { useFirestore, useCollection, useMemoFirebase } from '@/firebase';
import {
  collection,
  addDoc,
  serverTimestamp,
  query,
  orderBy,
  doc,
  deleteDoc,
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
import { Loader2, Sparkles, Trash2, Tag, CheckCircle, Gift } from 'lucide-react';
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


type ScratchCoupon = {
  id: string;
  cpf: string;
  premio: string;
  status: 'disponivel' | 'raspado';
  liberadoEm: { seconds: number };
  raspadoEm?: { seconds: number };
};

export function ScratchCouponManager() {
  const firestore = useFirestore();
  const { toast } = useToast();

  const [cpf, setCpf] = useState('');
  const [premio, setPremio] = useState('');
  const [isReleasing, setIsReleasing] = useState(false);
  const [isDeleting, setIsDeleting] = useState<string | null>(null);

  const scratchCouponsQuery = useMemoFirebase(
    () =>
      firestore
        ? query(collection(firestore, 'scratch_coupons'), orderBy('liberadoEm', 'desc'))
        : null,
    [firestore]
  );

  const { data: scratchCoupons, isLoading } = useCollection<ScratchCoupon>(scratchCouponsQuery);

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

    if (!premio.trim()) {
      toast({
        variant: 'destructive',
        title: 'Prêmio Inválido',
        description: 'A descrição do prêmio não pode estar em branco.',
      });
      return;
    }

    setIsReleasing(true);
    try {
      await addDoc(collection(firestore, 'scratch_coupons'), {
        cpf: formattedCpf,
        premio,
        status: 'disponivel',
        liberadoEm: serverTimestamp(),
        raspadoEm: null,
      });

      toast({
        title: 'Sucesso!',
        description: `Raspadinha liberada para o CPF ${formattedCpf}.`,
      });
      setCpf('');
      setPremio('');
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
          <div className="space-y-2">
            <Label htmlFor="cpf-release">CPF do Cliente</Label>
            <Input
              id="cpf-release"
              placeholder="Digite os 11 dígitos do CPF"
              value={cpf}
              onChange={(e) => setCpf(e.target.value)}
              maxLength={11}
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="premio-release">Prêmio</Label>
            <Input
              id="premio-release"
              placeholder="Ex: R$ 50 em compras, 10% de desconto, etc."
              value={premio}
              onChange={(e) => setPremio(e.target.value)}
            />
          </div>
        </CardContent>
        <CardFooter>
          <Button onClick={handleRelease} disabled={isReleasing || !cpf || !premio}>
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
            Total de {scratchCoupons?.length ?? 0} raspadinhas liberadas.
          </CardDescription>
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
                {!isLoading && scratchCoupons?.length ? (
                  scratchCoupons.map((coupon) => (
                    <TableRow key={coupon.id}>
                      <TableCell>{coupon.cpf.replace(/(\d{3})(\d{3})(\d{3})(\d{2})/, '$1.$2.$3-$4')}</TableCell>
                      <TableCell className="font-medium">{coupon.premio}</TableCell>
                      <TableCell>
                        <Badge variant={coupon.status === 'disponivel' ? 'secondary' : 'default'}>
                          {coupon.status === 'disponivel' ? (
                             <Tag className="mr-1 h-3 w-3" />
                          ) : (
                             <CheckCircle className="mr-1 h-3 w-3" />
                          )}
                          {coupon.status}
                        </Badge>
                      </TableCell>
                      <TableCell>
                        {coupon.liberadoEm ? format(new Date(coupon.liberadoEm.seconds * 1000), 'dd/MM/yy HH:mm') : 'N/A'}
                      </TableCell>
                       <TableCell>
                        {coupon.raspadoEm ? format(new Date(coupon.raspadoEm.seconds * 1000), 'dd/MM/yy HH:mm') : '-'}
                      </TableCell>
                       <TableCell className="text-right">
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
                      </TableCell>
                    </TableRow>
                  ))
                ) : (
                  !isLoading && (
                    <TableRow>
                      <TableCell colSpan={6} className="h-24 text-center">
                        Nenhuma raspadinha liberada ainda.
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
