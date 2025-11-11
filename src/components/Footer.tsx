import Link from "next/link";

export function Footer() {
  return (
    <footer className="mt-12 py-6 text-center text-sm text-muted-foreground">
      <div className="container mx-auto">
        <div className="flex justify-center gap-4 mb-2">
            <Link href="/" className="hover:underline">Início</Link>
            <Link href="/meus-cupons" className="hover:underline">Meus Cupons</Link>
            <Link href="/admin" className="hover:underline">Admin</Link>
        </div>
        <p>Supermoda - Promoção Válida, para Clientes cadastrados. Boa Sorte !</p>
      </div>
    </footer>
  );
}
