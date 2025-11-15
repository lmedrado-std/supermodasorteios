'use client';
import Link from 'next/link';
import { Logo } from './Logo';
import { Settings, BookOpen, Sparkles, ChevronDown, Menu, Ticket, Home, FileText } from 'lucide-react';
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
import {
  Sheet,
  SheetContent,
  SheetTrigger,
} from "@/components/ui/sheet"
import { Separator } from './ui/separator';
import { useState } from 'react';

export function Header() {
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  
  return (
    <header className="bg-card shadow-sm sticky top-0 z-50">
      <div className="container mx-auto flex items-center justify-between p-4">
         <Link href="/">
          <Logo className="h-12 md:h-14 w-auto" />
        </Link>
        
        {/* Desktop Menu */}
        <nav className="hidden md:flex items-center gap-2 text-sm text-muted-foreground">
          <Button variant="ghost" asChild>
            <Link href="/">Início</Link>
          </Button>
           <DropdownMenu>
            <DropdownMenuTrigger asChild>
               <Button variant="ghost">
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
          <Button variant="ghost" asChild>
            <Link href="/regulamento">Regulamento</Link>
          </Button>
          <TooltipProvider>
            <Tooltip>
              <TooltipTrigger asChild>
                <Button variant="ghost" size="icon" asChild>
                  <Link href="/admin/login" aria-label="Painel Administrativo">
                    <Settings className="h-5 w-5" />
                  </Link>
                </Button>
              </TooltipTrigger>
              <TooltipContent>
                <p>Painel Administrativo</p>
              </TooltipContent>
            </Tooltip>
          </TooltipProvider>
        </nav>

        {/* Mobile Menu */}
        <div className="md:hidden">
          <Sheet open={isMobileMenuOpen} onOpenChange={setIsMobileMenuOpen}>
            <SheetTrigger asChild>
              <Button variant="ghost" size="icon">
                <Menu className="h-6 w-6" />
                <span className="sr-only">Abrir menu</span>
              </Button>
            </SheetTrigger>
            <SheetContent side="right">
              <div className="flex flex-col gap-4 py-6">
                 <Link href="/" onClick={() => setIsMobileMenuOpen(false)} className='mb-4'>
                    <Logo className="h-14 w-auto" />
                </Link>
                <Separator />
                <Button variant="ghost" className="justify-start text-base" asChild>
                    <Link href="/" onClick={() => setIsMobileMenuOpen(false)}><Home className='mr-2'/> Início</Link>
                </Button>
                 <Button variant="ghost" className="justify-start text-base" asChild>
                    <Link href="/meus-cupons" onClick={() => setIsMobileMenuOpen(false)}><Ticket className='mr-2'/> Cupons de Sorteio</Link>
                </Button>
                 <Button variant="ghost" className="justify-start text-base" asChild>
                    <Link href="/raspadinhas" onClick={() => setIsMobileMenuOpen(false)}><Sparkles className='mr-2'/> Raspadinhas</Link>
                </Button>
                <Button variant="ghost" className="justify-start text-base" asChild>
                    <Link href="/regulamento" onClick={() => setIsMobileMenuOpen(false)}><FileText className='mr-2'/> Regulamento</Link>
                </Button>
                <Separator />
                 <Button variant="outline" className="justify-start text-base" asChild>
                    <Link href="/admin/login" onClick={() => setIsMobileMenuOpen(false)}><Settings className='mr-2'/> Painel Admin</Link>
                </Button>
              </div>
            </SheetContent>
          </Sheet>
        </div>

      </div>
    </header>
  );
}
