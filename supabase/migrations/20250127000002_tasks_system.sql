-- Migration: Sistema de Tarefas e Atividades
-- Data: 2025-11-27

-- 1. Criar tabela de tarefas
CREATE TABLE IF NOT EXISTS tasks (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  title TEXT NOT NULL,
  description TEXT,

  -- Vinculação
  lead_id UUID REFERENCES leads(id) ON DELETE CASCADE,
  imovel_id UUID REFERENCES imoveis(id) ON DELETE CASCADE,

  -- Tipo e status
  type TEXT NOT NULL CHECK (type IN ('call', 'email', 'whatsapp', 'meeting', 'visit', 'follow_up', 'other')),
  status TEXT NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'in_progress', 'completed', 'cancelled')),
  priority TEXT NOT NULL DEFAULT 'medium' CHECK (priority IN ('low', 'medium', 'high', 'urgent')),

  -- Datas
  due_date TIMESTAMP WITH TIME ZONE,
  completed_at TIMESTAMP WITH TIME ZONE,

  -- Responsável
  assigned_to UUID REFERENCES auth.users(id),
  created_by UUID REFERENCES auth.users(id),

  -- Timestamps
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Índices para performance
CREATE INDEX IF NOT EXISTS idx_tasks_lead ON tasks(lead_id);
CREATE INDEX IF NOT EXISTS idx_tasks_imovel ON tasks(imovel_id);
CREATE INDEX IF NOT EXISTS idx_tasks_assigned ON tasks(assigned_to);
CREATE INDEX IF NOT EXISTS idx_tasks_status ON tasks(status);
CREATE INDEX IF NOT EXISTS idx_tasks_due_date ON tasks(due_date);
CREATE INDEX IF NOT EXISTS idx_tasks_priority ON tasks(priority);
CREATE INDEX IF NOT EXISTS idx_tasks_type ON tasks(type);

-- 2. Criar tabela de checklist de tarefas
CREATE TABLE IF NOT EXISTS task_checklists (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  task_id UUID NOT NULL REFERENCES tasks(id) ON DELETE CASCADE,
  item_text TEXT NOT NULL,
  is_completed BOOLEAN DEFAULT FALSE,
  order_index INTEGER,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_checklist_task ON task_checklists(task_id);
CREATE INDEX IF NOT EXISTS idx_checklist_order ON task_checklists(task_id, order_index);

-- 3. RLS Policies

-- Tarefas
ALTER TABLE tasks ENABLE ROW LEVEL SECURITY;

CREATE POLICY IF NOT EXISTS "Usuários podem ver suas tarefas"
  ON tasks FOR SELECT
  USING (
    auth.role() = 'authenticated' AND
    (assigned_to = auth.uid() OR created_by = auth.uid())
  );

CREATE POLICY IF NOT EXISTS "Usuários podem criar tarefas"
  ON tasks FOR INSERT
  WITH CHECK (auth.role() = 'authenticated');

CREATE POLICY IF NOT EXISTS "Usuários podem atualizar suas tarefas"
  ON tasks FOR UPDATE
  USING (
    auth.role() = 'authenticated' AND
    (assigned_to = auth.uid() OR created_by = auth.uid())
  );

CREATE POLICY IF NOT EXISTS "Usuários podem deletar suas tarefas"
  ON tasks FOR DELETE
  USING (
    auth.role() = 'authenticated' AND
    created_by = auth.uid()
  );

-- Checklist
ALTER TABLE task_checklists ENABLE ROW LEVEL SECURITY;

CREATE POLICY IF NOT EXISTS "Usuários podem ver checklists de suas tarefas"
  ON task_checklists FOR SELECT
  USING (
    auth.role() = 'authenticated' AND
    task_id IN (
      SELECT id FROM tasks
      WHERE assigned_to = auth.uid() OR created_by = auth.uid()
    )
  );

CREATE POLICY IF NOT EXISTS "Usuários podem gerenciar checklists"
  ON task_checklists FOR ALL
  USING (
    auth.role() = 'authenticated' AND
    task_id IN (
      SELECT id FROM tasks
      WHERE assigned_to = auth.uid() OR created_by = auth.uid()
    )
  );

-- 4. Função para atualizar updated_at automaticamente
CREATE OR REPLACE FUNCTION update_task_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Trigger para updated_at
DROP TRIGGER IF EXISTS trigger_update_task_updated_at ON tasks;
CREATE TRIGGER trigger_update_task_updated_at
  BEFORE UPDATE ON tasks
  FOR EACH ROW
  EXECUTE FUNCTION update_task_updated_at();

-- 5. Função para marcar tarefa como completa
CREATE OR REPLACE FUNCTION complete_task(p_task_id UUID)
RETURNS VOID AS $$
BEGIN
  UPDATE tasks
  SET
    status = 'completed',
    completed_at = NOW()
  WHERE id = p_task_id;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- 6. Função para buscar tarefas vencidas
CREATE OR REPLACE FUNCTION get_overdue_tasks()
RETURNS TABLE (
  task_id UUID,
  title TEXT,
  due_date TIMESTAMP WITH TIME ZONE,
  days_overdue INTEGER,
  priority TEXT,
  assigned_to UUID
) AS $$
BEGIN
  RETURN QUERY
  SELECT
    t.id as task_id,
    t.title,
    t.due_date,
    EXTRACT(DAY FROM (NOW() - t.due_date))::INTEGER as days_overdue,
    t.priority,
    t.assigned_to
  FROM tasks t
  WHERE
    t.status IN ('pending', 'in_progress')
    AND t.due_date < NOW()
    AND (t.assigned_to = auth.uid() OR t.created_by = auth.uid())
  ORDER BY t.due_date ASC;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- 7. Função para criar tarefa automática ao criar lead
CREATE OR REPLACE FUNCTION create_lead_initial_task()
RETURNS TRIGGER AS $$
BEGIN
  -- Criar tarefa de contato inicial
  INSERT INTO tasks (
    title,
    description,
    lead_id,
    type,
    priority,
    due_date,
    assigned_to,
    created_by
  ) VALUES (
    'Fazer contato inicial com ' || NEW.nome,
    'Entrar em contato com o lead pela primeira vez. Tel: ' || NEW.telefone || ' | Email: ' || NEW.email,
    NEW.id,
    'call',
    'high',
    NOW() + INTERVAL '1 day',
    auth.uid(),
    auth.uid()
  );

  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Trigger para criar tarefa ao criar lead
DROP TRIGGER IF EXISTS trigger_create_lead_task ON leads;
CREATE TRIGGER trigger_create_lead_task
  AFTER INSERT ON leads
  FOR EACH ROW
  EXECUTE FUNCTION create_lead_initial_task();

-- 8. View para dashboard de tarefas
CREATE OR REPLACE VIEW task_summary AS
SELECT
  (SELECT COUNT(*) FROM tasks WHERE status = 'pending' AND (assigned_to = auth.uid() OR created_by = auth.uid())) as pending_count,
  (SELECT COUNT(*) FROM tasks WHERE status = 'in_progress' AND (assigned_to = auth.uid() OR created_by = auth.uid())) as in_progress_count,
  (SELECT COUNT(*) FROM tasks WHERE status = 'completed' AND (assigned_to = auth.uid() OR created_by = auth.uid())) as completed_count,
  (SELECT COUNT(*) FROM tasks WHERE status IN ('pending', 'in_progress') AND due_date < NOW() AND (assigned_to = auth.uid() OR created_by = auth.uid())) as overdue_count,
  (SELECT COUNT(*) FROM tasks WHERE status IN ('pending', 'in_progress') AND due_date >= NOW() AND due_date < NOW() + INTERVAL '24 hours' AND (assigned_to = auth.uid() OR created_by = auth.uid())) as due_today_count;
