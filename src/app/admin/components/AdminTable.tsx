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

type Coupon = {
  id: string;
  fullName: string;
  cpf: string;
  purchaseNumber: string;
  couponNumber: string;
  registrationDate: {
    seconds: number;
    nanoseconds: number;
  };
};

export function AdminTable() {
  const firestore = useFirestore();

  const couponsQuery = useMemoFirebase(
    () =>
      firestore
        ? query(collection(firestore, 'coupons'), orderBy('registrationDate', 'desc'))
        : null,
    [firestore]
  );

  const { data: coupons, isLoading } = useCollection<Coupon>(couponsQuery);

  return (
    <Card>
      <CardHeader>
        <CardTitle>Total de Cupons: {coupons?.length ?? 0}</CardTitle>
        <CardDescription>
          Lista de todos os cupons registrados no sistema.
        </CardDescription>
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
                <TableHead className="text-right font-bold">
                  Data de Cadastro
                </TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {isLoading && (
                <TableRow>
                  <TableCell
                    colSpan={5}
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
                      {coupon.registrationDate
                        ? format(
                            new Date(coupon.registrationDate.seconds * 1000),
                            'dd/MM/yyyy HH:mm'
                          )
                        : 'N/A'}
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
