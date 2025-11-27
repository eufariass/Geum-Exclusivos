-- ============================================
-- MIGRATION: Sistema de Tarefas Completo
-- ============================================
--
-- INSTRUÇÕES:
-- 1. Acesse o Supabase Dashboard: https://supabase.com/dashboard
-- 2. Vá em "SQL Editor" no menu lateral
-- 3. Clique em "New Query"
-- 4. Copie e cole TODO este arquivo
-- 5. Clique em "Run" (ou pressione Ctrl/Cmd + Enter)
--
-- Este SQL vai criar:
-- - Tabela de tarefas (tasks)
-- - Tabela de checklist (task_checklists)
-- - Triggers automáticos
-- - Funções auxiliares
-- - Políticas RLS de segurança
-- - View para métricas
--
-- ============================================

-- 1. CRIAR TABELA DE TAREFAS
CREATE TABLE IF NOT EXISTS tasks (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  title TEXT NOT NULL,
  description TEXT,
  lead_id UUID REFERENCES leads(id) ON DELETE CASCADE,
  imovel_id UUID REFERENCES imoveis(id) ON DELETE CASCADE,
  type TEXT NOT NULL CHECK (type IN ('call', 'email', 'whatsapp', 'meeting', 'visit', 'follow_up', 'other')),
  status TEXT NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'in_progress', 'completed', 'cancelled')),
  priority TEXT NOT NULL DEFAULT 'medium' CHECK (priority IN ('low', 'medium', 'high', 'urgent')),
  due_date TIMESTAMP WITH TIME ZONE,
  completed_at TIMESTAMP WITH TIME ZONE,
  assigned_to UUID REFERENCES auth.users(id) ON DELETE SET NULL,
  created_by UUID REFERENCES auth.users(id) ON DELETE SET NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 2. CRIAR TABELA DE CHECKLIST
CREATE TABLE IF NOT EXISTS task_checklists (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  task_id UUID NOT NULL REFERENCES tasks(id) ON DELETE CASCADE,
  item_text TEXT NOT NULL,
  is_completed BOOLEAN DEFAULT false,
  order_index INTEGER DEFAULT 0,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 3. ÍNDICES PARA PERFORMANCE
CREATE INDEX IF NOT EXISTS idx_tasks_status ON tasks(status);
CREATE INDEX IF NOT EXISTS idx_tasks_priority ON tasks(priority);
CREATE INDEX IF NOT EXISTS idx_tasks_due_date ON tasks(due_date);
CREATE INDEX IF NOT EXISTS idx_tasks_lead_id ON tasks(lead_id);
CREATE INDEX IF NOT EXISTS idx_tasks_imovel_id ON tasks(imovel_id);
CREATE INDEX IF NOT EXISTS idx_tasks_assigned_to ON tasks(assigned_to);
CREATE INDEX IF NOT EXISTS idx_tasks_created_by ON tasks(created_by);
CREATE INDEX IF NOT EXISTS idx_task_checklists_task_id ON task_checklists(task_id);

-- 4. FUNÇÃO: Atualizar updated_at automaticamente
CREATE OR REPLACE FUNCTION update_task_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- 5. TRIGGER: Atualizar updated_at em tasks
DROP TRIGGER IF EXISTS trigger_update_task_updated_at ON tasks;
CREATE TRIGGER trigger_update_task_updated_at
  BEFORE UPDATE ON tasks
  FOR EACH ROW
  EXECUTE FUNCTION update_task_updated_at();

-- 6. TRIGGER: Atualizar updated_at em task_checklists
DROP TRIGGER IF EXISTS trigger_update_checklist_updated_at ON task_checklists;
CREATE TRIGGER trigger_update_checklist_updated_at
  BEFORE UPDATE ON task_checklists
  FOR EACH ROW
  EXECUTE FUNCTION update_task_updated_at();

-- 7. FUNÇÃO: Criar tarefa inicial quando lead é criado
CREATE OR REPLACE FUNCTION create_lead_initial_task()
RETURNS TRIGGER AS $$
BEGIN
  INSERT INTO tasks (
    title,
    description,
    lead_id,
    type,
    priority,
    due_date,
    created_by
  ) VALUES (
    'Entrar em contato com ' || NEW.nome,
    'Fazer primeiro contato com o lead ' || NEW.nome || ' - Tel: ' || NEW.telefone,
    NEW.id,
    'call',
    'high',
    NOW() + INTERVAL '1 day',
    NEW.created_by
  );
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- 8. TRIGGER: Criar tarefa quando lead é criado
DROP TRIGGER IF EXISTS trigger_create_lead_task ON leads;
CREATE TRIGGER trigger_create_lead_task
  AFTER INSERT ON leads
  FOR EACH ROW
  EXECUTE FUNCTION create_lead_initial_task();

-- 9. FUNÇÃO: Completar tarefa
CREATE OR REPLACE FUNCTION complete_task(task_id UUID)
RETURNS tasks AS $$
DECLARE
  updated_task tasks;
BEGIN
  UPDATE tasks
  SET
    status = 'completed',
    completed_at = NOW()
  WHERE id = task_id
  RETURNING * INTO updated_task;

  RETURN updated_task;
END;
$$ LANGUAGE plpgsql;

-- 10. FUNÇÃO: Buscar tarefas vencidas
CREATE OR REPLACE FUNCTION get_overdue_tasks()
RETURNS TABLE (
  id UUID,
  title TEXT,
  description TEXT,
  lead_id UUID,
  imovel_id UUID,
  type TEXT,
  status TEXT,
  priority TEXT,
  due_date TIMESTAMP WITH TIME ZONE,
  days_overdue INTEGER
) AS $$
BEGIN
  RETURN QUERY
  SELECT
    t.id,
    t.title,
    t.description,
    t.lead_id,
    t.imovel_id,
    t.type,
    t.status,
    t.priority,
    t.due_date,
    EXTRACT(DAY FROM NOW() - t.due_date)::INTEGER as days_overdue
  FROM tasks t
  WHERE t.due_date < NOW()
    AND t.status NOT IN ('completed', 'cancelled')
  ORDER BY t.due_date ASC;
END;
$$ LANGUAGE plpgsql;

-- 11. VIEW: Resumo de tarefas para dashboard
CREATE OR REPLACE VIEW task_summary AS
SELECT
  (SELECT COUNT(*) FROM tasks WHERE status = 'pending') as pending_count,
  (SELECT COUNT(*) FROM tasks WHERE status = 'in_progress') as in_progress_count,
  (SELECT COUNT(*) FROM tasks WHERE status = 'completed') as completed_count,
  (SELECT COUNT(*) FROM tasks WHERE status = 'cancelled') as cancelled_count,
  (SELECT COUNT(*) FROM tasks WHERE due_date < NOW() AND status NOT IN ('completed', 'cancelled')) as overdue_count,
  (SELECT COUNT(*) FROM tasks WHERE DATE(due_date) = CURRENT_DATE AND status NOT IN ('completed', 'cancelled')) as due_today_count;

-- 12. HABILITAR RLS (Row Level Security)
ALTER TABLE tasks ENABLE ROW LEVEL SECURITY;
ALTER TABLE task_checklists ENABLE ROW LEVEL SECURITY;

-- 13. POLÍTICAS RLS PARA TASKS
DROP POLICY IF EXISTS "Usuários podem ver suas próprias tarefas" ON tasks;
CREATE POLICY "Usuários podem ver suas próprias tarefas"
  ON tasks FOR SELECT
  USING (auth.uid() = created_by OR auth.uid() = assigned_to);

DROP POLICY IF EXISTS "Usuários podem criar tarefas" ON tasks;
CREATE POLICY "Usuários podem criar tarefas"
  ON tasks FOR INSERT
  WITH CHECK (auth.uid() = created_by);

DROP POLICY IF EXISTS "Usuários podem atualizar suas tarefas" ON tasks;
CREATE POLICY "Usuários podem atualizar suas tarefas"
  ON tasks FOR UPDATE
  USING (auth.uid() = created_by OR auth.uid() = assigned_to);

DROP POLICY IF EXISTS "Usuários podem deletar suas tarefas" ON tasks;
CREATE POLICY "Usuários podem deletar suas tarefas"
  ON tasks FOR DELETE
  USING (auth.uid() = created_by);

-- 14. POLÍTICAS RLS PARA TASK_CHECKLISTS
DROP POLICY IF EXISTS "Usuários podem ver checklists de suas tarefas" ON task_checklists;
CREATE POLICY "Usuários podem ver checklists de suas tarefas"
  ON task_checklists FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM tasks
      WHERE tasks.id = task_checklists.task_id
        AND (tasks.created_by = auth.uid() OR tasks.assigned_to = auth.uid())
    )
  );

DROP POLICY IF EXISTS "Usuários podem criar checklists em suas tarefas" ON task_checklists;
CREATE POLICY "Usuários podem criar checklists em suas tarefas"
  ON task_checklists FOR INSERT
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM tasks
      WHERE tasks.id = task_checklists.task_id
        AND (tasks.created_by = auth.uid() OR tasks.assigned_to = auth.uid())
    )
  );

DROP POLICY IF EXISTS "Usuários podem atualizar checklists de suas tarefas" ON task_checklists;
CREATE POLICY "Usuários podem atualizar checklists de suas tarefas"
  ON task_checklists FOR UPDATE
  USING (
    EXISTS (
      SELECT 1 FROM tasks
      WHERE tasks.id = task_checklists.task_id
        AND (tasks.created_by = auth.uid() OR tasks.assigned_to = auth.uid())
    )
  );

DROP POLICY IF EXISTS "Usuários podem deletar checklists de suas tarefas" ON task_checklists;
CREATE POLICY "Usuários podem deletar checklists de suas tarefas"
  ON task_checklists FOR DELETE
  USING (
    EXISTS (
      SELECT 1 FROM tasks
      WHERE tasks.id = task_checklists.task_id
        AND (tasks.created_by = auth.uid() OR tasks.assigned_to = auth.uid())
    )
  );

-- ============================================
-- MIGRATION CONCLUÍDA!
-- ============================================
--
-- ✅ Tabelas criadas: tasks, task_checklists
-- ✅ Índices criados para performance
-- ✅ Triggers automáticos configurados
-- ✅ Funções auxiliares criadas
-- ✅ RLS habilitado e políticas configuradas
-- ✅ View task_summary criada
--
-- Próximos passos:
-- 1. Verifique se não houve erros na execução
-- 2. Teste criando uma tarefa manualmente
-- 3. Execute a aplicação React
--
-- ============================================
