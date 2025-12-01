import { useState, useEffect } from 'react';
import { DndContext, DragEndEvent, DragOverlay, DragStartEvent, closestCorners, useDroppable } from '@dnd-kit/core';
import { SortableContext, verticalListSortingStrategy } from '@dnd-kit/sortable';
import type { Task, TaskStatus } from '@/types';
import { tasksService } from '@/services/tasks.service';
import { TaskCard } from './TaskCard';
import { TaskModal } from './TaskModal';
import { SortableTaskCard } from './SortableTaskCard';
import { Button } from '@/components/ui/button';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Loader2, Plus, Filter } from 'lucide-react';
import { toast } from 'sonner';
import { ScrollArea } from '@/components/ui/scroll-area';
import { cn } from '@/lib/utils';

interface TaskListProps {
  leadId?: string;
  imovelId?: string;
}

interface TasksByStatus {
  status: TaskStatus;
  label: string;
  color: string;
  tasks: Task[];
}

const statusConfig: Record<TaskStatus, { label: string; color: string }> = {
  pending: { label: 'Pendente', color: 'bg-gray-500' },
  in_progress: { label: 'Em Progresso', color: 'bg-blue-500' },
  completed: { label: 'Concluída', color: 'bg-green-500' },
  cancelled: { label: 'Cancelada', color: 'bg-red-500' },
};

export const TaskList = ({ leadId, imovelId }: TaskListProps) => {
  const [tasksByStatus, setTasksByStatus] = useState<TasksByStatus[]>([]);
  const [loading, setLoading] = useState(true);
  const [activeId, setActiveId] = useState<string | null>(null);
  const [showModal, setShowModal] = useState(false);
  const [editingTask, setEditingTask] = useState<Task | undefined>();
  const [filterPriority, setFilterPriority] = useState<string>('all');
  const [filterType, setFilterType] = useState<string>('all');

  useEffect(() => {
    loadTasks();
  }, [leadId, imovelId]);

  const loadTasks = async () => {
    try {
      setLoading(true);

      let tasks: Task[] = [];

      if (leadId) {
        tasks = await tasksService.getTasksByLead(leadId);
      } else if (imovelId) {
        tasks = await tasksService.getTasksByImovel(imovelId);
      } else {
        tasks = await tasksService.getTasks();
      }

      // Apply filters
      let filteredTasks = tasks;
      if (filterPriority !== 'all') {
        filteredTasks = filteredTasks.filter((t) => t.priority === filterPriority);
      }
      if (filterType !== 'all') {
        filteredTasks = filteredTasks.filter((t) => t.type === filterType);
      }

      // Group by status
      const grouped: TasksByStatus[] = (
        Object.keys(statusConfig) as TaskStatus[]
      ).map((status) => ({
        status,
        label: statusConfig[status].label,
        color: statusConfig[status].color,
        tasks: filteredTasks.filter((t) => t.status === status),
      }));

      setTasksByStatus(grouped);
    } catch (error) {
      console.error('Error loading tasks:', error);
      toast.error('Erro ao carregar tarefas');
    } finally {
      setLoading(false);
    }
  };

  const handleDragStart = (event: DragStartEvent) => {
    setActiveId(event.active.id as string);
  };

  const handleDragEnd = async (event: DragEndEvent) => {
    const { active, over } = event;
    setActiveId(null);

    if (!over) return;

    const taskId = active.id as string;
    const targetStatus = over.id as string;

    // Validate target status
    const validStatuses: TaskStatus[] = ['pending', 'in_progress', 'completed', 'cancelled'];
    if (!validStatuses.includes(targetStatus as TaskStatus)) {
      return; // Ignore if not a valid status (e.g., another task ID)
    }

    // Find task
    let task: Task | null = null;
    for (const group of tasksByStatus) {
      const foundTask = group.tasks.find((t) => t.id === taskId);
      if (foundTask) {
        task = foundTask;
        break;
      }
    }

    if (!task || task.status === targetStatus) return;

    // Update task status
    try {
      await tasksService.updateTask(taskId, { status: targetStatus as TaskStatus });
      toast.success('Status da tarefa atualizado!');
      await loadTasks();
    } catch (error) {
      console.error('Error updating task status:', error);
      toast.error('Erro ao atualizar status');
    }
  };

  const handleCreateTask = () => {
    setEditingTask(undefined);
    setShowModal(true);
  };

  const handleEditTask = (task: Task) => {
    setEditingTask(task);
    setShowModal(true);
  };

  const handleCompleteTask = async (taskId: string) => {
    try {
      await tasksService.completeTask(taskId);
      toast.success('Tarefa marcada como concluída!');
      await loadTasks();
    } catch (error) {
      console.error('Error completing task:', error);
      toast.error('Erro ao completar tarefa');
    }
  };

  const handleDeleteTask = async (taskId: string) => {
    if (!confirm('Tem certeza que deseja excluir esta tarefa?')) return;

    try {
      await tasksService.deleteTask(taskId);
      toast.success('Tarefa excluída com sucesso!');
      await loadTasks();
    } catch (error) {
      console.error('Error deleting task:', error);
      toast.error('Erro ao excluir tarefa');
    }
  };

  const handleModalSuccess = () => {
    loadTasks();
  };

  // Find active task for overlay
  const activeTask = tasksByStatus
    .flatMap((g) => g.tasks)
    .find((t) => t.id === activeId);

  if (loading) {
    return (
      <div className="flex items-center justify-center py-12">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  return (
    <div className="space-y-4">
      {/* Header with filters and create button */}
      <div className="flex items-center justify-between gap-4">
        <div className="flex items-center gap-2">
          <Filter className="h-4 w-4 text-muted-foreground" />
          <Select value={filterPriority} onValueChange={setFilterPriority}>
            <SelectTrigger className="w-[140px]">
              <SelectValue placeholder="Prioridade" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">Todas prioridades</SelectItem>
              <SelectItem value="low">Baixa</SelectItem>
              <SelectItem value="medium">Média</SelectItem>
              <SelectItem value="high">Alta</SelectItem>
              <SelectItem value="urgent">Urgente</SelectItem>
            </SelectContent>
          </Select>

          <Select value={filterType} onValueChange={setFilterType}>
            <SelectTrigger className="w-[140px]">
              <SelectValue placeholder="Tipo" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">Todos tipos</SelectItem>
              <SelectItem value="call">Ligar</SelectItem>
              <SelectItem value="email">E-mail</SelectItem>
              <SelectItem value="whatsapp">WhatsApp</SelectItem>
              <SelectItem value="meeting">Reunião</SelectItem>
              <SelectItem value="visit">Visita</SelectItem>
              <SelectItem value="follow_up">Follow-up</SelectItem>
              <SelectItem value="other">Outro</SelectItem>
            </SelectContent>
          </Select>

          {(filterPriority !== 'all' || filterType !== 'all') && (
            <Button
              variant="ghost"
              size="sm"
              onClick={() => {
                setFilterPriority('all');
                setFilterType('all');
              }}
            >
              Limpar filtros
            </Button>
          )}
        </div>

        <Button onClick={handleCreateTask}>
          <Plus className="h-4 w-4 mr-2" />
          Nova Tarefa
        </Button>
      </div>

      {/* Kanban Board */}
      <DndContext
        collisionDetection={closestCorners}
        onDragStart={handleDragStart}
        onDragEnd={handleDragEnd}
      >
        <div className="flex gap-4 overflow-x-auto pb-4">
          {tasksByStatus.map((group) => (
            <TaskColumn
              key={group.status}
              status={group.status}
              label={group.label}
              color={group.color}
              tasks={group.tasks}
              onEditTask={handleEditTask}
              onCompleteTask={handleCompleteTask}
              onDeleteTask={handleDeleteTask}
            />
          ))}
        </div>

        <DragOverlay>
          {activeTask ? (
            <TaskCard task={activeTask} isDragging />
          ) : null}
        </DragOverlay>
      </DndContext>

      {/* Task Modal */}
      {showModal && (
        <TaskModal
          task={editingTask}
          isOpen={showModal}
          onClose={() => setShowModal(false)}
          onSuccess={handleModalSuccess}
          defaultLeadId={leadId}
          defaultImovelId={imovelId}
        />
      )}
    </div>
  );
};

// TaskColumn Component
interface TaskColumnProps {
  status: TaskStatus;
  label: string;
  color: string;
  tasks: Task[];
  onEditTask: (task: Task) => void;
  onCompleteTask: (taskId: string) => void;
  onDeleteTask: (taskId: string) => void;
}

const TaskColumn = ({
  status,
  label,
  color,
  tasks,
  onEditTask,
  onCompleteTask,
  onDeleteTask,
}: TaskColumnProps) => {
  const { setNodeRef, isOver } = useDroppable({
    id: status,
  });

  return (
    <div className="flex-shrink-0 w-[320px] flex flex-col">
      {/* Column Header */}
      <div className="mb-3">
        <div className="flex items-center gap-2 mb-2">
          <div className={cn('w-3 h-3 rounded-full', color)} />
          <h3 className="font-semibold text-sm">{label}</h3>
          <span className="text-xs text-muted-foreground">({tasks.length})</span>
        </div>
        <div className="h-1 bg-muted rounded-full overflow-hidden">
          <div className={cn('h-full', color)} style={{ width: '100%' }} />
        </div>
      </div>

      {/* Droppable Area */}
      <div 
        ref={setNodeRef}
        className={cn(
          "flex-1 p-2 rounded-lg transition-colors",
          isOver ? "bg-primary/10 ring-2 ring-primary" : "bg-muted/30"
        )}
      >
        <SortableContext items={tasks.map((t) => t.id)} strategy={verticalListSortingStrategy}>
          <ScrollArea className="h-full pr-2">
            <div className="space-y-2 min-h-[200px]">
              {tasks.length === 0 ? (
                <div className="flex items-center justify-center py-8 text-sm text-muted-foreground">
                  Nenhuma tarefa
                </div>
              ) : (
                tasks.map((task) => (
                  <SortableTaskCard
                    key={task.id}
                    task={task}
                    onEdit={() => onEditTask(task)}
                    onComplete={() => onCompleteTask(task.id)}
                    onDelete={() => onDeleteTask(task.id)}
                  />
                ))
              )}
            </div>
          </ScrollArea>
        </SortableContext>
      </div>
    </div>
  );
};
