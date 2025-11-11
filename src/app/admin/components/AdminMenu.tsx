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
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { MoreVertical, LogOut, KeyRound } from 'lucide-react';
import { Auth, User, updatePassword, reauthenticateWithCredential, EmailAuthProvider } from 'firebase/auth';
import { useToast } from '@/hooks/use-toast';

interface AdminMenuProps {
  user: User;
  auth: Auth;
  onLogout: () => void;
}

export default function AdminMenu({ user, auth, onLogout }: AdminMenuProps) {
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [currentPassword, setCurrentPassword] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [isUpdating, setIsUpdating] = useState(false);
  const { toast } = useToast();
  
  const resetState = () => {
    setCurrentPassword('');
    setNewPassword('');
    setIsUpdating(false);
  };

  const handleOpenChange = (open: boolean) => {
    setIsDialogOpen(open);
    if (!open) {
      resetState();
    }
  };

  const handleChangePassword = async (e: React.FormEvent) => {
    e.preventDefault();
    const currentUser = auth.currentUser; // Use a fresh instance of the user

    if (!currentUser || !currentUser.email) {
       toast({
            variant: 'destructive',
            title: 'Erro de Autenticação',
            description: 'Sessão de usuário inválida. Por favor, faça login novamente.',
        });
      return;
    }

    if (newPassword.length < 6) {
        toast({
            variant: 'destructive',
            title: 'Senha muito curta',
            description: 'A nova senha deve ter no mínimo 6 caracteres.',
        });
        return;
    }
    
    if (currentPassword === newPassword) {
        toast({
            variant: 'destructive',
            title: 'Senha inválida',
            description: 'A nova senha deve ser diferente da senha atual.',
        });
        return;
    }

    setIsUpdating(true);
    
    try {
        const credential = EmailAuthProvider.credential(currentUser.email, currentPassword);
        await reauthenticateWithCredential(currentUser, credential);
        await updatePassword(currentUser, newPassword);

        toast({
            title: 'Sucesso!',
            description: 'Sua senha foi alterada.',
        });
        handleOpenChange(false);

    } catch (error: any) {
      let description = 'Ocorreu um erro. Tente novamente.';
      if (error.code === 'auth/wrong-password' || error.code === 'auth/invalid-credential') {
        description = 'A senha atual está incorreta.';
      } else if (error.code === 'auth/too-many-requests') {
        description = 'Muitas tentativas. Tente novamente mais tarde.';
      } else if (error.code === 'auth/user-mismatch') {
        description = 'Houve um problema com sua sessão. Tente fazer login novamente.';
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
              Digite sua senha atual e a nova senha desejada.
            </DialogDescription>
          </DialogHeader>
          <form onSubmit={handleChangePassword}>
            <div className="grid gap-4 py-4">
              <div className="grid grid-cols-4 items-center gap-4">
                <Label htmlFor="current-password" className="text-right">
                  Senha Atual
                </Label>
                <Input
                  id="current-password"
                  type="password"
                  value={currentPassword}
                  onChange={(e) => setCurrentPassword(e.target.value)}
                  className="col-span-3"
                  required
                />
              </div>
              <div className="grid grid-cols-4 items-center gap-4">
                <Label htmlFor="new-password" className="text-right">
                  Nova Senha
                </Label>
                <Input
                  id="new-password"
                  type="password"
                  value={newPassword}
                  onChange={(e) => setNewPassword(e.target.value)}
                  className="col-span-3"
                  required
                />
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
    </>
  );
}
