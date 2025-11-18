import { useState, useEffect } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { supabase } from '@/integrations/supabase/client';
import type { Lead, Imovel, LeadComment } from '@/types';
import { Loader2, Send, MessageSquare } from 'lucide-react';
import { format } from 'date-fns';
import { ptBR } from 'date-fns/locale';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { toast } from 'sonner';

interface LeadModalProps {
  lead: Lead;
  imovel?: Imovel;
  isOpen: boolean;
  onClose: () => void;
  onStatusChange: (leadId: string, newStatus: Lead['status']) => void;
}

export const LeadModal = ({ lead, imovel, isOpen, onClose, onStatusChange }: LeadModalProps) => {
  const [formData, setFormData] = useState({
    nome: lead.nome,
    telefone: lead.telefone,
    email: lead.email,
    observacoes: lead.observacoes || '',
    status: lead.status,
  });
  const [comments, setComments] = useState<LeadComment[]>([]);
  const [newComment, setNewComment] = useState('');
  const [loading, setLoading] = useState(false);
  const [loadingComments, setLoadingComments] = useState(false);

  useEffect(() => {
    setFormData({
      nome: lead.nome,
      telefone: lead.telefone,
      email: lead.email,
      observacoes: lead.observacoes || '',
      status: lead.status,
    });
    
    if (isOpen) {
      loadComments();
    }
  }, [lead, isOpen]);

  const loadComments = async () => {
    try {
      setLoadingComments(true);
      const { data, error } = await supabase
        .from('lead_comments')
        .select('*')
        .eq('lead_id', lead.id)
        .order('created_at', { ascending: false });

      if (error) throw error;
      setComments(data as LeadComment[] || []);
    } catch (error: any) {
      toast.error(error.message || 'Erro ao carregar comentários');
    } finally {
      setLoadingComments(false);
    }
  };

  const handleAddComment = async () => {
    if (!newComment.trim()) return;

    try {
      setLoading(true);
      const { data, error } = await supabase
        .from('lead_comments')
        .insert({
          lead_id: lead.id,
          comment: newComment.trim(),
        })
        .select()
        .single();

      if (error) throw error;

      setComments([data as LeadComment, ...comments]);
      setNewComment('');
      toast.success('Comentário adicionado com sucesso');
    } catch (error: any) {
      toast.error(error.message || 'Erro ao adicionar comentário');
    } finally {
      setLoading(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    try {
      setLoading(true);
      const { error } = await supabase
        .from('leads')
        .update({
          nome: formData.nome,
          telefone: formData.telefone,
          email: formData.email,
          observacoes: formData.observacoes,
        })
        .eq('id', lead.id);

      if (error) throw error;

      toast.success('Lead atualizado com sucesso');
      onClose();
      window.location.reload();
    } catch (error: any) {
      toast.error(error.message || 'Erro ao atualizar lead');
    } finally {
      setLoading(false);
    }
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-3xl max-h-[90vh] p-0">
        <DialogHeader className="p-6 pb-0">
          <DialogTitle>Editar Lead</DialogTitle>
        </DialogHeader>

        <Tabs defaultValue="info" className="w-full">
          <TabsList className="w-full justify-start border-b rounded-none px-6">
            <TabsTrigger value="info">Informações</TabsTrigger>
            <TabsTrigger value="comments" className="gap-2">
              <MessageSquare className="h-4 w-4" />
              Histórico ({comments.length})
            </TabsTrigger>
          </TabsList>

          <TabsContent value="info" className="p-6 pt-4">
            <form onSubmit={handleSubmit} className="space-y-4">
              <div>
                <Label htmlFor="imovel">Imóvel</Label>
                <Input
                  id="imovel"
                  value={imovel?.codigo || 'N/A'}
                  disabled
                  className="bg-muted"
                />
              </div>

              <div>
                <Label htmlFor="nome">Nome *</Label>
                <Input
                  id="nome"
                  value={formData.nome}
                  onChange={(e) => setFormData({ ...formData, nome: e.target.value })}
                  required
                />
              </div>

              <div>
                <Label htmlFor="telefone">Telefone *</Label>
                <Input
                  id="telefone"
                  value={formData.telefone}
                  onChange={(e) => setFormData({ ...formData, telefone: e.target.value })}
                  required
                />
              </div>

              <div>
                <Label htmlFor="email">E-mail *</Label>
                <Input
                  id="email"
                  type="email"
                  value={formData.email}
                  onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                  required
                />
              </div>

              <div>
                <Label htmlFor="status">Status do Lead *</Label>
                <Select 
                  value={formData.status} 
                  onValueChange={(value) => {
                    setFormData({ ...formData, status: value as Lead['status'] });
                    onStatusChange(lead.id, value as Lead['status']);
                  }}
                >
                  <SelectTrigger id="status">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="Aguardando">
                      <div className="flex items-center gap-2">
                        <span>⏳</span>
                        <span>Aguardando</span>
                      </div>
                    </SelectItem>
                    <SelectItem value="Enviado ao corretor">
                      <div className="flex items-center gap-2">
                        <span>📤</span>
                        <span>Enviado ao corretor</span>
                      </div>
                    </SelectItem>
                    <SelectItem value="Follow up">
                      <div className="flex items-center gap-2">
                        <span>🔄</span>
                        <span>Follow up</span>
                      </div>
                    </SelectItem>
                  </SelectContent>
                </Select>
                <p className="text-xs text-muted-foreground mt-1">
                  Alterar o status move o lead para outra coluna
                </p>
              </div>

              <div>
                <Label htmlFor="observacoes">Observações</Label>
                <Textarea
                  id="observacoes"
                  value={formData.observacoes}
                  onChange={(e) => setFormData({ ...formData, observacoes: e.target.value })}
                  rows={4}
                  placeholder="Adicione observações sobre este lead..."
                />
              </div>

              <div className="flex justify-end gap-2">
                <Button type="button" variant="outline" onClick={onClose}>
                  Cancelar
                </Button>
                <Button type="submit" disabled={loading}>
                  {loading ? (
                    <>
                      <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                      Salvando...
                    </>
                  ) : (
                    'Salvar'
                  )}
                </Button>
              </div>
            </form>
          </TabsContent>

          <TabsContent value="comments" className="p-6 pt-4">
            <div className="space-y-4">
              <div className="flex gap-2">
                <Textarea
                  placeholder="Adicionar um comentário..."
                  value={newComment}
                  onChange={(e) => setNewComment(e.target.value)}
                  rows={3}
                  className="resize-none"
                />
                <Button 
                  onClick={handleAddComment} 
                  disabled={loading || !newComment.trim()}
                  size="icon"
                  className="h-auto"
                >
                  {loading ? (
                    <Loader2 className="h-4 w-4 animate-spin" />
                  ) : (
                    <Send className="h-4 w-4" />
                  )}
                </Button>
              </div>

              <div className="border-t pt-4">
                <h3 className="font-semibold mb-4">Histórico de atendimento</h3>
                <ScrollArea className="h-[400px] pr-4">
                  {loadingComments ? (
                    <div className="flex items-center justify-center py-8">
                      <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
                    </div>
                  ) : comments.length === 0 ? (
                    <p className="text-muted-foreground text-center py-8">
                      Nenhum comentário ainda. Adicione o primeiro comentário acima.
                    </p>
                  ) : (
                    <div className="space-y-4">
                      {comments.map((comment) => (
                        <div key={comment.id} className="flex gap-3 pb-4 border-b last:border-0">
                          <div className="flex-shrink-0 w-8 h-8 rounded-full bg-primary/10 flex items-center justify-center">
                            <MessageSquare className="h-4 w-4 text-primary" />
                          </div>
                          <div className="flex-1 space-y-1">
                            <div className="flex items-center gap-2">
                              <span className="text-sm font-medium">Comentário</span>
                              <span className="text-xs text-muted-foreground">
                                {format(new Date(comment.created_at), "dd/MM/yyyy 'às' HH:mm", { locale: ptBR })}
                              </span>
                            </div>
                            <p className="text-sm text-muted-foreground whitespace-pre-wrap">
                              {comment.comment}
                            </p>
                          </div>
                        </div>
                      ))}
                    </div>
                  )}
                </ScrollArea>
              </div>
            </div>
          </TabsContent>
        </Tabs>
      </DialogContent>
    </Dialog>
  );
};
