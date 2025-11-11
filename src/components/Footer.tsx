import Link from "next/link";

export function Footer() {
  return (
    <footer className="mt-12 py-6 text-center text-sm text-muted-foreground">
      <div className="container mx-auto flex flex-col items-center justify-center gap-2">
        <p>Supermoda - Promoção Válida, para Clientes cadastrados. Boa Sorte !</p>
        <Link href="/regulamento" className="text-primary hover:underline">
          Consulte o Regulamento
        </Link>
      </div>
    </footer>
  );
}
