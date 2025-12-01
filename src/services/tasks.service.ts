import { supabase } from '@/integrations/supabase/client';
import type { Task, TaskChecklistItem, TaskSummary, TaskStatus, TaskPriority } from '@/types';
import { logger } from '@/lib/logger';

export interface TaskFilters {
  status?: TaskStatus | TaskStatus[];
  priority?: TaskPriority | TaskPriority[];
  leadId?: string;
  imovelId?: string;
  assignedTo?: string;
  dueDateFrom?: Date;
  dueDateTo?: Date;
}

export interface CreateTaskInput {
  title: string;
  description?: string;
  lead_id?: string;
  imovel_id?: string;
  type: Task['type'];
  priority?: Task['priority'];
  due_date?: string;
  assigned_to?: string;
}

export const tasksService = {
  /**
   * Buscar todas as tarefas com filtros
   */
  async getTasks(filters?: TaskFilters): Promise<Task[]> {
    try {
      let query = supabase
        .from('tasks')
        .select(`
          *,
          lead:leads(id, nome, telefone),
          imovel:imoveis(id, codigo, endereco)
        `)
        .order('due_date', { ascending: true, nullsFirst: false })
        .order('created_at', { ascending: false });

      // Aplicar filtros
      if (filters?.status) {
        if (Array.isArray(filters.status)) {
          query = query.in('status', filters.status);
        } else {
          query = query.eq('status', filters.status);
        }
      }

      if (filters?.priority) {
        if (Array.isArray(filters.priority)) {
          query = query.in('priority', filters.priority);
        } else {
          query = query.eq('priority', filters.priority);
        }
      }

      if (filters?.leadId) {
        query = query.eq('lead_id', filters.leadId);
      }

      if (filters?.imovelId) {
        query = query.eq('imovel_id', filters.imovelId);
      }

      if (filters?.assignedTo) {
        query = query.eq('assigned_to', filters.assignedTo);
      }

      if (filters?.dueDateFrom) {
        query = query.gte('due_date', filters.dueDateFrom.toISOString());
      }

      if (filters?.dueDateTo) {
        query = query.lte('due_date', filters.dueDateTo.toISOString());
      }

      const { data, error } = await query;

      if (error) throw error;

      logger.info('Tasks fetched', { count: data?.length || 0, filters });
      return (data || []) as any as Task[];
    } catch (error) {
      logger.error('Error fetching tasks', error);
      throw new Error('Erro ao buscar tarefas');
    }
  },

  /**
   * Buscar tarefas por lead
   */
  async getTasksByLead(leadId: string): Promise<Task[]> {
    return this.getTasks({ leadId });
  },

  /**
   * Buscar tarefas por imóvel
   */
  async getTasksByImovel(imovelId: string): Promise<Task[]> {
    return this.getTasks({ imovelId });
  },

  /**
   * Buscar tarefa por ID
   */
  async getTaskById(id: string): Promise<Task | null> {
    try {
      const { data, error } = await supabase
        .from('tasks')
        .select(`
          *,
          lead:leads(id, nome, telefone, email),
          imovel:imoveis(id, codigo, endereco)
        `)
        .eq('id', id)
        .single();

      if (error) throw error;

      logger.info('Task fetched by ID', { id });
      return {
        ...data,
        checklist: [], // Tabela não existe ainda
      } as any as Task;
    } catch (error) {
      logger.error('Error fetching task by ID', error);
      return null;
    }
  },

  /**
   * Criar nova tarefa
   */
  async createTask(input: CreateTaskInput): Promise<Task> {
    try {
      const { data, error } = await supabase
        .from('tasks')
        .insert({
          ...input,
          status: 'pending',
        })
        .select()
        .single();

      if (error) throw error;

      logger.info('Task created', { taskId: data.id, title: input.title });
      return data as Task;
    } catch (error) {
      logger.error('Error creating task', error);
      throw new Error('Erro ao criar tarefa');
    }
  },

  /**
   * Atualizar tarefa
   */
  async updateTask(id: string, updates: Partial<Task>): Promise<Task> {
    try {
      const { data, error } = await supabase
        .from('tasks')
        .update(updates)
        .eq('id', id)
        .select()
        .single();

      if (error) throw error;

      logger.info('Task updated', { taskId: id, updates });
      return data as Task;
    } catch (error) {
      logger.error('Error updating task', error);
      throw new Error('Erro ao atualizar tarefa');
    }
  },

  /**
   * Marcar tarefa como completa
   */
  async completeTask(id: string): Promise<Task> {
    try {
      const { data, error } = await supabase
        .from('tasks')
        .update({
          status: 'completed',
          completed_at: new Date().toISOString(),
        })
        .eq('id', id)
        .select()
        .single();

      if (error) throw error;

      logger.info('Task completed', { taskId: id });
      return data as Task;
    } catch (error) {
      logger.error('Error completing task', error);
      throw new Error('Erro ao completar tarefa');
    }
  },

  /**
   * Deletar tarefa
   */
  async deleteTask(id: string): Promise<void> {
    try {
      const { error } = await supabase
        .from('tasks')
        .delete()
        .eq('id', id);

      if (error) throw error;

      logger.info('Task deleted', { taskId: id });
    } catch (error) {
      logger.error('Error deleting task', error);
      throw new Error('Erro ao deletar tarefa');
    }
  },

  /**
   * Buscar tarefas vencidas
   */
  async getOverdueTasks(): Promise<Task[]> {
    try {
      const now = new Date().toISOString();
      
      const { data, error } = await supabase
        .from('tasks')
        .select(`
          *,
          lead:leads(id, nome, telefone),
          imovel:imoveis(id, codigo, endereco)
        `)
        .lt('due_date', now)
        .in('status', ['pending', 'in_progress'])
        .order('due_date', { ascending: true });

      if (error) throw error;

      logger.info('Overdue tasks fetched', { count: data?.length || 0 });
      return (data || []) as any as Task[];
    } catch (error) {
      logger.error('Error fetching overdue tasks', error);
      throw new Error('Erro ao buscar tarefas vencidas');
    }
  },

  /**
   * Buscar tarefas para hoje e próximos dias
   */
  async getUpcomingTasks(days: number = 7): Promise<Task[]> {
    try {
      const now = new Date();
      const futureDate = new Date();
      futureDate.setDate(futureDate.getDate() + days);

      return this.getTasks({
        status: ['pending', 'in_progress'],
        dueDateFrom: now,
        dueDateTo: futureDate,
      });
    } catch (error) {
      logger.error('Error fetching upcoming tasks', error);
      throw new Error('Erro ao buscar próximas tarefas');
    }
  },

  /**
   * Buscar resumo de tarefas
   */
  async getTaskSummary(): Promise<TaskSummary> {
    try {
      const now = new Date();
      const today = new Date(now.getFullYear(), now.getMonth(), now.getDate()).toISOString();
      const tomorrow = new Date(now.getFullYear(), now.getMonth(), now.getDate() + 1).toISOString();

      // Buscar todas as tarefas
      const { data: allTasks, error } = await supabase
        .from('tasks')
        .select('status, due_date');

      if (error) throw error;

      const tasks = allTasks || [];
      const summary: TaskSummary = {
        pending_count: tasks.filter(t => t.status === 'pending').length,
        in_progress_count: tasks.filter(t => t.status === 'in_progress').length,
        completed_count: tasks.filter(t => t.status === 'completed').length,
        overdue_count: tasks.filter(t => 
          t.due_date && t.due_date < today && ['pending', 'in_progress'].includes(t.status)
        ).length,
        due_today_count: tasks.filter(t => 
          t.due_date && t.due_date >= today && t.due_date < tomorrow && ['pending', 'in_progress'].includes(t.status)
        ).length,
      };

      logger.info('Task summary calculated', summary);
      return summary;
    } catch (error) {
      logger.error('Error fetching task summary', error);
      return {
        pending_count: 0,
        in_progress_count: 0,
        completed_count: 0,
        overdue_count: 0,
        due_today_count: 0,
      };
    }
  },

  // Métodos de checklist comentados - tabela task_checklists não existe ainda
  // Descomentar quando a tabela for criada
  
  /*
  async addChecklistItem(taskId: string, itemText: string): Promise<TaskChecklistItem> {
    // TODO: Implementar quando task_checklists for criado
    throw new Error('Funcionalidade não disponível - tabela task_checklists não criada');
  },

  async updateChecklistItem(id: string, updates: Partial<TaskChecklistItem>): Promise<TaskChecklistItem> {
    // TODO: Implementar quando task_checklists for criado
    throw new Error('Funcionalidade não disponível - tabela task_checklists não criada');
  },

  async deleteChecklistItem(id: string): Promise<void> {
    // TODO: Implementar quando task_checklists for criado
    throw new Error('Funcionalidade não disponível - tabela task_checklists não criada');
  },
  */
};
