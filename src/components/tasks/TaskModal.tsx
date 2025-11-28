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
import { Calendar } from '@/components/ui/calendar';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { Checkbox } from '@/components/ui/checkbox';
import { ScrollArea } from '@/components/ui/scroll-area';
import type { Task, TaskType, TaskStatus, TaskPriority, Lead, Imovel } from '@/types';
import { tasksService } from '@/services/tasks.service';
import { supabase } from '@/integrations/supabase/client';
import {
  Loader2,
  Calendar as CalendarIcon,
  Plus,
  X,
  Phone,
  Mail,
  MessageCircle,
  Users,
  Home,
  RefreshCw,
  MoreHorizontal,
} from 'lucide-react';
import { format } from 'date-fns';
import { ptBR } from 'date-fns/locale';
import { toast } from 'sonner';
import { cn } from '@/lib/utils';

interface TaskModalProps {
  task?: Task; // Se fornecido, é edição; se não, é criação
  isOpen: boolean;
  onClose: () => void;
  onSuccess: () => void;
  defaultLeadId?: string;
  defaultImovelId?: string;
}

const taskTypeIcons: Record<TaskType, any> = {
  call: Phone,
  email: Mail,
  whatsapp: MessageCircle,
  meeting: Users,
  visit: Home,
  follow_up: RefreshCw,
  other: MoreHorizontal,
};

const taskTypeLabels: Record<TaskType, string> = {
  call: 'Ligar',
  email: 'E-mail',
  whatsapp: 'WhatsApp',
  meeting: 'Reunião',
  visit: 'Visita',
  follow_up: 'Follow-up',
  other: 'Outro',
};

const priorityLabels: Record<TaskPriority, string> = {
  low: 'Baixa',
  medium: 'Média',
  high: 'Alta',
  urgent: 'Urgente',
};

const priorityColors: Record<TaskPriority, string> = {
  low: 'text-blue-600',
  medium: 'text-yellow-600',
  high: 'text-orange-600',
  urgent: 'text-red-600',
};

const statusLabels: Record<TaskStatus, string> = {
  pending: 'Pendente',
  in_progress: 'Em Progresso',
  completed: 'Concluída',
  cancelled: 'Cancelada',
};

export const TaskModal = ({
  task,
  isOpen,
  onClose,
  onSuccess,
  defaultLeadId,
  defaultImovelId,
}: TaskModalProps) => {
  const [loading, setLoading] = useState(false);
  const [leads, setLeads] = useState<Lead[]>([]);
  const [imoveis, setImoveis] = useState<Imovel[]>([]);
  const [loadingData, setLoadingData] = useState(true);

  // Form state
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [type, setType] = useState<TaskType>('call');
  const [priority, setPriority] = useState<TaskPriority>('medium');
  const [status, setStatus] = useState<TaskStatus>('pending');
  const [dueDate, setDueDate] = useState<Date | undefined>();
  const [leadId, setLeadId] = useState<string>('');
  const [imovelId, setImovelId] = useState<string>('');

  // Checklist state - TEMPORARIAMENTE DESABILITADO
  // const [checklistItems, setChecklistItems] = useState<Array<{ text: string; checked: boolean }>>([]);
  // const [newChecklistItem, setNewChecklistItem] = useState('');

  useEffect(() => {
    if (isOpen) {
      loadData();
      if (task) {
        // Editing mode - populate form
        setTitle(task.title);
        setDescription(task.description || '');
        setType(task.type);
        setPriority(task.priority);
        setStatus(task.status);
        setDueDate(task.due_date ? new Date(task.due_date) : undefined);
        setLeadId(task.lead_id || '');
        setImovelId(task.imovel_id || '');

        // Load checklist if exists - TEMPORARIAMENTE DESABILITADO
        // if (task.checklist) {
        //   setChecklistItems(
        //     task.checklist.map((item) => ({
        //       text: item.item_text,
        //       checked: item.is_completed,
        //     }))
        //   );
        // }
      } else {
        // Creation mode - reset form
        resetForm();
        if (defaultLeadId) setLeadId(defaultLeadId);
        if (defaultImovelId) setImovelId(defaultImovelId);
      }
    }
  }, [isOpen, task, defaultLeadId, defaultImovelId]);

  const resetForm = () => {
    setTitle('');
    setDescription('');
    setType('call');
    setPriority('medium');
    setStatus('pending');
    setDueDate(undefined);
    setLeadId('');
    setImovelId('');
    // setChecklistItems([]);
    // setNewChecklistItem('');
  };

  const loadData = async () => {
    try {
      setLoadingData(true);

      // Load leads
      const { data: leadsData, error: leadsError } = await supabase
        .from('leads')
        .select('id, nome, telefone')
        .order('created_at', { ascending: false })
        .limit(100);

      if (leadsError) throw leadsError;
      setLeads(leadsData as Lead[]);

      // Load imoveis
      const { data: imoveisData, error: imoveisError } = await supabase
        .from('imoveis')
        .select('id, codigo, endereco')
        .order('created_at', { ascending: false })
        .limit(100);

      if (imoveisError) throw imoveisError;
      setImoveis(imoveisData as Imovel[]);
    } catch (error) {
      console.error('Error loading data:', error);
      toast.error('Erro ao carregar dados');
    } finally {
      setLoadingData(false);
    }
  };

  // Funções de checklist - TEMPORARIAMENTE DESABILITADAS
  // const handleAddChecklistItem = () => {
  //   if (!newChecklistItem.trim()) return;
  //   setChecklistItems([...checklistItems, { text: newChecklistItem.trim(), checked: false }]);
  //   setNewChecklistItem('');
  // };

  // const handleRemoveChecklistItem = (index: number) => {
  //   setChecklistItems(checklistItems.filter((_, i) => i !== index));
  // };

  // const handleToggleChecklistItem = (index: number) => {
  //   const updated = [...checklistItems];
  //   updated[index].checked = !updated[index].checked;
  //   setChecklistItems(updated);
  // };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!title.trim()) {
      toast.error('Título é obrigatório');
      return;
    }

    try {
      setLoading(true);

      if (task) {
        // Update existing task
        await tasksService.updateTask(task.id, {
          title: title.trim(),
          description: description.trim() || undefined,
          type,
          priority,
          status,
          due_date: dueDate?.toISOString(),
          lead_id: leadId || undefined,
          imovel_id: imovelId || undefined,
        });

        // TODO: Update checklist items (would need additional API methods)

        toast.success('Tarefa atualizada com sucesso!');
      } else {
        // Create new task
        const newTask = await tasksService.createTask({
          title: title.trim(),
          description: description.trim() || undefined,
          type,
          priority,
          due_date: dueDate?.toISOString(),
          lead_id: leadId || undefined,
          imovel_id: imovelId || undefined,
        });

        // Checklist será adicionado quando a tabela task_checklists for criada
        // for (const item of checklistItems) {
        //   await tasksService.addChecklistItem(newTask.id, item.text);
        // }

        toast.success('Tarefa criada com sucesso!');
      }

      onSuccess();
      onClose();
    } catch (error) {
      console.error('Error saving task:', error);
      toast.error(task ? 'Erro ao atualizar tarefa' : 'Erro ao criar tarefa');
    } finally {
      setLoading(false);
    }
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-2xl max-h-[90vh]">
        <DialogHeader>
          <DialogTitle>{task ? 'Editar Tarefa' : 'Nova Tarefa'}</DialogTitle>
        </DialogHeader>

        <ScrollArea className="max-h-[calc(90vh-180px)] pr-4">
          <form onSubmit={handleSubmit} className="space-y-4">
            {/* Título */}
            <div className="space-y-2">
              <Label htmlFor="title">
                Título <span className="text-destructive">*</span>
              </Label>
              <Input
                id="title"
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                placeholder="Ex: Ligar para cliente..."
                required
              />
            </div>

            {/* Descrição */}
            <div className="space-y-2">
              <Label htmlFor="description">Descrição</Label>
              <Textarea
                id="description"
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                placeholder="Detalhes sobre a tarefa..."
                rows={3}
                className="resize-none"
              />
            </div>

            {/* Tipo e Prioridade - lado a lado */}
            <div className="grid grid-cols-2 gap-4">
              {/* Tipo */}
              <div className="space-y-2">
                <Label htmlFor="type">
                  Tipo <span className="text-destructive">*</span>
                </Label>
                <Select value={type} onValueChange={(value) => setType(value as TaskType)}>
                  <SelectTrigger id="type">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {(Object.keys(taskTypeLabels) as TaskType[]).map((t) => {
                      const Icon = taskTypeIcons[t];
                      return (
                        <SelectItem key={t} value={t}>
                          <div className="flex items-center gap-2">
                            <Icon className="h-4 w-4" />
                            <span>{taskTypeLabels[t]}</span>
                          </div>
                        </SelectItem>
                      );
                    })}
                  </SelectContent>
                </Select>
              </div>

              {/* Prioridade */}
              <div className="space-y-2">
                <Label htmlFor="priority">
                  Prioridade <span className="text-destructive">*</span>
                </Label>
                <Select
                  value={priority}
                  onValueChange={(value) => setPriority(value as TaskPriority)}
                >
                  <SelectTrigger id="priority">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {(Object.keys(priorityLabels) as TaskPriority[]).map((p) => (
                      <SelectItem key={p} value={p}>
                        <span className={priorityColors[p]}>{priorityLabels[p]}</span>
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </div>

            {/* Status e Data de vencimento - lado a lado */}
            <div className="grid grid-cols-2 gap-4">
              {/* Status */}
              <div className="space-y-2">
                <Label htmlFor="status">Status</Label>
                <Select
                  value={status}
                  onValueChange={(value) => setStatus(value as TaskStatus)}
                >
                  <SelectTrigger id="status">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {(Object.keys(statusLabels) as TaskStatus[]).map((s) => (
                      <SelectItem key={s} value={s}>
                        {statusLabels[s]}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              {/* Data de vencimento */}
              <div className="space-y-2">
                <Label>Data de vencimento</Label>
                <Popover>
                  <PopoverTrigger asChild>
                    <Button
                      variant="outline"
                      className={cn(
                        'w-full justify-start text-left font-normal',
                        !dueDate && 'text-muted-foreground'
                      )}
                    >
                      <CalendarIcon className="mr-2 h-4 w-4" />
                      {dueDate ? format(dueDate, 'dd/MM/yyyy', { locale: ptBR }) : 'Selecionar data'}
                    </Button>
                  </PopoverTrigger>
                  <PopoverContent className="w-auto p-0" align="start">
                    <Calendar
                      mode="single"
                      selected={dueDate}
                      onSelect={setDueDate}
                      initialFocus
                      locale={ptBR}
                    />
                    {dueDate && (
                      <div className="p-3 border-t">
                        <Button
                          variant="ghost"
                          size="sm"
                          className="w-full"
                          onClick={() => setDueDate(undefined)}
                        >
                          Limpar data
                        </Button>
                      </div>
                    )}
                  </PopoverContent>
                </Popover>
              </div>
            </div>

            {/* Lead e Imóvel - lado a lado */}
            <div className="grid grid-cols-2 gap-4">
              {/* Lead */}
              <div className="space-y-2">
                <Label htmlFor="lead">Lead relacionado</Label>
                {loadingData ? (
                  <div className="flex items-center justify-center h-10 border rounded-md">
                    <Loader2 className="h-4 w-4 animate-spin" />
                  </div>
                ) : (
                  <Select value={leadId} onValueChange={setLeadId}>
                    <SelectTrigger id="lead">
                      <SelectValue placeholder="Selecionar lead" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="">Nenhum</SelectItem>
                      {leads.map((lead) => (
                        <SelectItem key={lead.id} value={lead.id}>
                          {lead.nome} - {lead.telefone}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                )}
              </div>

              {/* Imóvel */}
              <div className="space-y-2">
                <Label htmlFor="imovel">Imóvel relacionado</Label>
                {loadingData ? (
                  <div className="flex items-center justify-center h-10 border rounded-md">
                    <Loader2 className="h-4 w-4 animate-spin" />
                  </div>
                ) : (
                  <Select value={imovelId} onValueChange={setImovelId}>
                    <SelectTrigger id="imovel">
                      <SelectValue placeholder="Selecionar imóvel" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="">Nenhum</SelectItem>
                      {imoveis.map((imovel) => (
                        <SelectItem key={imovel.id} value={imovel.id}>
                          {imovel.codigo} - {imovel.endereco}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                )}
              </div>
            </div>

            {/* Checklist - TEMPORARIAMENTE DESABILITADO */}
            {/* {!task && (
              <div className="space-y-2">
                <Label>Checklist (opcional)</Label>
                <div className="space-y-2">
                  {checklistItems.length > 0 && (
                    <div className="space-y-1 p-3 border rounded-md bg-muted/50">
                      {checklistItems.map((item, index) => (
                        <div key={index} className="flex items-center gap-2">
                          <Checkbox
                            checked={item.checked}
                            onCheckedChange={() => handleToggleChecklistItem(index)}
                          />
                          <span className={cn('flex-1 text-sm', item.checked && 'line-through text-muted-foreground')}>
                            {item.text}
                          </span>
                          <Button
                            type="button"
                            variant="ghost"
                            size="sm"
                            onClick={() => handleRemoveChecklistItem(index)}
                          >
                            <X className="h-4 w-4" />
                          </Button>
                        </div>
                      ))}
                    </div>
                  )}

                  <div className="flex gap-2">
                    <Input
                      value={newChecklistItem}
                      onChange={(e) => setNewChecklistItem(e.target.value)}
                      placeholder="Adicionar item ao checklist..."
                      onKeyDown={(e) => {
                        if (e.key === 'Enter') {
                          e.preventDefault();
                          handleAddChecklistItem();
                        }
                      }}
                    />
                    <Button
                      type="button"
                      variant="outline"
                      size="icon"
                      onClick={handleAddChecklistItem}
                      disabled={!newChecklistItem.trim()}
                    >
                      <Plus className="h-4 w-4" />
                    </Button>
                  </div>
                </div>
              </div>
            )} */}
          </form>
        </ScrollArea>

        <DialogFooter>
          <Button type="button" variant="outline" onClick={onClose} disabled={loading}>
            Cancelar
          </Button>
          <Button onClick={handleSubmit} disabled={loading}>
            {loading ? (
              <>
                <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                {task ? 'Salvando...' : 'Criando...'}
              </>
            ) : (
              task ? 'Salvar Alterações' : 'Criar Tarefa'
            )}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};
