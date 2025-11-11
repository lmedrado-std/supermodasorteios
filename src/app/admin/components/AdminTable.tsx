'use client';
import { useState } from 'react';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
  CardDescription,
} from '@/components/ui/card';
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
import { useCollection, useFirestore, useMemoFirebase } from '@/firebase';
import { collection, query, orderBy, doc, deleteDoc, writeBatch, getDocs } from 'firebase/firestore';
import { format } from 'date-fns';
import { Button } from '@/components/ui/button';
import { Loader2, Trash2 } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';

type Coupon = {
  id: string;
  fullName: string;
  cpf: string;
  purchaseNumber: string;
  purchaseValue: number;
  couponNumber: string;
  registrationDate: {
    seconds: number;
    nanoseconds: number;
  };
};

export function AdminTable() {
  const firestore = useFirestore();
  const { toast } = useToast();
  const [isDeleting, setIsDeleting] = useState<string | boolean>(false);

  const couponsQuery = useMemoFirebase(
    () =>
      firestore
        ? query(collection(firestore, 'coupons'), orderBy('registrationDate', 'desc'))
        : null,
    [firestore]
  );

  const { data: coupons, isLoading } = useCollection<Coupon>(couponsQuery);

  const handleDelete = async (couponId: string) => {
    if (!firestore) return;
    setIsDeleting(couponId);
    try {
      await deleteDoc(doc(firestore, 'coupons', couponId));
      toast({
        title: 'Sucesso!',
        description: 'Cupom excluído.',
      });
    } catch (error) {
      console.error("Error deleting coupon: ", error);
      toast({
        variant: 'destructive',
        title: 'Erro ao excluir',
        description: 'Não foi possível excluir o cupom. Tente novamente.',
      });
    } finally {
      setIsDeleting(false);
    }
  };
  
  const handleDeleteAll = async () => {
    if (!firestore || !coupons || coupons.length === 0) return;
    setIsDeleting(true);
    try {
      // O Firestore permite no máximo 500 operações por batch
      const batchSize = 500;
      for (let i = 0; i < coupons.length; i += batchSize) {
        const batch = writeBatch(firestore);
        const chunk = coupons.slice(i, i + batchSize);
        chunk.forEach(coupon => {
          const couponRef = doc(firestore, 'coupons', coupon.id);
          batch.delete(couponRef);
        });
        await batch.commit();
      }
      toast({
        title: 'Sucesso!',
        description: `Todos os ${coupons.length} cupons foram excluídos.`,
      });
    } catch (error) {
       console.error("Error deleting all coupons: ", error);
       toast({
        variant: 'destructive',
        title: 'Erro ao excluir tudo',
        description: 'Não foi possível excluir todos os cupons. Tente novamente.',
      });
    } finally {
      setIsDeleting(false);
    }
  };


  return (
    <Card>
      <CardHeader className="flex flex-row items-center justify-between">
        <div>
          <CardTitle>Total de Cupons: {coupons?.length ?? 0}</CardTitle>
          <CardDescription>
            Lista de todos os cupons registrados no sistema.
          </CardDescription>
        </div>
        <AlertDialog>
          <AlertDialogTrigger asChild>
            <Button variant="destructive" disabled={isLoading || !coupons || coupons.length === 0 || !!isDeleting}>
              {isDeleting === true ? <Loader2 className="mr-2 h-4 w-4 animate-spin"/> : <Trash2 className="mr-2 h-4 w-4" />}
              {isDeleting === true ? 'Excluindo...' : 'Excluir Todos'}
            </Button>
          </AlertDialogTrigger>
          <AlertDialogContent>
            <AlertDialogHeader>
              <AlertDialogTitle>Você tem certeza absoluta?</AlertDialogTitle>
              <AlertDialogDescription>
                Essa ação não pode ser desfeita. Isso excluirá permanentemente 
                todos os {coupons?.length} cupons do banco de dados.
              </AlertDialogDescription>
            </AlertDialogHeader>
            <AlertDialogFooter>
              <AlertDialogCancel>Cancelar</AlertDialogCancel>
              <AlertDialogAction onClick={handleDeleteAll}>Continuar</AlertDialogAction>
            </AlertDialogFooter>
          </AlertDialogContent>
        </AlertDialog>
      </CardHeader>
      <CardContent className="p-0">
        <div className="overflow-x-auto">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead className="font-bold">Cupom</TableHead>
                <TableHead className="font-bold">Nome</TableHead>
                <TableHead className="font-bold">CPF</TableHead>
                <TableHead className="font-bold">Nº da Compra</TableHead>
                <TableHead className="font-bold text-right">Valor (R$)</TableHead>
                <TableHead className="text-center font-bold">
                  Data de Cadastro
                </TableHead>
                <TableHead className="text-right font-bold">Ações</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {isLoading && (
                <TableRow>
                  <TableCell
                    colSpan={7}
                    className="text-center h-24 text-muted-foreground"
                  >
                    Carregando cupons...
                  </TableCell>
                </TableRow>
              )}
              {!isLoading && coupons && coupons.length > 0 ? (
                coupons.map((coupon) => (
                  <TableRow key={coupon.id}>
                    <TableCell className="font-medium">
                      {coupon.couponNumber}
                    </TableCell>
                    <TableCell>{coupon.fullName}</TableCell>
                    <TableCell>
                      {coupon.cpf.replace(
                        /(\d{3})(\d{3})(\d{3})(\d{2})/,
                        '$1.$2.$3-$4'
                      )}
                    </TableCell>
                    <TableCell>{coupon.purchaseNumber}</TableCell>
                     <TableCell className="text-right">
                      {coupon.purchaseValue?.toLocaleString('pt-BR', { minimumFractionDigits: 2, maximumFractionDigits: 2 }) ?? 'N/A'}
                    </TableCell>
                    <TableCell className="text-center">
                      {coupon.registrationDate
                        ? format(
                            new Date(coupon.registrationDate.seconds * 1000),
                            'dd/MM/yyyy HH:mm'
                          )
                        : 'N/A'}
                    </TableCell>
                    <TableCell className="text-right">
                       <AlertDialog>
                          <AlertDialogTrigger asChild>
                             <Button variant="ghost" size="icon" disabled={!!isDeleting}>
                                {isDeleting === coupon.id ? <Loader2 className="h-4 w-4 animate-spin"/> : <Trash2 className="h-4 w-4 text-destructive"/>}
                                <span className="sr-only">Excluir</span>
                            </Button>
                          </AlertDialogTrigger>
                          <AlertDialogContent>
                            <AlertDialogHeader>
                              <AlertDialogTitle>Você tem certeza?</AlertDialogTitle>
                              <AlertDialogDescription>
                                Essa ação não pode ser desfeita. Isso excluirá permanentemente o cupom <span className="font-bold">{coupon.couponNumber}</span> de <span className="font-bold">{coupon.fullName}</span>.
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
                    <TableCell
                      colSpan={7}
                      className="text-center h-24 text-muted-foreground"
                    >
                      Nenhum cupom gerado ainda.
                    </TableCell>
                  </TableRow>
                )
              )}
            </TableBody>
          </Table>
        </div>
      </CardContent>
    </Card>
  );
}
