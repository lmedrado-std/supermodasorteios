'use client';
import Link from 'next/link';
import { Logo } from './Logo';
import { Settings, BookOpen, Sparkles, ChevronDown, Menu, Ticket, Home, FileText } from 'lucide-react';
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
  SheetTitle,
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
           <Button variant="ghost" asChild>
             <Link href="/admin/login">Painel Admin</Link>
          </Button>
        </nav>

        {/* Mobile Menu */}
        <div className="md:hidden">
          <Sheet open={isMobileMenuOpen} onOpenChange={setIsMobileMenuOpen}>
            <SheetTrigger asChild>
              <Button variant="ghost" size="icon" className="relative">
                <Menu className="h-6 w-6" />
                <span className="absolute top-1 right-1 w-2.5 h-2.5 bg-yellow-400 rounded-full animate-pulse"></span>
                <span className="sr-only">Abrir menu</span>
              </Button>
            </SheetTrigger>
            <SheetContent side="right">
               <SheetTitle className="sr-only">Menu de Navegação</SheetTitle>
              <div className="flex flex-col gap-2 py-6">
                 <Link href="/" onClick={() => setIsMobileMenuOpen(false)} className='mb-4'>
                    <Logo className="h-14 w-auto" />
                </Link>
                <Separator />
                <Button variant="ghost" className="justify-start text-base py-6" asChild>
                    <Link href="/" onClick={() => setIsMobileMenuOpen(false)}><Home className='mr-3'/> Início</Link>
                </Button>
                 <Button variant="ghost" className="justify-start text-base py-6" asChild>
                    <Link href="/meus-cupons" onClick={() => setIsMobileMenuOpen(false)}><Ticket className='mr-3'/> Cupons de Sorteio</Link>
                </Button>
                 <Button variant="ghost" className="justify-start text-base py-6" asChild>
                    <Link href="/raspadinhas" onClick={() => setIsMobileMenuOpen(false)}><Sparkles className='mr-3'/> Raspadinhas</Link>
                </Button>
                <Button variant="ghost" className="justify-start text-base py-6" asChild>
                    <Link href="/regulamento" onClick={() => setIsMobileMenuOpen(false)}><FileText className='mr-3'/> Regulamento</Link>
                </Button>
              </div>
            </SheetContent>
          </Sheet>
        </div>

      </div>
    </header>
  );
}
