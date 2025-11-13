import { useState, useEffect } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { useAuth } from '@/contexts/AuthContext';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';
import { Profile } from '@/types';
import { User, Briefcase } from 'lucide-react';

interface ProfileModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export const ProfileModal = ({ open, onOpenChange }: ProfileModalProps) => {
  const { user } = useAuth();
  const [loading, setLoading] = useState(false);
  const [profile, setProfile] = useState<Profile | null>(null);
  const [nomeCompleto, setNomeCompleto] = useState('');
  const [cargo, setCargo] = useState('');

  useEffect(() => {
    if (open && user) {
      fetchProfile();
    }
  }, [open, user]);

  const fetchProfile = async () => {
    if (!user) return;

    const { data, error } = await supabase
      .from('profiles')
      .select('*')
      .eq('id', user.id)
      .maybeSingle();

    if (error) {
      console.error('Erro ao carregar perfil:', error);
      return;
    }

    if (data) {
      setProfile(data);
      setNomeCompleto(data.nome_completo || '');
      setCargo(data.cargo || '');
    }
  };

  const handleSave = async () => {
    if (!user) return;

    setLoading(true);

    const { error } = await supabase
      .from('profiles')
      .update({
        nome_completo: nomeCompleto,
        cargo: cargo || null,
      })
      .eq('id', user.id);

    if (error) {
      toast.error('Erro ao atualizar perfil');
      console.error('Erro:', error);
    } else {
      toast.success('Perfil atualizado com sucesso!');
      onOpenChange(false);
    }

    setLoading(false);
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[500px]">
        <DialogHeader>
          <DialogTitle>Editar Perfil</DialogTitle>
        </DialogHeader>

        <div className="space-y-4 py-4">
          <div className="space-y-2">
            <Label htmlFor="email">Email</Label>
            <Input
              id="email"
              value={user?.email || ''}
              disabled
              className="bg-muted"
            />
            <p className="text-xs text-muted-foreground">
              O email não pode ser alterado
            </p>
          </div>

          <div className="space-y-2">
            <Label htmlFor="nome">Nome Completo</Label>
            <div className="relative">
              <User className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <Input
                id="nome"
                value={nomeCompleto}
                onChange={(e) => setNomeCompleto(e.target.value)}
                placeholder="Seu nome completo"
                className="pl-10"
              />
            </div>
          </div>

          <div className="space-y-2">
            <Label htmlFor="cargo">Cargo</Label>
            <div className="relative">
              <Briefcase className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <Input
                id="cargo"
                value={cargo}
                onChange={(e) => setCargo(e.target.value)}
                placeholder="Ex: Corretor de Imóveis"
                className="pl-10"
              />
            </div>
          </div>
        </div>

        <div className="flex gap-2 justify-end">
          <Button
            variant="outline"
            onClick={() => onOpenChange(false)}
            disabled={loading}
          >
            Cancelar
          </Button>
          <Button onClick={handleSave} disabled={loading}>
            {loading ? 'Salvando...' : 'Salvar'}
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
};
