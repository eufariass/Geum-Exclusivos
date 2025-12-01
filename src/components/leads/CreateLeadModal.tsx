import { useState, useEffect } from 'react';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { ScrollArea } from '@/components/ui/scroll-area';
import type { Imovel, PipelineStage } from '@/types';
import { leadsService } from '@/services/leads.service';
import { supabase } from '@/integrations/supabase/client';
import { Loader2 } from 'lucide-react';
import { toast } from 'sonner';

interface CreateLeadModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess: () => void;
}

export const CreateLeadModal = ({ isOpen, onClose, onSuccess }: CreateLeadModalProps) => {
  const [loading, setLoading] = useState(false);
  const [imoveis, setImoveis] = useState<Imovel[]>([]);
  const [loadingImoveis, setLoadingImoveis] = useState(true);
  const [stages, setStages] = useState<PipelineStage[]>([]);
  const [stageId, setStageId] = useState('');

  // Form state
  const [nome, setNome] = useState('');
  const [telefone, setTelefone] = useState('');
  const [email, setEmail] = useState('');
  const [tipoInteresse, setTipoInteresse] = useState<'Venda' | 'Locação'>('Venda');
  const [imovelId, setImovelId] = useState('');
  const [observacoes, setObservacoes] = useState('');

  useEffect(() => {
    if (isOpen) {
      loadImoveis();
      loadStages();
      resetForm();
    }
  }, [isOpen]);

  const resetForm = () => {
    setNome('');
    setTelefone('');
    setEmail('');
    setTipoInteresse('Venda');
    setImovelId('');
    setObservacoes('');
  };

  const loadImoveis = async () => {
    try {
      setLoadingImoveis(true);
      const { data, error } = await supabase
        .from('imoveis')
        .select('id, codigo, endereco, tipos_disponiveis')
        .order('created_at', { ascending: false })
        .limit(100);

      if (error) throw error;
      setImoveis((data || []) as Imovel[]);
    } catch (error) {
      console.error('Error loading imoveis:', error);
      toast.error('Erro ao carregar imóveis');
    } finally {
      setLoadingImoveis(false);
    }
  };

  const loadStages = async () => {
    try {
      const { data, error } = await supabase
        .from('lead_pipeline_stages')
        .select('*')
        .order('order_index', { ascending: true });

      if (error) throw error;
      setStages(data || []);
      
      // Pré-selecionar primeiro estágio
      if (data && data.length > 0) {
        setStageId(data[0].id);
      }
    } catch (error) {
      console.error('Error loading stages:', error);
      toast.error('Erro ao carregar estágios');
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!nome.trim()) {
      toast.error('Nome é obrigatório');
      return;
    }

    if (!telefone.trim()) {
      toast.error('Telefone é obrigatório');
      return;
    }

    if (!email.trim()) {
      toast.error('E-mail é obrigatório');
      return;
    }

    if (!imovelId) {
      toast.error('Imóvel é obrigatório');
      return;
    }

    try {
      setLoading(true);

      await leadsService.createLead({
        nome: nome.trim(),
        telefone: telefone.trim(),
        email: email.trim(),
        tipo_interesse: tipoInteresse,
        imovel_id: imovelId,
        stage_id: stageId,
        observacoes: observacoes.trim() || undefined,
        status: 'Aguardando',
      });

      toast.success('Lead criado com sucesso!');
      onSuccess();
      onClose();
    } catch (error) {
      console.error('Error creating lead:', error);
      toast.error('Erro ao criar lead');
    } finally {
      setLoading(false);
    }
  };

  // Filter imoveis by tipo_interesse
  const filteredImoveis = imoveis.filter((imovel) =>
    imovel.tipos_disponiveis?.includes(tipoInteresse)
  );

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-2xl max-h-[90vh]">
        <DialogHeader>
          <DialogTitle>Novo Lead</DialogTitle>
        </DialogHeader>

        <ScrollArea className="max-h-[calc(90vh-180px)] pr-4">
          <form onSubmit={handleSubmit} className="space-y-4">
            {/* Nome */}
            <div className="space-y-2">
              <Label htmlFor="nome">
                Nome <span className="text-destructive">*</span>
              </Label>
              <Input
                id="nome"
                value={nome}
                onChange={(e) => setNome(e.target.value)}
                placeholder="Ex: João Silva"
                required
              />
            </div>

            {/* Telefone e Email - lado a lado */}
            <div className="grid grid-cols-2 gap-4">
              {/* Telefone */}
              <div className="space-y-2">
                <Label htmlFor="telefone">
                  Telefone <span className="text-destructive">*</span>
                </Label>
                <Input
                  id="telefone"
                  value={telefone}
                  onChange={(e) => setTelefone(e.target.value)}
                  placeholder="(00) 00000-0000"
                  required
                />
              </div>

              {/* Email */}
              <div className="space-y-2">
                <Label htmlFor="email">
                  E-mail <span className="text-destructive">*</span>
                </Label>
                <Input
                  id="email"
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="exemplo@email.com"
                  required
                />
              </div>
            </div>

            {/* Tipo de Interesse e Imóvel - lado a lado */}
            <div className="grid grid-cols-2 gap-4">
              {/* Tipo de Interesse */}
              <div className="space-y-2">
                <Label htmlFor="tipo_interesse">
                  Tipo de Interesse <span className="text-destructive">*</span>
                </Label>
                <Select
                  value={tipoInteresse}
                  onValueChange={(value) => {
                    setTipoInteresse(value as 'Venda' | 'Locação');
                    setImovelId(''); // Reset imovel when changing type
                  }}
                >
                  <SelectTrigger id="tipo_interesse">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="Venda">Venda</SelectItem>
                    <SelectItem value="Locação">Locação</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              {/* Imóvel relacionado */}
              <div className="space-y-2">
                <Label htmlFor="imovel">
                  Imóvel <span className="text-destructive">*</span>
                </Label>
                {loadingImoveis ? (
                  <div className="flex items-center justify-center h-10 border rounded-md">
                    <Loader2 className="h-4 w-4 animate-spin" />
                  </div>
                ) : (
                  <Select value={imovelId} onValueChange={setImovelId}>
                    <SelectTrigger id="imovel">
                      <SelectValue placeholder="Selecione..." />
                    </SelectTrigger>
                    <SelectContent>
                      {filteredImoveis.length === 0 ? (
                        <div className="p-2 text-sm text-muted-foreground text-center">
                          Nenhum imóvel disponível para {tipoInteresse}
                        </div>
                      ) : (
                        filteredImoveis.map((imovel) => (
                          <SelectItem key={imovel.id} value={imovel.id}>
                            {imovel.codigo} - {imovel.endereco}
                          </SelectItem>
                        ))
                      )}
                    </SelectContent>
                  </Select>
                )}
              </div>
              </div>

              {/* Estágio */}
              <div className="space-y-2">
                <Label htmlFor="stage_id">
                  Estágio <span className="text-destructive">*</span>
                </Label>
                <Select value={stageId} onValueChange={setStageId}>
                  <SelectTrigger>
                    <SelectValue placeholder="Selecione o estágio..." />
                  </SelectTrigger>
                  <SelectContent>
                    {stages.map((stage) => (
                      <SelectItem key={stage.id} value={stage.id}>
                        <div className="flex items-center gap-2">
                          <div
                            className="w-3 h-3 rounded-full"
                            style={{ backgroundColor: stage.color }}
                          />
                          {stage.name}
                        </div>
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              {/* Observações */}
              <div className="space-y-2">
                <Label htmlFor="observacoes">Observações</Label>
              <Textarea
                id="observacoes"
                value={observacoes}
                onChange={(e) => setObservacoes(e.target.value)}
                placeholder="Adicione observações sobre este lead..."
                rows={4}
                className="resize-none"
              />
            </div>
          </form>
        </ScrollArea>

        <DialogFooter>
          <Button type="button" variant="outline" onClick={onClose} disabled={loading}>
            Cancelar
          </Button>
          <Button onClick={handleSubmit} disabled={loading || loadingImoveis}>
            {loading ? (
              <>
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                Criando...
              </>
            ) : (
              'Criar Lead'
            )}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};
