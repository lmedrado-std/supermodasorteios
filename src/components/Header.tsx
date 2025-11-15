'use client';
import Link from 'next/link';
import { Logo } from './Logo';
import { Settings, BookOpen, Sparkles, ChevronDown } from 'lucide-react';
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from '@/components/ui/tooltip';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import { Button } from './ui/button';

export function Header() {
  return (
    <header className="bg-card shadow-sm sticky top-0 z-50">
      <div className="container mx-auto flex items-center justify-between p-4">
         <Link href="/">
          <Logo className="h-12 md:h-14 w-auto" />
        </Link>
        
        <nav className="flex items-center gap-0 md:gap-2 text-sm text-muted-foreground">
          <Link href="/" className="hover:text-primary hover:underline px-1 sm:px-2">
            Início
          </Link>
           <DropdownMenu>
            <DropdownMenuTrigger asChild>
               <Button variant="ghost" className="hover:text-primary hover:bg-transparent text-sm text-muted-foreground font-normal px-1 sm:px-2">
                Minhas Promoções
                <ChevronDown className="relative top-[1px] ml-1 h-3 w-3 transition duration-200 group-data-[state=open]:rotate-180" />
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="start">
              <DropdownMenuItem asChild>
                <Link href="/meus-cupons">Cupons de Sorteio</Link>
              </DropdownMenuItem>
              <DropdownMenuItem asChild>
                <Link href="/raspadinhas">Raspadinhas</Link>
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
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
