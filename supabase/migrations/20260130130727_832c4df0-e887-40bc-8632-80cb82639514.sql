-- Adicionar colunas na tabela leads para suportar imóveis do Arbo
ALTER TABLE leads ALTER COLUMN imovel_id DROP NOT NULL;
ALTER TABLE leads ADD COLUMN IF NOT EXISTS imovel_arbo_id UUID REFERENCES imoveis_arbo(id);
ALTER TABLE leads ADD COLUMN IF NOT EXISTS origem VARCHAR(50) DEFAULT 'Exclusivos';

-- Índices para performance
CREATE INDEX IF NOT EXISTS idx_leads_imovel_arbo_id ON leads(imovel_arbo_id);
CREATE INDEX IF NOT EXISTS idx_leads_origem ON leads(origem);
CREATE INDEX IF NOT EXISTS idx_imoveis_arbo_transaction_type ON imoveis_arbo(transaction_type);

-- Trigger para atualizar updated_at na tabela imoveis_arbo (usando DROP IF EXISTS + CREATE)
DROP TRIGGER IF EXISTS trigger_update_imoveis_arbo_updated_at ON imoveis_arbo;
CREATE TRIGGER trigger_update_imoveis_arbo_updated_at
BEFORE UPDATE ON imoveis_arbo
FOR EACH ROW EXECUTE FUNCTION update_updated_at();