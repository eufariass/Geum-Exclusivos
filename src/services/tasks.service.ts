import { supabase } from '@/integrations/supabase/client';
import type { Task, TaskChecklistItem, TaskSummary, TaskStatus, TaskPriority } from '@/types';
import { logger } from '@/lib/logger';
import { handleSupabaseError } from '@/lib/supabase-errors';

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

      logger.info('Tasks fetched', { count: data?.length, filters });
      return data as Task[] || [];
    } catch (error) {
      throw handleSupabaseError(error, 'buscar tarefas');
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
          imovel:imoveis(id, codigo, endereco),
          checklist:task_checklists(*)
        `)
        .eq('id', id)
        .single();

      if (error) throw error;

      logger.info('Task fetched by ID', { id });
      return data as Task;
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
      const { data, error } = await supabase.rpc('get_overdue_tasks');

      if (error) throw error;

      logger.info('Overdue tasks fetched', { count: data?.length });
      return data as Task[] || [];
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
      const { data, error } = await supabase
        .from('task_summary')
        .select('*')
        .single();

      if (error) throw error;

      logger.info('Task summary fetched', data);
      return data as TaskSummary;
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

  /**
   * Adicionar item ao checklist
   */
  async addChecklistItem(taskId: string, itemText: string): Promise<TaskChecklistItem> {
    try {
      // Buscar maior order_index
      const { data: existing } = await supabase
        .from('task_checklists')
        .select('order_index')
        .eq('task_id', taskId)
        .order('order_index', { ascending: false })
        .limit(1);

      const nextIndex = existing && existing[0] ? existing[0].order_index + 1 : 0;

      const { data, error } = await supabase
        .from('task_checklists')
        .insert({
          task_id: taskId,
          item_text: itemText,
          order_index: nextIndex,
        })
        .select()
        .single();

      if (error) throw error;

      logger.info('Checklist item added', { taskId, itemText });
      return data as TaskChecklistItem;
    } catch (error) {
      logger.error('Error adding checklist item', error);
      throw new Error('Erro ao adicionar item ao checklist');
    }
  },

  /**
   * Atualizar item do checklist
   */
  async updateChecklistItem(
    id: string,
    updates: Partial<TaskChecklistItem>
  ): Promise<TaskChecklistItem> {
    try {
      const { data, error } = await supabase
        .from('task_checklists')
        .update(updates)
        .eq('id', id)
        .select()
        .single();

      if (error) throw error;

      logger.info('Checklist item updated', { id, updates });
      return data as TaskChecklistItem;
    } catch (error) {
      logger.error('Error updating checklist item', error);
      throw new Error('Erro ao atualizar item do checklist');
    }
  },

  /**
   * Deletar item do checklist
   */
  async deleteChecklistItem(id: string): Promise<void> {
    try {
      const { error } = await supabase
        .from('task_checklists')
        .delete()
        .eq('id', id);

      if (error) throw error;

      logger.info('Checklist item deleted', { id });
    } catch (error) {
      logger.error('Error deleting checklist item', error);
      throw new Error('Erro ao deletar item do checklist');
    }
  },
};
