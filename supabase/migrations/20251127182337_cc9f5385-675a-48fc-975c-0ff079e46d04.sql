-- Tabela de estágios do pipeline
CREATE TABLE public.lead_pipeline_stages (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  name TEXT NOT NULL,
  order_index INTEGER NOT NULL,
  is_final BOOLEAN NOT NULL DEFAULT false,
  is_won BOOLEAN NOT NULL DEFAULT false,
  color TEXT NOT NULL DEFAULT '#6366f1',
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Tabela de tarefas
CREATE TABLE public.tasks (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  title TEXT NOT NULL,
  description TEXT,
  status TEXT NOT NULL DEFAULT 'pending',
  priority TEXT NOT NULL DEFAULT 'medium',
  due_date TIMESTAMP WITH TIME ZONE,
  lead_id UUID REFERENCES public.leads(id) ON DELETE CASCADE,
  assigned_to UUID,
  created_by UUID,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  order_index INTEGER NOT NULL DEFAULT 0
);

-- Tabela de motivos de perda
CREATE TABLE public.lost_reasons (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  reason TEXT NOT NULL,
  is_active BOOLEAN NOT NULL DEFAULT true,
  order_index INTEGER NOT NULL DEFAULT 0,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Tabela de histórico de estágios
CREATE TABLE public.lead_stage_history (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  lead_id UUID NOT NULL REFERENCES public.leads(id) ON DELETE CASCADE,
  from_stage_id UUID REFERENCES public.lead_pipeline_stages(id),
  to_stage_id UUID NOT NULL REFERENCES public.lead_pipeline_stages(id),
  changed_by UUID,
  changed_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  notes TEXT
);

-- Adicionar coluna stage_id na tabela leads
ALTER TABLE public.leads ADD COLUMN stage_id UUID REFERENCES public.lead_pipeline_stages(id);
ALTER TABLE public.leads ADD COLUMN lost_reason_id UUID REFERENCES public.lost_reasons(id);

-- Criar índices
CREATE INDEX idx_tasks_lead_id ON public.tasks(lead_id);
CREATE INDEX idx_tasks_status ON public.tasks(status);
CREATE INDEX idx_lead_stage_history_lead_id ON public.lead_stage_history(lead_id);
CREATE INDEX idx_leads_stage_id ON public.leads(stage_id);

-- Trigger para updated_at nas novas tabelas
CREATE TRIGGER update_lead_pipeline_stages_updated_at
BEFORE UPDATE ON public.lead_pipeline_stages
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at();

CREATE TRIGGER update_tasks_updated_at
BEFORE UPDATE ON public.tasks
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at();

-- Enable RLS
ALTER TABLE public.lead_pipeline_stages ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.tasks ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.lost_reasons ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.lead_stage_history ENABLE ROW LEVEL SECURITY;

-- RLS Policies para lead_pipeline_stages
CREATE POLICY "Autenticados podem ver estágios" ON public.lead_pipeline_stages FOR SELECT USING (true);
CREATE POLICY "Autenticados podem criar estágios" ON public.lead_pipeline_stages FOR INSERT WITH CHECK (true);
CREATE POLICY "Autenticados podem atualizar estágios" ON public.lead_pipeline_stages FOR UPDATE USING (true);
CREATE POLICY "Autenticados podem deletar estágios" ON public.lead_pipeline_stages FOR DELETE USING (true);

-- RLS Policies para tasks
CREATE POLICY "Autenticados podem ver tarefas" ON public.tasks FOR SELECT USING (true);
CREATE POLICY "Autenticados podem criar tarefas" ON public.tasks FOR INSERT WITH CHECK (true);
CREATE POLICY "Autenticados podem atualizar tarefas" ON public.tasks FOR UPDATE USING (true);
CREATE POLICY "Autenticados podem deletar tarefas" ON public.tasks FOR DELETE USING (true);

-- RLS Policies para lost_reasons
CREATE POLICY "Autenticados podem ver motivos de perda" ON public.lost_reasons FOR SELECT USING (true);
CREATE POLICY "Autenticados podem criar motivos de perda" ON public.lost_reasons FOR INSERT WITH CHECK (true);
CREATE POLICY "Autenticados podem atualizar motivos de perda" ON public.lost_reasons FOR UPDATE USING (true);
CREATE POLICY "Autenticados podem deletar motivos de perda" ON public.lost_reasons FOR DELETE USING (true);

-- RLS Policies para lead_stage_history
CREATE POLICY "Autenticados podem ver histórico" ON public.lead_stage_history FOR SELECT USING (true);
CREATE POLICY "Autenticados podem criar histórico" ON public.lead_stage_history FOR INSERT WITH CHECK (true);

-- Inserir estágios padrão do pipeline
INSERT INTO public.lead_pipeline_stages (name, order_index, is_final, is_won, color) VALUES
('Novo Lead', 0, false, false, '#6366f1'),
('Contato Inicial', 1, false, false, '#8b5cf6'),
('Qualificação', 2, false, false, '#a855f7'),
('Visita Agendada', 3, false, false, '#c026d3'),
('Proposta Enviada', 4, false, false, '#d946ef'),
('Negociação', 5, false, false, '#e879f9'),
('Ganho', 6, true, true, '#22c55e'),
('Perdido', 7, true, false, '#ef4444');

-- Inserir motivos de perda padrão
INSERT INTO public.lost_reasons (reason, order_index) VALUES
('Preço muito alto', 0),
('Encontrou outra opção', 1),
('Não respondeu', 2),
('Não qualificado', 3),
('Mudou de ideia', 4),
('Outro motivo', 5);

-- Função para calcular métricas do pipeline
CREATE OR REPLACE FUNCTION public.get_pipeline_metrics()
RETURNS TABLE (
  stage_id UUID,
  stage_name TEXT,
  lead_count BIGINT,
  conversion_rate NUMERIC
) AS $$
BEGIN
  RETURN QUERY
  SELECT 
    lps.id as stage_id,
    lps.name as stage_name,
    COUNT(l.id) as lead_count,
    CASE 
      WHEN COUNT(l.id) > 0 THEN 
        ROUND((COUNT(l.id)::NUMERIC / (SELECT COUNT(*) FROM leads)::NUMERIC) * 100, 2)
      ELSE 0
    END as conversion_rate
  FROM public.lead_pipeline_stages lps
  LEFT JOIN public.leads l ON l.stage_id = lps.id
  GROUP BY lps.id, lps.name, lps.order_index
  ORDER BY lps.order_index;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER SET search_path = public;