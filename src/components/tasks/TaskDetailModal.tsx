import { useState, useEffect } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Badge } from '@/components/ui/badge';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Separator } from '@/components/ui/separator';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import type { Task, TaskComment, TaskActivity } from '@/types';
import { tasksService } from '@/services/tasks.service';
import { supabase } from '@/integrations/supabase/client';
import {
  Phone,
  Mail,
  MessageCircle,
  Users,
  Home,
  RefreshCw,
  MoreHorizontal,
  Calendar,
  User,
  Building2,
  Send,
  Trash2,
  Clock,
  CheckCircle2,
  AlertCircle,
} from 'lucide-react';
import { format } from 'date-fns';
import { ptBR } from 'date-fns/locale';
import { toast } from 'sonner';
import { cn } from '@/lib/utils';

interface TaskDetailModalProps {
  task: Task;
  isOpen: boolean;
  onClose: () => void;
  onTaskUpdated: () => void;
}

const taskTypeIcons: Record<Task['type'], any> = {
  call: Phone,
  email: Mail,
  whatsapp: MessageCircle,
  meeting: Users,
  visit: Home,
  follow_up: RefreshCw,
  other: MoreHorizontal,
};

const taskTypeLabels: Record<Task['type'], string> = {
  call: 'Ligar',
  email: 'E-mail',
  whatsapp: 'WhatsApp',
  meeting: 'Reunião',
  visit: 'Visita',
  follow_up: 'Follow-up',
  other: 'Outro',
};

const priorityLabels: Record<Task['priority'], string> = {
  low: 'Baixa',
  medium: 'Média',
  high: 'Alta',
  urgent: 'Urgente',
};

const statusLabels: Record<Task['status'], string> = {
  pending: 'Pendente',
  in_progress: 'Em Progresso',
  completed: 'Concluída',
  cancelled: 'Cancelada',
};

const activityIcons: Record<TaskActivity['action'], any> = {
  created: CheckCircle2,
  status_changed: RefreshCw,
  priority_changed: AlertCircle,
  assigned: User,
  due_date_changed: Calendar,
  completed: CheckCircle2,
  comment_added: MessageCircle,
  comment_deleted: Trash2,
};

export const TaskDetailModal = ({
  task,
  isOpen,
  onClose,
  onTaskUpdated,
}: TaskDetailModalProps) => {
  const [editingTitle, setEditingTitle] = useState(false);
  const [title, setTitle] = useState(task.title);
  const [description, setDescription] = useState(task.description || '');
  const [newComment, setNewComment] = useState('');
  const [submittingComment, setSubmittingComment] = useState(false);
  const [currentUserId, setCurrentUserId] = useState<string | null>(null);

  const TypeIcon = taskTypeIcons[task.type];

  useEffect(() => {
    const getUser = async () => {
      const { data: { user } } = await supabase.auth.getUser();
      setCurrentUserId(user?.id || null);
    };
    getUser();
  }, []);

  const handleUpdateTitle = async () => {
    if (title.trim() === task.title) {
      setEditingTitle(false);
      return;
    }

    try {
      await tasksService.updateTask(task.id, { title: title.trim() });
      toast.success('Título atualizado!');
      setEditingTitle(false);
      onTaskUpdated();
    } catch (error) {
      toast.error('Erro ao atualizar título');
      setTitle(task.title);
    }
  };

  const handleUpdateDescription = async () => {
    if (description === (task.description || '')) return;

    try {
      await tasksService.updateTask(task.id, { description });
      toast.success('Descrição atualizada!');
      onTaskUpdated();
    } catch (error) {
      toast.error('Erro ao atualizar descrição');
    }
  };

  const handleQuickUpdate = async (field: string, value: any) => {
    try {
      await tasksService.updateTask(task.id, { [field]: value });
      toast.success('Tarefa atualizada!');
      onTaskUpdated();
    } catch (error) {
      toast.error('Erro ao atualizar tarefa');
    }
  };

  const handleAddComment = async () => {
    if (!newComment.trim()) return;

    try {
      setSubmittingComment(true);
      await tasksService.addComment(task.id, newComment.trim());
      setNewComment('');
      toast.success('Comentário adicionado!');
      onTaskUpdated();
    } catch (error) {
      toast.error('Erro ao adicionar comentário');
    } finally {
      setSubmittingComment(false);
    }
  };

  const handleDeleteComment = async (commentId: string) => {
    if (!confirm('Deseja excluir este comentário?')) return;

    try {
      await tasksService.deleteComment(task.id, commentId);
      toast.success('Comentário excluído!');
      onTaskUpdated();
    } catch (error) {
      toast.error('Erro ao excluir comentário');
    }
  };

  const comments = task.comments || [];
  const activities = task.activities || [];

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-4xl max-h-[90vh] overflow-hidden flex flex-col">
        <DialogHeader>
          <div className="flex items-start gap-3">
            <div className="flex-shrink-0">
              <div className="p-3 rounded-lg bg-primary/10">
                <TypeIcon className="h-6 w-6 text-primary" />
              </div>
            </div>
            
            <div className="flex-1 min-w-0">
              {editingTitle ? (
                <Input
                  value={title}
                  onChange={(e) => setTitle(e.target.value)}
                  onBlur={handleUpdateTitle}
                  onKeyDown={(e) => {
                    if (e.key === 'Enter') handleUpdateTitle();
                    if (e.key === 'Escape') {
                      setTitle(task.title);
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
                  {task.title}
                </DialogTitle>
              )}
              
              <div className="flex items-center gap-2 mt-2">
                <Badge variant="outline">{taskTypeLabels[task.type]}</Badge>
                <Badge variant="outline">{priorityLabels[task.priority]}</Badge>
                <Badge variant="outline">{statusLabels[task.status]}</Badge>
              </div>
            </div>
          </div>
        </DialogHeader>

        <div className="flex-1 overflow-hidden">
          <div className="grid grid-cols-3 gap-4 h-full">
            {/* Left Column - Main Content */}
            <div className="col-span-2 space-y-4 overflow-y-auto pr-2">
              {/* Description */}
              <div>
                <h3 className="text-sm font-semibold mb-2">Descrição</h3>
                <Textarea
                  value={description}
                  onChange={(e) => setDescription(e.target.value)}
                  onBlur={handleUpdateDescription}
                  placeholder="Adicione uma descrição..."
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
                    comments.map((comment: TaskComment) => (
                      <div
                        key={comment.id}
                        className="bg-muted/30 rounded-lg p-3 space-y-1"
                      >
                        <div className="flex items-start justify-between gap-2">
                          <div className="flex items-center gap-2">
                            <User className="h-4 w-4 text-muted-foreground" />
                            <span className="text-sm font-medium">
                              {comment.created_by_name}
                            </span>
                            <span className="text-xs text-muted-foreground">
                              {format(new Date(comment.created_at), 'dd/MM/yyyy HH:mm', {
                                locale: ptBR,
                              })}
                            </span>
                          </div>
                          {comment.created_by === currentUserId && (
                            <Button
                              variant="ghost"
                              size="sm"
                              onClick={() => handleDeleteComment(comment.id)}
                              className="h-6 w-6 p-0"
                            >
                              <Trash2 className="h-3 w-3" />
                            </Button>
                          )}
                        </div>
                        <p className="text-sm whitespace-pre-wrap">{comment.content}</p>
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
                  {/* Status */}
                  <div>
                    <label className="text-xs text-muted-foreground">Status</label>
                    <Select
                      value={task.status}
                      onValueChange={(value) => handleQuickUpdate('status', value)}
                    >
                      <SelectTrigger className="w-full">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="pending">Pendente</SelectItem>
                        <SelectItem value="in_progress">Em Progresso</SelectItem>
                        <SelectItem value="completed">Concluída</SelectItem>
                        <SelectItem value="cancelled">Cancelada</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>

                  {/* Priority */}
                  <div>
                    <label className="text-xs text-muted-foreground">Prioridade</label>
                    <Select
                      value={task.priority}
                      onValueChange={(value) => handleQuickUpdate('priority', value)}
                    >
                      <SelectTrigger className="w-full">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="low">Baixa</SelectItem>
                        <SelectItem value="medium">Média</SelectItem>
                        <SelectItem value="high">Alta</SelectItem>
                        <SelectItem value="urgent">Urgente</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>

                  {/* Due Date */}
                  <div>
                    <label className="text-xs text-muted-foreground">Data de Vencimento</label>
                    <Input
                      type="datetime-local"
                      value={
                        task.due_date
                          ? format(new Date(task.due_date), "yyyy-MM-dd'T'HH:mm")
                          : ''
                      }
                      onChange={(e) =>
                        handleQuickUpdate(
                          'due_date',
                          e.target.value ? new Date(e.target.value).toISOString() : null
                        )
                      }
                    />
                  </div>
                </div>
              </div>

              <Separator />

              {/* Associated Items */}
              <div>
                <h3 className="text-sm font-semibold mb-2">Vinculado a</h3>
                
                {task.lead && (
                  <div className="flex items-center gap-2 text-sm p-2 bg-muted/30 rounded">
                    <User className="h-4 w-4 text-muted-foreground" />
                    <div className="flex-1 min-w-0">
                      <p className="font-medium truncate">{task.lead.nome}</p>
                      <p className="text-xs text-muted-foreground">{task.lead.telefone}</p>
                    </div>
                  </div>
                )}
                
                {task.imovel && (
                  <div className="flex items-center gap-2 text-sm p-2 bg-muted/30 rounded mt-2">
                    <Building2 className="h-4 w-4 text-muted-foreground" />
                    <div className="flex-1 min-w-0">
                      <p className="font-medium truncate">{task.imovel.codigo}</p>
                      <p className="text-xs text-muted-foreground truncate">
                        {task.imovel.endereco}
                      </p>
                    </div>
                  </div>
                )}
                
                {!task.lead && !task.imovel && (
                  <p className="text-sm text-muted-foreground">
                    Não vinculado a lead ou imóvel
                  </p>
                )}
              </div>

              <Separator />

              {/* Activity Feed */}
              <div>
                <h3 className="text-sm font-semibold mb-2">Atividades</h3>
                <ScrollArea className="h-[200px]">
                  <div className="space-y-2">
                    {activities.length === 0 ? (
                      <p className="text-xs text-muted-foreground text-center py-4">
                        Nenhuma atividade
                      </p>
                    ) : (
                      activities
                        .slice()
                        .reverse()
                        .map((activity: TaskActivity) => {
                          const ActivityIcon = activityIcons[activity.action];
                          return (
                            <div
                              key={activity.id}
                              className="flex gap-2 text-xs p-2 rounded bg-muted/20"
                            >
                              <ActivityIcon className="h-3.5 w-3.5 text-muted-foreground flex-shrink-0 mt-0.5" />
                              <div className="flex-1 min-w-0">
                                <p className="text-foreground">{activity.description}</p>
                                <p className="text-muted-foreground text-[10px] mt-0.5">
                                  {activity.created_by_name} •{' '}
                                  {format(new Date(activity.created_at), 'dd/MM HH:mm', {
                                    locale: ptBR,
                                  })}
                                </p>
                              </div>
                            </div>
                          );
                        })
                    )}
                  </div>
                </ScrollArea>
              </div>
            </div>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
};
