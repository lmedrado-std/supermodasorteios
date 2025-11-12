'use client';
import Link from 'next/link';
import { Logo } from './Logo';
import { Settings, BookOpen } from 'lucide-react';
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from '@/components/ui/tooltip';

export function Header() {
  return (
    <header className="bg-card shadow-sm sticky top-0 z-50">
      <div className="container mx-auto flex items-center justify-between p-4">
         <Link href="/">
          <Logo className="h-10 md:h-12 w-auto" />
        </Link>
        
        <nav className="flex items-center gap-0 md:gap-2 text-sm text-muted-foreground">
          <Link href="/" className="hover:text-primary hover:underline px-1 sm:px-2">
            Início
          </Link>
          <Link href="/meus-cupons" className="hover:text-primary hover:underline px-1 sm:px-2">
            Meus Cupons
          </Link>
           <Link href="/regulamento" className="hover:text-primary hover:underline px-1 sm:px-2 flex items-center gap-1">
            Regulamento
          </Link>
          <TooltipProvider>
            <Tooltip>
              <TooltipTrigger asChild>
                <Link
                  href="/admin/login"
                  className="hover:text-primary hidden md:flex"
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
