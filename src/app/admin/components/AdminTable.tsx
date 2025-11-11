import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";

type Coupon = {
  id: string;
  nome: string;
  cpf: string;
  numeroCompra: string;
  numeroCupom: string;
  dataCadastro: string;
};

type AdminTableProps = {
  coupons: Coupon[];
};

export function AdminTable({ coupons }: AdminTableProps) {
  return (
    <Card>
      <CardHeader>
        <CardTitle>Total de Cupons: {coupons.length}</CardTitle>
        <CardDescription>Lista de todos os cupons registrados no sistema.</CardDescription>
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
                <TableHead className="text-right font-bold">Data de Cadastro</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {coupons.length > 0 ? (
                coupons.map((coupon) => (
                  <TableRow key={coupon.id}>
                    <TableCell className="font-medium">{coupon.numeroCupom}</TableCell>
                    <TableCell>{coupon.nome}</TableCell>
                    <TableCell>{coupon.cpf.replace(/(\d{3})(\d{3})(\d{3})(\d{2})/, "$1.$2.$3-$4")}</TableCell>
                    <TableCell>{coupon.numeroCompra}</TableCell>
                    <TableCell className="text-right">{coupon.dataCadastro}</TableCell>
                  </TableRow>
                ))
              ) : (
                <TableRow>
                  <TableCell colSpan={5} className="text-center h-24 text-muted-foreground">
                    Nenhum cupom gerado ainda.
                  </TableCell>
                </TableRow>
              )}
            </TableBody>
          </Table>
        </div>
      </CardContent>
    </Card>
  );
}
