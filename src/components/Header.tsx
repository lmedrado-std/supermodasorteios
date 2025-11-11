import Link from 'next/link';
import { Logo } from './Logo';

export function Header() {
  return (
    <header className="bg-card shadow-sm">
      <div className="container mx-auto flex items-center justify-between p-4">
        <Link href="/">
          <Logo className="h-8 md:h-10 w-auto" />
        </Link>
        <h1 className="text-xl md:text-2xl font-bold text-foreground font-headline">
          Supermoda Sorteios
        </h1>
      </div>
    </header>
  );
}
