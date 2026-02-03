-- Atualizar Pipeline de Leads (Novamente)
-- Novo Lead -> Em atendimento -> Concluido

BEGIN;

-- 1. Criar novas etapas / Atualizar existentes
INSERT INTO lead_pipeline_stages (id, name, order_index, is_final, is_won, color)
VALUES 
  ('novo-lead', 'Novo Lead', 1, false, false, '#FFFFFF'),
  ('em-atendimento', 'Em atendimento', 2, false, false, '#FCD34D'),
  ('concluido', 'Concluido', 3, true, true, '#22C55E')
ON CONFLICT (id) DO UPDATE SET 
  name = EXCLUDED.name,
  order_index = EXCLUDED.order_index,
  is_final = EXCLUDED.is_final,
  is_won = EXCLUDED.is_won,
  color = EXCLUDED.color;

-- 2. Migrar leads de "Qualificação" para "Em atendimento"
UPDATE leads
SET stage_id = 'em-atendimento', updated_at = NOW()
WHERE stage_id = 'qualificacao';

-- 3. Migrar leads de "Encerrado" para "Concluido"
UPDATE leads
SET stage_id = 'concluido', updated_at = NOW()
WHERE stage_id = 'encerrado';

-- 4. Remover etapas antigas ("Qualificação", "Encerrado") e outras que não sejam as novas
DELETE FROM lead_pipeline_stages
WHERE id NOT IN ('novo-lead', 'em-atendimento', 'concluido');

COMMIT;
