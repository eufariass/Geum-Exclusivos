import { useState, useEffect } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Badge } from '@/components/ui/badge';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Separator } from '@/components/ui/separator';
import { Label } from '@/components/ui/label';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import type { Lead, PipelineStage, LeadComment, StageHistory } from '@/types';
import { leadsService } from '@/services/leads.service';
import { pipelineService } from '@/services/pipeline.service';
import { supabase } from '@/integrations/supabase/client';
import {
  UserCircle,
  Phone,
  Mail,
  Building2,
  Send,
  Trash2,
  User,
  RefreshCw,
} from 'lucide-react';
import { format } from 'date-fns';
import { ptBR } from 'date-fns/locale';
import { toast } from 'sonner';

interface LeadDetailModalProps {
  lead: Lead;
  isOpen: boolean;
  onClose: () => void;
  onLeadUpdated: () => void;
}

export const LeadDetailModal = ({
  lead,
  isOpen,
  onClose,
  onLeadUpdated,
}: LeadDetailModalProps) => {
  const [editingTitle, setEditingTitle] = useState(false);
  const [nome, setNome] = useState(lead.nome);
  const [telefone, setTelefone] = useState(lead.telefone);
  const [email, setEmail] = useState(lead.email);
  const [observacoes, setObservacoes] = useState(lead.observacoes || '');
  const [newComment, setNewComment] = useState('');
  const [submittingComment, setSubmittingComment] = useState(false);
  const [currentUserId, setCurrentUserId] = useState<string | null>(null);
  const [comments, setComments] = useState<LeadComment[]>([]);
  const [stageHistory, setStageHistory] = useState<StageHistory[]>([]);
  const [stages, setStages] = useState<PipelineStage[]>([]);
  const [currentStage, setCurrentStage] = useState<PipelineStage | null>(null);

  useEffect(() => {
    const init = async () => {
      const { data: { user } } = await supabase.auth.getUser();
      setCurrentUserId(user?.id || null);
      
      await loadComments();
      await loadStageHistory();
      await loadStages();
    };
    init();
  }, [lead.id]);

  const loadComments = async () => {
    try {
      const data = await leadsService.getLeadComments(lead.id);
      setComments(data);
    } catch (error) {
      console.error('Error loading comments:', error);
    }
  };

  const loadStageHistory = async () => {
    try {
      const data = await pipelineService.getStageHistory(lead.id);
      setStageHistory(data);
    } catch (error) {
      console.error('Error loading stage history:', error);
    }
  };

  const loadStages = async () => {
    try {
      const data = await pipelineService.getStages();
      setStages(data);
      
      // Find current stage
      const stage = data.find(s => s.id === lead.stage_id);
      setCurrentStage(stage || null);
    } catch (error) {
      console.error('Error loading stages:', error);
    }
  };

  const handleUpdateNome = async () => {
    if (nome.trim() === lead.nome) {
      setEditingTitle(false);
      return;
    }

    try {
      await leadsService.updateLead(lead.id, { nome: nome.trim() });
      toast.success('Nome atualizado!');
      setEditingTitle(false);
      onLeadUpdated();
    } catch (error) {
      toast.error('Erro ao atualizar nome');
      setNome(lead.nome);
    }
  };

  const handleUpdateField = async (field: string, value: any) => {
    try {
      await leadsService.updateLead(lead.id, { [field]: value });
      toast.success('Lead atualizado!');
      onLeadUpdated();
    } catch (error) {
      toast.error('Erro ao atualizar lead');
    }
  };

  const handleUpdateObservacoes = async () => {
    if (observacoes === (lead.observacoes || '')) return;

    try {
      await leadsService.updateLead(lead.id, { observacoes });
      toast.success('Observações atualizadas!');
      onLeadUpdated();
    } catch (error) {
      toast.error('Erro ao atualizar observações');
    }
  };

  const handleChangeStage = async (newStageId: string) => {
    try {
      await leadsService.updateLeadStage(lead.id, newStageId);
      toast.success('Estágio atualizado!');
      onLeadUpdated();
      await loadStageHistory();
      
      // Update current stage
      const stage = stages.find(s => s.id === newStageId);
      setCurrentStage(stage || null);
    } catch (error) {
      toast.error('Erro ao mudar estágio');
    }
  };

  const handleAddComment = async () => {
    if (!newComment.trim() || !currentUserId) return;

    try {
      setSubmittingComment(true);
      await leadsService.addLeadComment(lead.id, newComment.trim(), currentUserId);
      setNewComment('');
      toast.success('Comentário adicionado!');
      await loadComments();
    } catch (error) {
      toast.error('Erro ao adicionar comentário');
    } finally {
      setSubmittingComment(false);
    }
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-4xl max-h-[90vh] overflow-hidden flex flex-col">
        <DialogHeader>
          <div className="flex items-start gap-3">
            <div className="flex-shrink-0">
              <div className="p-3 rounded-lg bg-primary/10">
                <UserCircle className="h-6 w-6 text-primary" />
              </div>
            </div>
            
            <div className="flex-1 min-w-0">
              {editingTitle ? (
                <Input
                  value={nome}
                  onChange={(e) => setNome(e.target.value)}
                  onBlur={handleUpdateNome}
                  onKeyDown={(e) => {
                    if (e.key === 'Enter') handleUpdateNome();
                    if (e.key === 'Escape') {
                      setNome(lead.nome);
                      setEditingTitle(false);
                    }
                  }}
                  autoFocus
                  className="text-xl font-semibold"
                />
              ) : (
                <DialogTitle
                  className="text-xl cursor-pointer hover:text-primary transition-colors"
                  onClick={() => setEditingTitle(true)}
                >
                  {lead.nome}
                </DialogTitle>
              )}
              
              <div className="flex items-center gap-2 mt-2">
                <Badge variant="outline">{lead.tipo_interesse}</Badge>
                {currentStage && (
                  <Badge 
                    variant="outline"
                    style={{ 
                      backgroundColor: currentStage.color + '20',
                      borderColor: currentStage.color,
                      color: currentStage.color
                    }}
                  >
                    {currentStage.name}
                  </Badge>
                )}
              </div>
            </div>
          </div>
        </DialogHeader>

        <div className="flex-1 overflow-hidden">
          <div className="grid grid-cols-3 gap-4 h-full">
            {/* Left Column - Main Content */}
            <div className="col-span-2 space-y-4 overflow-y-auto pr-2">
              {/* Contact Information */}
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label className="text-xs text-muted-foreground">Telefone</Label>
                  <Input
                    value={telefone}
                    onChange={(e) => setTelefone(e.target.value)}
                    onBlur={() => handleUpdateField('telefone', telefone)}
                    placeholder="Telefone..."
                  />
                </div>
                <div>
                  <Label className="text-xs text-muted-foreground">E-mail</Label>
                  <Input
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    onBlur={() => handleUpdateField('email', email)}
                    placeholder="E-mail..."
                  />
                </div>
              </div>

              {/* Observações */}
              <div>
                <h3 className="text-sm font-semibold mb-2">Observações</h3>
                <Textarea
                  value={observacoes}
                  onChange={(e) => setObservacoes(e.target.value)}
                  onBlur={handleUpdateObservacoes}
                  placeholder="Adicione observações sobre o lead..."
                  className="min-h-[100px] resize-none"
                />
              </div>

              <Separator />

              {/* Comments Section */}
              <div>
                <h3 className="text-sm font-semibold mb-3">Comentários</h3>
                
                <div className="space-y-3 mb-4">
                  {comments.length === 0 ? (
                    <p className="text-sm text-muted-foreground text-center py-4">
                      Nenhum comentário ainda
                    </p>
                  ) : (
                    comments.map((comment) => (
                      <div
                        key={comment.id}
                        className="bg-muted/30 rounded-lg p-3 space-y-1"
                      >
                        <div className="flex items-start justify-between gap-2">
                          <div className="flex items-center gap-2">
                            <User className="h-4 w-4 text-muted-foreground" />
                            <span className="text-sm font-medium">
                              {comment.created_by}
                            </span>
                            <span className="text-xs text-muted-foreground">
                              {format(new Date(comment.created_at), 'dd/MM/yyyy HH:mm', {
                                locale: ptBR,
                              })}
                            </span>
                          </div>
                        </div>
                        <p className="text-sm whitespace-pre-wrap">{comment.comment}</p>
                      </div>
                    ))
                  )}
                </div>

                {/* Add Comment Form */}
                <div className="flex gap-2">
                  <Textarea
                    value={newComment}
                    onChange={(e) => setNewComment(e.target.value)}
                    placeholder="Adicione um comentário..."
                    className="min-h-[60px] resize-none"
                    onKeyDown={(e) => {
                      if (e.key === 'Enter' && (e.ctrlKey || e.metaKey)) {
                        handleAddComment();
                      }
                    }}
                  />
                  <Button
                    onClick={handleAddComment}
                    disabled={!newComment.trim() || submittingComment}
                    size="sm"
                  >
                    <Send className="h-4 w-4" />
                  </Button>
                </div>
                <p className="text-xs text-muted-foreground mt-1">
                  Pressione Ctrl+Enter para enviar
                </p>
              </div>
            </div>

            {/* Right Column - Quick Actions */}
            <div className="space-y-4 border-l pl-4 overflow-y-auto">
              <div>
                <h3 className="text-sm font-semibold mb-2">Ações Rápidas</h3>
                
                <div className="space-y-3">
                  {/* Stage */}
                  <div>
                    <label className="text-xs text-muted-foreground">Estágio</label>
                    <Select
                      value={lead.stage_id || ''}
                      onValueChange={handleChangeStage}
                    >
                      <SelectTrigger className="w-full">
                        <SelectValue />
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

                  {/* Tipo de Interesse */}
                  <div>
                    <label className="text-xs text-muted-foreground">Tipo de Interesse</label>
                    <Select
                      value={lead.tipo_interesse}
                      onValueChange={(value) => handleUpdateField('tipo_interesse', value)}
                    >
                      <SelectTrigger className="w-full">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="Venda">Venda</SelectItem>
                        <SelectItem value="Locação">Locação</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                </div>
              </div>

              <Separator />

              {/* Associated Property */}
              <div>
                <h3 className="text-sm font-semibold mb-2">Imóvel Vinculado</h3>
                
                {(lead as any).imovel ? (
                  <div className="flex items-start gap-2 text-sm p-2 bg-muted/30 rounded">
                    <Building2 className="h-4 w-4 text-muted-foreground flex-shrink-0 mt-0.5" />
                    <div className="flex-1 min-w-0">
                      <p className="font-medium truncate">{(lead as any).imovel.codigo}</p>
                      <p className="text-xs text-muted-foreground truncate">
                        {(lead as any).imovel.endereco}
                      </p>
                    </div>
                  </div>
                ) : (
                  <p className="text-sm text-muted-foreground">
                    Nenhum imóvel vinculado
                  </p>
                )}
              </div>

              <Separator />

              {/* Activity Feed */}
              <div>
                <h3 className="text-sm font-semibold mb-2">Histórico de Mudanças</h3>
                <ScrollArea className="h-[200px]">
                  <div className="space-y-2">
                    {stageHistory.length === 0 ? (
                      <p className="text-xs text-muted-foreground text-center py-4">
                        Nenhuma atividade
                      </p>
                    ) : (
                      stageHistory.map((history) => (
                        <div
                          key={history.id}
                          className="flex gap-2 text-xs p-2 rounded bg-muted/20"
                        >
                          <RefreshCw className="h-3.5 w-3.5 text-muted-foreground flex-shrink-0 mt-0.5" />
                          <div className="flex-1 min-w-0">
                            <p className="text-foreground">
                              {history.from_stage_id ? (
                                <>
                                  Movido de <strong>{(history as any).from_stage?.name}</strong> para{' '}
                                  <strong>{(history as any).to_stage?.name}</strong>
                                </>
                              ) : (
                                <>
                                  Criado em <strong>{(history as any).to_stage?.name}</strong>
                                </>
                              )}
                            </p>
                            <p className="text-muted-foreground text-[10px] mt-0.5">
                              {format(new Date(history.changed_at), 'dd/MM HH:mm', {
                                locale: ptBR,
                              })}
                            </p>
                            {history.notes && (
                              <p className="text-muted-foreground text-[10px] mt-1">
                                {history.notes}
                              </p>
                            )}
                          </div>
                        </div>
                      ))
                    )}
                  </div>
                </ScrollArea>
              </div>

              <Separator />

              {/* Additional Info */}
              <div>
                <p className="text-xs text-muted-foreground">
                  Criado em {format(new Date(lead.created_at), 'dd/MM/yyyy HH:mm', { locale: ptBR })}
                </p>
              </div>
            </div>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
};