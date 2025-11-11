'use client';
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
import { useCollection, useFirestore, useMemoFirebase } from '@/firebase';
import { collection, query, orderBy } from 'firebase/firestore';
import { format } from 'date-fns';

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

  const winnersQuery = useMemoFirebase(
    () =>
      firestore
        ? query(collection(firestore, 'winners'), orderBy('drawDate', 'desc'))
        : null,
    [firestore]
  );

  const { data: winners, isLoading } = useCollection<Winner>(winnersQuery);

  return (
    <Card>
      <CardHeader>
        <CardTitle>Histórico de Ganhadores</CardTitle>
        <CardDescription>
          Lista de todos os ganhadores dos sorteios realizados.
        </CardDescription>
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
              </TableRow>
            </TableHeader>
            <TableBody>
              {isLoading && (
                <TableRow>
                  <TableCell
                    colSpan={4}
                    className="text-center h-24 text-muted-foreground"
                  >
                    Carregando histórico...
                  </TableCell>
                </TableRow>
              )}
              {!isLoading && winners && winners.length > 0 ? (
                winners.map((winner) => (
                  <TableRow key={winner.id}>
                    <TableCell className="text-center">
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
                  </TableRow>
                ))
              ) : (
                !isLoading && (
                  <TableRow>
                    <TableCell
                      colSpan={4}
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
