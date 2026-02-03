-- Reestruturar Pipeline de Leads
-- Simplificar para: Novo Lead -> Qualificação -> Encerrado

BEGIN;

-- 1. Criar novas etapas (se não existirem)
INSERT INTO lead_pipeline_stages (id, name, order_index, is_final, is_won, color)
VALUES 
  ('novo-lead', 'Novo Lead', 1, false, false, '#FFFFFF'),
  ('qualificacao', 'Qualificação', 2, false, false, '#FCD34D'),
  ('encerrado', 'Encerrado', 3, true, true, '#22C55E')
ON CONFLICT (id) DO UPDATE SET 
  name = EXCLUDED.name,
  order_index = EXCLUDED.order_index,
  is_final = EXCLUDED.is_final,
  is_won = EXCLUDED.is_won,
  color = EXCLUDED.color;

-- 2. Migrar leads ativos (não finalizados) para "Qualificação"
UPDATE leads
SET stage_id = 'qualificacao', updated_at = NOW()
WHERE stage_id IN (
  SELECT id FROM lead_pipeline_stages 
  WHERE is_final = false 
  AND id NOT IN ('novo-lead', 'qualificacao', 'encerrado')
);

-- 3. Migrar leads finalizados para "Encerrado"  
UPDATE leads
SET stage_id = 'encerrado', updated_at = NOW()
WHERE stage_id IN (
  SELECT id FROM lead_pipeline_stages 
  WHERE is_final = true
  AND id NOT IN ('novo-lead', 'qualificacao', 'encerrado')
);

-- 4. Remover histórico das etapas antigas (opcional - preservar dados)
-- DELETE FROM lead_stage_history WHERE from_stage_id NOT IN ('novo-lead', 'qualificacao', 'encerrado') OR to_stage_id NOT IN ('novo-lead', 'qualificacao', 'encerrado');

-- 5. Deletar etapas antigas
DELETE FROM lead_pipeline_stages
WHERE id NOT IN ('novo-lead', 'qualificacao', 'encerrado');

COMMIT;
