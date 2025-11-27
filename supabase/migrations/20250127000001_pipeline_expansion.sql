-- Migration: Expandir funil de vendas de 3 para 9 etapas
-- Data: 2025-11-27

-- 1. Criar tabela de etapas do pipeline
CREATE TABLE IF NOT EXISTS lead_pipeline_stages (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  name TEXT NOT NULL UNIQUE,
  order_index INTEGER NOT NULL UNIQUE,
  is_final BOOLEAN DEFAULT FALSE,
  is_won BOOLEAN DEFAULT FALSE,
  color TEXT DEFAULT '#3B82F6',
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Inserir as 9 etapas padrão
INSERT INTO lead_pipeline_stages (name, order_index, is_final, is_won, color) VALUES
('Novo Lead', 1, false, false, '#10B981'),
('Contato Inicial', 2, false, false, '#3B82F6'),
('Qualificado', 3, false, false, '#6366F1'),
('Visita Agendada', 4, false, false, '#8B5CF6'),
('Visita Realizada', 5, false, false, '#EC4899'),
('Proposta Enviada', 6, false, false, '#F59E0B'),
('Negociação', 7, false, false, '#EF4444'),
('Fechado/Ganho', 8, true, true, '#22C55E'),
('Perdido', 9, true, false, '#6B7280');

-- Índice para ordenação
CREATE INDEX IF NOT EXISTS idx_pipeline_stages_order ON lead_pipeline_stages(order_index);

-- 2. Criar tabela de motivos de perda
CREATE TABLE IF NOT EXISTS lost_reasons (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  reason TEXT NOT NULL UNIQUE,
  is_active BOOLEAN DEFAULT TRUE,
  order_index INTEGER,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Inserir motivos padrão
INSERT INTO lost_reasons (reason, order_index) VALUES
('Preço muito alto', 1),
('Comprou com concorrente', 2),
('Não gostou do imóvel', 3),
('Localização inadequada', 4),
('Desistiu da compra', 5),
('Sem retorno do cliente', 6),
('Problema de crédito/financiamento', 7),
('Outro motivo', 8);

-- 3. Adicionar colunas na tabela leads
ALTER TABLE leads
ADD COLUMN IF NOT EXISTS pipeline_stage_id UUID REFERENCES lead_pipeline_stages(id),
ADD COLUMN IF NOT EXISTS stage_changed_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
ADD COLUMN IF NOT EXISTS lost_reason_id UUID REFERENCES lost_reasons(id),
ADD COLUMN IF NOT EXISTS lost_notes TEXT,
ADD COLUMN IF NOT EXISTS lost_at TIMESTAMP WITH TIME ZONE,
ADD COLUMN IF NOT EXISTS won_at TIMESTAMP WITH TIME ZONE;

-- Índices para performance
CREATE INDEX IF NOT EXISTS idx_leads_pipeline_stage ON leads(pipeline_stage_id);
CREATE INDEX IF NOT EXISTS idx_leads_stage_changed ON leads(stage_changed_at);
CREATE INDEX IF NOT EXISTS idx_leads_lost_reason ON leads(lost_reason_id);

-- 4. Criar tabela de histórico de mudanças de etapa
CREATE TABLE IF NOT EXISTS lead_stage_history (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  lead_id UUID NOT NULL REFERENCES leads(id) ON DELETE CASCADE,
  from_stage_id UUID REFERENCES lead_pipeline_stages(id),
  to_stage_id UUID REFERENCES lead_pipeline_stages(id),
  changed_by UUID REFERENCES auth.users(id),
  changed_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  duration_days INTEGER,
  notes TEXT
);

-- Índices
CREATE INDEX IF NOT EXISTS idx_stage_history_lead ON lead_stage_history(lead_id);
CREATE INDEX IF NOT EXISTS idx_stage_history_date ON lead_stage_history(changed_at);
CREATE INDEX IF NOT EXISTS idx_stage_history_to_stage ON lead_stage_history(to_stage_id);

-- 5. Migrar dados existentes (mapear status antigo para novo funil)
UPDATE leads SET pipeline_stage_id = (
  SELECT id FROM lead_pipeline_stages WHERE name =
    CASE
      WHEN leads.status = 'Aguardando' THEN 'Novo Lead'
      WHEN leads.status = 'Enviado ao corretor' THEN 'Contato Inicial'
      WHEN leads.status = 'Follow up' THEN 'Qualificado'
      ELSE 'Novo Lead'
    END
)
WHERE pipeline_stage_id IS NULL;

-- 6. RLS Policies

-- Etapas do pipeline são públicas para usuários autenticados
ALTER TABLE lead_pipeline_stages ENABLE ROW LEVEL SECURITY;

CREATE POLICY IF NOT EXISTS "Usuários autenticados podem ver etapas"
  ON lead_pipeline_stages FOR SELECT
  USING (auth.role() = 'authenticated');

-- Motivos de perda são públicos para usuários autenticados
ALTER TABLE lost_reasons ENABLE ROW LEVEL SECURITY;

CREATE POLICY IF NOT EXISTS "Usuários autenticados podem ver motivos"
  ON lost_reasons FOR SELECT
  USING (auth.role() = 'authenticated');

-- Histórico de mudanças
ALTER TABLE lead_stage_history ENABLE ROW LEVEL SECURITY;

CREATE POLICY IF NOT EXISTS "Usuários podem ver histórico"
  ON lead_stage_history FOR SELECT
  USING (auth.role() = 'authenticated');

CREATE POLICY IF NOT EXISTS "Usuários podem inserir histórico"
  ON lead_stage_history FOR INSERT
  WITH CHECK (auth.role() = 'authenticated');

-- 7. Função para calcular duração na etapa anterior
CREATE OR REPLACE FUNCTION calculate_stage_duration(p_lead_id UUID, p_to_stage_id UUID)
RETURNS INTEGER AS $$
DECLARE
  v_last_change TIMESTAMP WITH TIME ZONE;
  v_duration INTEGER;
BEGIN
  -- Buscar a última mudança de etapa
  SELECT changed_at INTO v_last_change
  FROM lead_stage_history
  WHERE lead_id = p_lead_id
  ORDER BY changed_at DESC
  LIMIT 1;

  -- Se não houver histórico, usar data de criação do lead
  IF v_last_change IS NULL THEN
    SELECT created_at INTO v_last_change
    FROM leads
    WHERE id = p_lead_id;
  END IF;

  -- Calcular duração em dias
  v_duration := EXTRACT(DAY FROM (NOW() - v_last_change));

  RETURN v_duration;
END;
$$ LANGUAGE plpgsql;

-- 8. Trigger para registrar mudanças automaticamente
CREATE OR REPLACE FUNCTION log_lead_stage_change()
RETURNS TRIGGER AS $$
DECLARE
  v_old_stage_id UUID;
  v_duration INTEGER;
BEGIN
  -- Só registrar se a etapa mudou
  IF (TG_OP = 'UPDATE' AND OLD.pipeline_stage_id IS DISTINCT FROM NEW.pipeline_stage_id) THEN
    v_old_stage_id := OLD.pipeline_stage_id;

    -- Calcular duração na etapa anterior
    v_duration := calculate_stage_duration(NEW.id, NEW.pipeline_stage_id);

    -- Inserir no histórico
    INSERT INTO lead_stage_history (
      lead_id,
      from_stage_id,
      to_stage_id,
      changed_by,
      duration_days
    ) VALUES (
      NEW.id,
      v_old_stage_id,
      NEW.pipeline_stage_id,
      auth.uid(),
      v_duration
    );

    -- Atualizar timestamp de mudança
    NEW.stage_changed_at := NOW();

    -- Se moveu para "Ganho", registrar data
    IF EXISTS (
      SELECT 1 FROM lead_pipeline_stages
      WHERE id = NEW.pipeline_stage_id AND is_won = true
    ) THEN
      NEW.won_at := NOW();
    END IF;

    -- Se moveu para "Perdido", registrar data
    IF EXISTS (
      SELECT 1 FROM lead_pipeline_stages
      WHERE id = NEW.pipeline_stage_id
      AND is_final = true AND is_won = false
    ) THEN
      NEW.lost_at := NOW();
    END IF;
  END IF;

  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Criar trigger
DROP TRIGGER IF EXISTS trigger_log_lead_stage_change ON leads;
CREATE TRIGGER trigger_log_lead_stage_change
  BEFORE UPDATE ON leads
  FOR EACH ROW
  EXECUTE FUNCTION log_lead_stage_change();

-- 9. Função para obter métricas do funil
CREATE OR REPLACE FUNCTION get_pipeline_metrics(
  p_start_date TIMESTAMP WITH TIME ZONE DEFAULT NULL,
  p_end_date TIMESTAMP WITH TIME ZONE DEFAULT NULL
)
RETURNS TABLE (
  stage_id UUID,
  stage_name TEXT,
  stage_order INTEGER,
  lead_count BIGINT,
  avg_duration_days NUMERIC,
  conversion_rate NUMERIC
) AS $$
BEGIN
  RETURN QUERY
  SELECT
    s.id as stage_id,
    s.name as stage_name,
    s.order_index as stage_order,
    COUNT(DISTINCT l.id) as lead_count,
    ROUND(AVG(EXTRACT(EPOCH FROM (NOW() - l.stage_changed_at)) / 86400), 1) as avg_duration_days,
    CASE
      WHEN LAG(COUNT(DISTINCT l.id)) OVER (ORDER BY s.order_index) IS NULL THEN 100.0
      ELSE ROUND(
        (COUNT(DISTINCT l.id)::NUMERIC /
         NULLIF(LAG(COUNT(DISTINCT l.id)) OVER (ORDER BY s.order_index), 0)) * 100,
        1
      )
    END as conversion_rate
  FROM lead_pipeline_stages s
  LEFT JOIN leads l ON l.pipeline_stage_id = s.id
    AND (p_start_date IS NULL OR l.created_at >= p_start_date)
    AND (p_end_date IS NULL OR l.created_at <= p_end_date)
  GROUP BY s.id, s.name, s.order_index
  ORDER BY s.order_index;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;
