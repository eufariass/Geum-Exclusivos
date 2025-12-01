import { supabase } from '@/integrations/supabase/client';
import type { Task, TaskChecklistItem, TaskSummary, TaskStatus, TaskPriority, TaskComment, TaskActivity } from '@/types';
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
      const { data: { user } } = await supabase.auth.getUser();
      
      const { data, error } = await supabase
        .from('tasks')
        .insert({
          ...input,
          status: 'pending',
        })
        .select()
        .single();

      if (error) throw error;

      // Log activity
      if (user) {
        await this.logActivity(data.id, 'created', {
          description: 'Tarefa criada',
          created_by: user.id,
        });
      }

      logger.info('Task created', { taskId: data.id, title: input.title });
      
      return {
        ...data,
        comments: (data.comments as any) || [],
        activities: (data.activities as any) || [],
      } as Task;
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
      const { data: { user } } = await supabase.auth.getUser();
      
      // Get current task to compare changes
      const { data: currentTask } = await supabase
        .from('tasks')
        .select('*')
        .eq('id', id)
        .single();

      const { data, error } = await supabase
        .from('tasks')
        .update(updates as any)
        .eq('id', id)
        .select()
        .single();

      if (error) throw error;

      // Log activities for specific changes
      if (user && currentTask) {
        if (updates.status && updates.status !== currentTask.status) {
          await this.logActivity(id, 'status_changed', {
            description: `Status alterado de "${currentTask.status}" para "${updates.status}"`,
            old_value: currentTask.status,
            new_value: updates.status,
            created_by: user.id,
          });
        }
        if (updates.priority && updates.priority !== currentTask.priority) {
          await this.logActivity(id, 'priority_changed', {
            description: `Prioridade alterada de "${currentTask.priority}" para "${updates.priority}"`,
            old_value: currentTask.priority,
            new_value: updates.priority,
            created_by: user.id,
          });
        }
        if (updates.due_date && updates.due_date !== currentTask.due_date) {
          await this.logActivity(id, 'due_date_changed', {
            description: `Data de vencimento alterada`,
            old_value: currentTask.due_date || '',
            new_value: updates.due_date,
            created_by: user.id,
          });
        }
        if (updates.assigned_to && updates.assigned_to !== currentTask.assigned_to) {
          await this.logActivity(id, 'assigned', {
            description: `Tarefa atribuída`,
            new_value: updates.assigned_to,
            created_by: user.id,
          });
        }
      }

      logger.info('Task updated', { taskId: id, updates });
      
      return {
        ...data,
        comments: (data.comments as any) || [],
        activities: (data.activities as any) || [],
      } as Task;
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
      const { data: { user } } = await supabase.auth.getUser();
      
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

      // Log activity
      if (user) {
        await this.logActivity(id, 'completed', {
          description: 'Tarefa marcada como concluída',
          created_by: user.id,
        });
      }

      logger.info('Task completed', { taskId: id });
      
      return {
        ...data,
        comments: (data.comments as any) || [],
        activities: (data.activities as any) || [],
      } as Task;
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

  /**
   * Adicionar comentário
   */
  async addComment(taskId: string, content: string): Promise<Task> {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error('Usuário não autenticado');

      // Get profile
      const { data: profile } = await supabase
        .from('profiles')
        .select('nome_completo')
        .eq('id', user.id)
        .single();

      // Get current task
      const { data: task } = await supabase
        .from('tasks')
        .select('comments')
        .eq('id', taskId)
        .single();

      const newComment: TaskComment = {
        id: crypto.randomUUID(),
        content,
        created_by: user.id,
        created_by_name: profile?.nome_completo || 'Usuário',
        created_at: new Date().toISOString(),
      };

      const existingComments = Array.isArray(task?.comments) ? task.comments : [];
      const updatedComments = [...existingComments, newComment] as any;

      const { data, error } = await supabase
        .from('tasks')
        .update({ comments: updatedComments })
        .eq('id', taskId)
        .select()
        .single();

      if (error) throw error;

      // Log activity
      await this.logActivity(taskId, 'comment_added', {
        description: 'Comentário adicionado',
        created_by: user.id,
      });

      logger.info('Comment added', { taskId, commentId: newComment.id });
      
      return {
        ...data,
        comments: (data.comments as any) || [],
        activities: (data.activities as any) || [],
      } as Task;
    } catch (error) {
      logger.error('Error adding comment', error);
      throw new Error('Erro ao adicionar comentário');
    }
  },

  /**
   * Deletar comentário
   */
  async deleteComment(taskId: string, commentId: string): Promise<Task> {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error('Usuário não autenticado');

      // Get current task
      const { data: task } = await supabase
        .from('tasks')
        .select('comments')
        .eq('id', taskId)
        .single();

      const existingComments = Array.isArray(task?.comments) ? task.comments : [];
      const updatedComments = existingComments.filter(
        (c: any) => c.id !== commentId
      ) as any;

      const { data, error } = await supabase
        .from('tasks')
        .update({ comments: updatedComments })
        .eq('id', taskId)
        .select()
        .single();

      if (error) throw error;

      // Log activity
      await this.logActivity(taskId, 'comment_deleted', {
        description: 'Comentário removido',
        created_by: user.id,
      });

      logger.info('Comment deleted', { taskId, commentId });
      
      return {
        ...data,
        comments: (data.comments as any) || [],
        activities: (data.activities as any) || [],
      } as Task;
    } catch (error) {
      logger.error('Error deleting comment', error);
      throw new Error('Erro ao deletar comentário');
    }
  },

  /**
   * Registrar atividade
   */
  async logActivity(
    taskId: string,
    action: TaskActivity['action'],
    details: Partial<TaskActivity>
  ): Promise<void> {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      
      // Get profile
      const { data: profile } = await supabase
        .from('profiles')
        .select('nome_completo')
        .eq('id', user?.id || '')
        .single();

      // Get current task
      const { data: task } = await supabase
        .from('tasks')
        .select('activities')
        .eq('id', taskId)
        .single();

      const newActivity: TaskActivity = {
        id: crypto.randomUUID(),
        action,
        description: details.description || '',
        old_value: details.old_value,
        new_value: details.new_value,
        created_by: user?.id,
        created_by_name: profile?.nome_completo || 'Sistema',
        created_at: new Date().toISOString(),
      };

      const existingActivities = Array.isArray(task?.activities) ? task.activities : [];
      const updatedActivities = [...existingActivities, newActivity] as any;

      await supabase
        .from('tasks')
        .update({ activities: updatedActivities })
        .eq('id', taskId);

      logger.info('Activity logged', { taskId, action });
    } catch (error) {
      logger.error('Error logging activity', error);
      // Don't throw - activity logging is not critical
    }
  },
};
