import { useState, useEffect } from 'react';
import type { Lead, Imovel } from '@/types';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Label } from '@/components/ui/label';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Button } from '@/components/ui/button';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';

interface LeadModalProps {
  lead: Lead;
  imovel?: Imovel;
  isOpen: boolean;
  onClose: () => void;
}

export const LeadModal = ({ lead, imovel, isOpen, onClose }: LeadModalProps) => {
  const [formData, setFormData] = useState({
    nome: lead.nome,
    telefone: lead.telefone,
    email: lead.email,
    observacoes: lead.observacoes || '',
  });

  useEffect(() => {
    setFormData({
      nome: lead.nome,
      telefone: lead.telefone,
      email: lead.email,
      observacoes: lead.observacoes || '',
    });
  }, [lead]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    try {
      const { error } = await supabase
        .from('leads')
        .update(formData)
        .eq('id', lead.id);

      if (error) throw error;

      toast.success('Lead atualizado com sucesso!');
      onClose();
      window.location.reload();
    } catch (error: any) {
      toast.error(error.message || 'Erro ao atualizar lead');
    }
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-md">
        <DialogHeader>
          <DialogTitle>Editar Lead</DialogTitle>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <Label>Imóvel</Label>
            <Input
              value={imovel?.codigo || 'Carregando...'}
              disabled
              className="bg-muted"
            />
          </div>

          <div>
            <Label htmlFor="nome">Nome</Label>
            <Input
              id="nome"
              value={formData.nome}
              onChange={(e) => setFormData({ ...formData, nome: e.target.value })}
              required
            />
          </div>

          <div>
            <Label htmlFor="telefone">Telefone</Label>
            <Input
              id="telefone"
              value={formData.telefone}
              onChange={(e) => setFormData({ ...formData, telefone: e.target.value })}
              required
            />
          </div>

          <div>
            <Label htmlFor="email">E-mail</Label>
            <Input
              id="email"
              type="email"
              value={formData.email}
              onChange={(e) => setFormData({ ...formData, email: e.target.value })}
              required
            />
          </div>

          <div>
            <Label htmlFor="observacoes">Observações</Label>
            <Textarea
              id="observacoes"
              value={formData.observacoes}
              onChange={(e) => setFormData({ ...formData, observacoes: e.target.value })}
              rows={3}
            />
          </div>

          <div className="flex gap-2 justify-end">
            <Button type="button" variant="outline" onClick={onClose}>
              Cancelar
            </Button>
            <Button type="submit">
              Salvar
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
};