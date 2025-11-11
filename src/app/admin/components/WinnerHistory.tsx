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
import { collection, query, orderBy, doc, deleteDoc, writeBatch } from 'firebase/firestore';
import { format } from 'date-fns';
import { Button } from '@/components/ui/button';
import { useToast } from '@/hooks/use-toast';
import { Loader2, Trash2 } from 'lucide-react';

type Winner = {
  id: string;
  fullName: string;
  cpf: string;
  couponNumber: string;
  drawDate: {
    seconds: number;
    nanoseconds: number;
  };
};

export function WinnerHistory() {
  const firestore = useFirestore();
  const { toast } = useToast();
  const [isDeleting, setIsDeleting] = useState<string | boolean>(false);

  const winnersQuery = useMemoFirebase(
    () =>
      firestore
        ? query(collection(firestore, 'winners'), orderBy('drawDate', 'desc'))
        : null,
    [firestore]
  );

  const { data: winners, isLoading } = useCollection<Winner>(winnersQuery);

  const handleDelete = async (winnerId: string) => {
    if (!firestore) return;
    setIsDeleting(winnerId);
    try {
      await deleteDoc(doc(firestore, 'winners', winnerId));
      toast({
        title: 'Sucesso!',
        description: 'Registro do ganhador foi excluído.',
      });
    } catch (error) {
      console.error("Error deleting winner: ", error);
      toast({
        variant: 'destructive',
        title: 'Erro ao excluir',
        description: 'Não foi possível excluir o registro. Tente novamente.',
      });
    } finally {
      setIsDeleting(false);
    }
  };

  const handleDeleteAll = async () => {
    if (!firestore || !winners || winners.length === 0) return;
    setIsDeleting(true);
    try {
      const batchSize = 500;
      for (let i = 0; i < winners.length; i += batchSize) {
        const batch = writeBatch(firestore);
        const chunk = winners.slice(i, i + batchSize);
        chunk.forEach(winner => {
          const winnerRef = doc(firestore, 'winners', winner.id);
          batch.delete(winnerRef);
        });
        await batch.commit();
      }
      toast({
        title: 'Sucesso!',
        description: `Todo o histórico de ${winners.length} ganhador(es) foi excluído.`,
      });
    } catch (error) {
       console.error("Error deleting all winners: ", error);
       toast({
        variant: 'destructive',
        title: 'Erro ao excluir tudo',
        description: 'Não foi possível excluir o histórico. Tente novamente.',
      });
    } finally {
      setIsDeleting(false);
    }
  };

  return (
    <Card>
      <CardHeader className="flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
        <div>
          <CardTitle>Histórico de Ganhadores</CardTitle>
          <CardDescription>
            Lista de todos os ganhadores dos sorteios realizados.
          </CardDescription>
        </div>
        <AlertDialog>
          <AlertDialogTrigger asChild>
            <Button variant="destructive" disabled={isLoading || !winners || winners.length === 0 || !!isDeleting} className="w-full md:w-auto">
              {isDeleting === true ? <Loader2 className="mr-2 h-4 w-4 animate-spin"/> : <Trash2 className="mr-2 h-4 w-4" />}
              {isDeleting === true ? 'Excluindo...' : 'Excluir Histórico'}
            </Button>
          </AlertDialogTrigger>
          <AlertDialogContent>
            <AlertDialogHeader>
              <AlertDialogTitle>Você tem certeza absoluta?</AlertDialogTitle>
              <AlertDialogDescription>
                Essa ação não pode ser desfeita. Isso excluirá permanentemente 
                todo o histórico de {winners?.length} ganhador(es) do banco de dados.
              </AlertDialogDescription>
            </AlertDialogHeader>
            <AlertDialogFooter>
              <AlertDialogCancel>Cancelar</AlertDialogCancel>
              <AlertDialogAction onClick={handleDeleteAll}>Continuar e Excluir</AlertDialogAction>
            </AlertDialogFooter>
          </AlertDialogContent>
        </AlertDialog>
      </CardHeader>
      <CardContent className="p-0">
        <div className="overflow-x-auto">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead className="font-bold">Data do Sorteio</TableHead>
                <TableHead className="font-bold">Cupom</TableHead>
                <TableHead className="font-bold">Nome do Ganhador</TableHead>
                <TableHead className="font-bold">CPF</TableHead>
                <TableHead className="font-bold text-right">Ações</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {isLoading && (
                <TableRow>
                  <TableCell
                    colSpan={5}
                    className="text-center h-24 text-muted-foreground"
                  >
                    Carregando histórico...
                  </TableCell>
                </TableRow>
              )}
              {!isLoading && winners && winners.length > 0 ? (
                winners.map((winner) => (
                  <TableRow key={winner.id}>
                    <TableCell>
                      {winner.drawDate
                        ? format(
                            new Date(winner.drawDate.seconds * 1000),
                            'dd/MM/yyyy HH:mm'
                          )
                        : 'N/A'}
                    </TableCell>
                    <TableCell className="font-medium">
                      {winner.couponNumber}
                    </TableCell>
                    <TableCell>{winner.fullName}</TableCell>
                    <TableCell>
                      {winner.cpf.replace(
                        /(\d{3})(\d{3})(\d{3})(\d{2})/,
                        '$1.$2.$3-$4'
                      )}
                    </TableCell>
                    <TableCell className="text-right">
                       <AlertDialog>
                          <AlertDialogTrigger asChild>
                             <Button variant="ghost" size="icon" disabled={!!isDeleting}>
                                {isDeleting === winner.id ? <Loader2 className="h-4 w-4 animate-spin"/> : <Trash2 className="h-4 w-4 text-destructive"/>}
                                <span className="sr-only">Excluir</span>
                            </Button>
                          </AlertDialogTrigger>
                          <AlertDialogContent>
                            <AlertDialogHeader>
                              <AlertDialogTitle>Confirmar Exclusão</AlertDialogTitle>
                              <AlertDialogDescription>
                                Essa ação não pode ser desfeita. Isso excluirá permanentemente o registro do ganhador <span className="font-bold">{winner.fullName}</span> (Cupom: {winner.couponNumber}).
                              </AlertDialogDescription>
                            </AlertDialogHeader>
                            <AlertDialogFooter>
                              <AlertDialogCancel>Cancelar</AlertDialogCancel>
                              <AlertDialogAction onClick={() => handleDelete(winner.id)}>Excluir</AlertDialogAction>
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
                      colSpan={5}
                      className="text-center h-24 text-muted-foreground"
                    >
                      Nenhum sorteio foi realizado ainda.
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
