'use client';
import { useState } from 'react';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
  DialogClose,
} from '@/components/ui/dialog';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from '@/components/ui/alert-dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { MoreVertical, LogOut, KeyRound, Eye, EyeOff } from 'lucide-react';
import { Auth, User, updatePassword } from 'firebase/auth';
import { useToast } from '@/hooks/use-toast';

interface AdminMenuProps {
  user: User;
  auth: Auth;
  onLogout: () => void;
}

export default function AdminMenu({ user, auth, onLogout }: AdminMenuProps) {
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [isAlertOpen, setIsAlertOpen] = useState(false);
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [isUpdating, setIsUpdating] = useState(false);
  const [showNewPassword, setShowNewPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const { toast } = useToast();
  
  const resetState = () => {
    setNewPassword('');
    setConfirmPassword('');
    setIsUpdating(false);
    setShowNewPassword(false);
    setShowConfirmPassword(false);
  };

  const handleOpenChange = (open: boolean) => {
    setIsDialogOpen(open);
    if (!open) {
      resetState();
    }
  };

  const handlePasswordUpdate = async () => {
    setIsAlertOpen(false); // Fecha o alerta
    const currentUser = auth.currentUser;

    if (!currentUser) {
       toast({
            variant: 'destructive',
            title: 'Erro de Autenticação',
            description: 'Sessão de usuário inválida. Por favor, faça login novamente.',
        });
      return;
    }

    setIsUpdating(true);
    
    try {
        await updatePassword(currentUser, newPassword);

        toast({
            title: 'Sucesso!',
            description: 'Sua senha foi alterada.',
        });
        handleOpenChange(false);

    } catch (error: any) {
      let description = 'Ocorreu um erro. Tente novamente.';
       if (error.code === 'auth/requires-recent-login') {
        description = 'Esta operação é sensível e requer autenticação recente. Por favor, faça login novamente antes de tentar alterar a senha.';
      } else if (error.code === 'auth/weak-password') {
        description = 'A senha fornecida é muito fraca.';
      }
      toast({
        variant: 'destructive',
        title: 'Erro ao alterar a senha',
        description,
      });
    } finally {
      setIsUpdating(false);
    }
  };
  
  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (newPassword.length < 6) {
        toast({
            variant: 'destructive',
            title: 'Senha muito curta',
            description: 'A nova senha deve ter no mínimo 6 caracteres.',
        });
        return;
    }
    
    if (newPassword !== confirmPassword) {
        toast({
            variant: 'destructive',
            title: 'Senhas não coincidem',
            description: 'Os campos de nova senha e confirmação devem ser iguais.',
        });
        return;
    }

    setIsAlertOpen(true); // Abre o alerta de confirmação
  };

  return (
    <>
      <DropdownMenu>
        <DropdownMenuTrigger asChild>
          <Button variant="ghost" size="icon">
            <MoreVertical className="h-5 w-5" />
            <span className="sr-only">Abrir menu</span>
          </Button>
        </DropdownMenuTrigger>
        <DropdownMenuContent align="end">
          <DropdownMenuLabel>Menu</DropdownMenuLabel>
          <DropdownMenuSeparator />
          <DropdownMenuItem onSelect={() => handleOpenChange(true)}>
            <KeyRound className="mr-2 h-4 w-4" />
            <span>Alterar Senha</span>
          </DropdownMenuItem>
          <DropdownMenuItem onSelect={onLogout}>
            <LogOut className="mr-2 h-4 w-4" />
            <span>Sair</span>
          </DropdownMenuItem>
        </DropdownMenuContent>
      </DropdownMenu>

      <Dialog open={isDialogOpen} onOpenChange={handleOpenChange}>
        <DialogContent className="sm:max-w-[425px]">
          <DialogHeader>
            <DialogTitle>Alterar Senha</DialogTitle>
            <DialogDescription>
              Digite a nova senha e confirme. A senha deve ter no mínimo 6 caracteres.
            </DialogDescription>
          </DialogHeader>
          <form onSubmit={handleSubmit}>
            <div className="grid gap-4 py-4">
               <div className="space-y-2">
                <Label htmlFor="new-password">
                  Nova Senha
                </Label>
                 <div className="relative">
                    <Input
                        id="new-password"
                        type={showNewPassword ? "text" : "password"}
                        value={newPassword}
                        onChange={(e) => setNewPassword(e.target.value)}
                        required
                    />
                    <Button
                        type="button"
                        variant="ghost"
                        size="icon"
                        className="absolute inset-y-0 right-0 h-full px-3"
                        onClick={() => setShowNewPassword(!showNewPassword)}
                    >
                        {showNewPassword ? <EyeOff /> : <Eye />}
                         <span className="sr-only">{showNewPassword ? 'Ocultar' : 'Mostrar'} senha</span>
                    </Button>
                </div>
              </div>
              <div className="space-y-2">
                <Label htmlFor="confirm-password">
                  Confirmar Nova Senha
                </Label>
                 <div className="relative">
                    <Input
                        id="confirm-password"
                        type={showConfirmPassword ? "text" : "password"}
                        value={confirmPassword}
                        onChange={(e) => setConfirmPassword(e.target.value)}
                        required
                    />
                    <Button
                        type="button"
                        variant="ghost"
                        size="icon"
                        className="absolute inset-y-0 right-0 h-full px-3"
                        onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                    >
                        {showConfirmPassword ? <EyeOff /> : <Eye />}
                         <span className="sr-only">{showConfirmPassword ? 'Ocultar' : 'Mostrar'} senha</span>
                    </Button>
                </div>
              </div>
            </div>
            <DialogFooter>
              <DialogClose asChild>
                <Button type="button" variant="secondary">Cancelar</Button>
              </DialogClose>
              <Button type="submit" disabled={isUpdating}>
                {isUpdating ? 'Salvando...' : 'Salvar Alterações'}
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>
      
      <AlertDialog open={isAlertOpen} onOpenChange={setIsAlertOpen}>
          <AlertDialogContent>
            <AlertDialogHeader>
              <AlertDialogTitle>Você tem certeza?</AlertDialogTitle>
              <AlertDialogDescription>
                Esta ação irá alterar sua senha de acesso ao painel administrativo. Você confirma esta alteração?
              </AlertDialogDescription>
            </AlertDialogHeader>
            <AlertDialogFooter>
              <AlertDialogCancel>Cancelar</AlertDialogCancel>
              <AlertDialogAction onClick={handlePasswordUpdate}>Sim, Alterar Senha</AlertDialogAction>
            </AlertDialogFooter>
          </AlertDialogContent>
        </AlertDialog>
    </>
  );
}

    