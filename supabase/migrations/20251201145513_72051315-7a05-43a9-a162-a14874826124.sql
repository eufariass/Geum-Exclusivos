-- Adicionar colunas faltantes na tabela tasks
ALTER TABLE tasks ADD COLUMN IF NOT EXISTS type text NOT NULL DEFAULT 'other';
ALTER TABLE tasks ADD COLUMN IF NOT EXISTS imovel_id uuid REFERENCES imoveis(id) ON DELETE SET NULL;
ALTER TABLE tasks ADD COLUMN IF NOT EXISTS completed_at timestamp with time zone;