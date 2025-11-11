'use client';
import Link from 'next/link';
import { Logo } from './Logo';
import { Settings } from 'lucide-react';
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from '@/components/ui/tooltip';

export function Header() {
  return (
    <header className="bg-card shadow-sm">
      <div className="container mx-auto flex flex-col items-center justify-center p-4 text-center">
        <Link href="/">
          <Logo className="h-10 md:h-12 w-auto" />
        </Link>
        <h1 className="text-xl md:text-2xl font-bold text-foreground font-headline mt-2">
          Supermoda Sorteios
        </h1>
        <nav className="mt-4 flex items-center gap-4 text-sm md:text-base text-muted-foreground">
          <Link href="/" className="hover:text-primary hover:underline">
            Início
          </Link>
          <Link href="/meus-cupons" className="hover:text-primary hover:underline">
            Meus Cupons
          </Link>
          <TooltipProvider>
            <Tooltip>
              <TooltipTrigger asChild>
                <Link
                  href="/admin/login"
                  className="hover:text-primary"
                  aria-label="Painel Administrativo"
                >
                  <Settings className="h-5 w-5" />
                </Link>
              </TooltipTrigger>
              <TooltipContent>
                <p>Painel Administrativo</p>
              </TooltipContent>
            </Tooltip>
          </TooltipProvider>
        </nav>
      </div>
    </header>
  );
}
