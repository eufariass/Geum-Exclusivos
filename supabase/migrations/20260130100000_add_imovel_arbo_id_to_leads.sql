-- Adicionar coluna imovel_arbo_id à tabela leads para vincular leads aos imóveis Arbo
ALTER TABLE leads
  ALTER COLUMN imovel_id DROP NOT NULL;

ALTER TABLE leads
  ADD COLUMN IF NOT EXISTS imovel_arbo_id UUID REFERENCES imoveis_arbo(id);

-- Adicionar coluna origem para identificar de onde veio o lead
ALTER TABLE leads
  ADD COLUMN IF NOT EXISTS origem VARCHAR(50) DEFAULT 'Exclusivos';

-- Índice para melhor performance em buscas
CREATE INDEX IF NOT EXISTS idx_leads_imovel_arbo_id ON leads(imovel_arbo_id);
CREATE INDEX IF NOT EXISTS idx_leads_origem ON leads(origem);

-- Comentário explicativo
COMMENT ON COLUMN leads.imovel_arbo_id IS 'Referência ao imóvel Arbo relacionado ao lead';
COMMENT ON COLUMN leads.origem IS 'Origem do lead: Exclusivos, Vitrine Pública, etc.';
