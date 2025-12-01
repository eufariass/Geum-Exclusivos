import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import type { Task, TaskType, TaskPriority, TaskStatus } from '@/types';
import {
  Phone,
  Mail,
  MessageCircle,
  Users,
  Home,
  RefreshCw,
  MoreHorizontal,
  Calendar,
  CheckSquare,
  User,
  Building2,
  MoreVertical,
  Clock,
  GripVertical,
} from 'lucide-react';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { format, isPast, isToday, isTomorrow } from 'date-fns';
import { ptBR } from 'date-fns/locale';
import { cn } from '@/lib/utils';

interface TaskCardProps {
  task: Task;
  onClick?: () => void;
  onEdit?: () => void;
  onComplete?: () => void;
  onDelete?: () => void;
  isDragging?: boolean;
  dragHandleProps?: any;
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

const priorityColors: Record<TaskPriority, string> = {
  low: 'border-blue-500 bg-blue-50 text-blue-700',
  medium: 'border-yellow-500 bg-yellow-50 text-yellow-700',
  high: 'border-orange-500 bg-orange-50 text-orange-700',
  urgent: 'border-red-500 bg-red-50 text-red-700',
};

const priorityLabels: Record<TaskPriority, string> = {
  low: 'Baixa',
  medium: 'Média',
  high: 'Alta',
  urgent: 'Urgente',
};

const statusColors: Record<TaskStatus, string> = {
  pending: 'bg-gray-100 text-gray-700 border-gray-300',
  in_progress: 'bg-blue-100 text-blue-700 border-blue-300',
  completed: 'bg-green-100 text-green-700 border-green-300',
  cancelled: 'bg-red-100 text-red-700 border-red-300',
};

const statusLabels: Record<TaskStatus, string> = {
  pending: 'Pendente',
  in_progress: 'Em Progresso',
  completed: 'Concluída',
  cancelled: 'Cancelada',
};

export const TaskCard = ({
  task,
  onClick,
  onEdit,
  onComplete,
  onDelete,
  isDragging = false,
  dragHandleProps,
}: TaskCardProps) => {
  const TypeIcon = taskTypeIcons[task.type];

  // Calculate checklist progress
  const totalChecklistItems = task.checklist?.length || 0;
  const completedChecklistItems = task.checklist?.filter((item) => item.is_completed).length || 0;
  const hasChecklist = totalChecklistItems > 0;

  // Due date formatting and status
  const dueDate = task.due_date ? new Date(task.due_date) : null;
  const isOverdue = dueDate && isPast(dueDate) && task.status !== 'completed';
  const isDueToday = dueDate && isToday(dueDate);
  const isDueTomorrow = dueDate && isTomorrow(dueDate);

  const formatDueDate = () => {
    if (!dueDate) return null;
    if (isDueToday) return 'Hoje';
    if (isDueTomorrow) return 'Amanhã';
    return format(dueDate, 'dd/MM/yyyy', { locale: ptBR });
  };

  const handleMenuAction = (e: React.MouseEvent, action: () => void) => {
    e.stopPropagation();
    action();
  };

  return (
    <Card
      className={cn(
        'cursor-pointer transition-all hover:shadow-md',
        isDragging && 'opacity-50 rotate-2',
        isOverdue && 'border-l-4 border-l-red-500',
        task.status === 'completed' && 'opacity-60'
      )}
      onClick={onClick}
    >
      <CardContent className="p-3 space-y-2.5">
        {/* Header: Drag handle, type icon, title, menu */}
        <div className="flex items-start gap-2">
          {/* Drag Handle */}
          {dragHandleProps && (
            <div
              {...dragHandleProps}
              className="flex-shrink-0 cursor-grab active:cursor-grabbing text-muted-foreground hover:text-foreground transition-colors pt-0.5 -ml-1"
            >
              <GripVertical className="h-4 w-4" />
            </div>
          )}

          <div className="flex-shrink-0 mt-0.5">
            <div className={cn('p-1.5 rounded-lg', priorityColors[task.priority])}>
              <TypeIcon className="h-4 w-4" />
            </div>
          </div>

          <div className="flex-1 min-w-0">
            <h3
              className={cn(
                'font-semibold text-sm leading-tight',
                task.status === 'completed' && 'line-through text-muted-foreground'
              )}
            >
              {task.title}
            </h3>
            {task.description && (
              <p className="text-xs text-muted-foreground mt-1 line-clamp-2">
                {task.description}
              </p>
            )}
          </div>

          <DropdownMenu>
            <DropdownMenuTrigger asChild onClick={(e) => e.stopPropagation()}>
              <Button variant="ghost" size="sm" className="h-8 w-8 p-0">
                <MoreVertical className="h-4 w-4" />
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end">
              {onEdit && (
                <DropdownMenuItem onClick={(e) => handleMenuAction(e, onEdit)}>
                  Editar
                </DropdownMenuItem>
              )}
              {onComplete && task.status !== 'completed' && (
                <DropdownMenuItem onClick={(e) => handleMenuAction(e, onComplete)}>
                  Marcar como concluída
                </DropdownMenuItem>
              )}
              {onDelete && (
                <>
                  <DropdownMenuSeparator />
                  <DropdownMenuItem
                    onClick={(e) => handleMenuAction(e, onDelete)}
                    className="text-destructive"
                  >
                    Excluir
                  </DropdownMenuItem>
                </>
              )}
            </DropdownMenuContent>
          </DropdownMenu>
        </div>

        {/* Badges: Status, Priority, Type */}
        <div className="flex flex-wrap gap-1.5">
          <Badge variant="outline" className={cn('text-xs', statusColors[task.status])}>
            {statusLabels[task.status]}
          </Badge>
          <Badge variant="outline" className="text-xs">
            {taskTypeLabels[task.type]}
          </Badge>
          <Badge variant="outline" className={cn('text-xs', priorityColors[task.priority])}>
            {priorityLabels[task.priority]}
          </Badge>
        </div>

        {/* Due date */}
        {dueDate && (
          <div
            className={cn(
              'flex items-center gap-1.5 text-xs',
              isOverdue && 'text-red-600 font-semibold',
              isDueToday && 'text-orange-600 font-semibold',
              !isOverdue && !isDueToday && 'text-muted-foreground'
            )}
          >
            <Clock className="h-3.5 w-3.5" />
            <span>{formatDueDate()}</span>
            {isOverdue && <span className="ml-1">(Vencida)</span>}
          </div>
        )}

        {/* Checklist progress */}
        {hasChecklist && (
          <div className="flex items-center gap-2 text-xs text-muted-foreground">
            <CheckSquare className="h-3.5 w-3.5" />
            <span>
              {completedChecklistItems}/{totalChecklistItems} itens concluídos
            </span>
            <div className="flex-1 bg-gray-200 rounded-full h-1.5 overflow-hidden">
              <div
                className="bg-green-500 h-full transition-all"
                style={{ width: `${(completedChecklistItems / totalChecklistItems) * 100}%` }}
              />
            </div>
          </div>
        )}

        {/* Associated lead/property */}
        {(task.lead || task.imovel) && (
          <div className="flex flex-col gap-1 pt-2 border-t text-xs">
            {task.lead && (
              <div className="flex items-center gap-1.5 text-muted-foreground">
                <User className="h-3.5 w-3.5" />
                <span className="truncate">
                  {task.lead.nome} - {task.lead.telefone}
                </span>
              </div>
            )}
            {task.imovel && (
              <div className="flex items-center gap-1.5 text-muted-foreground">
                <Building2 className="h-3.5 w-3.5" />
                <span className="truncate">
                  {task.imovel.codigo} - {task.imovel.endereco}
                </span>
              </div>
            )}
          </div>
        )}
      </CardContent>
    </Card>
  );
};
