-- Migration: imoveis_arbo
-- Tabela para armazenar imóveis sincronizados do Arbo/Superlógica via XML VivaReal

CREATE TABLE IF NOT EXISTS imoveis_arbo (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  
  -- Identificador único do Arbo
  listing_id VARCHAR(50) UNIQUE NOT NULL,
  
  -- Datas
  list_date TIMESTAMPTZ,
  last_update_date TIMESTAMPTZ,
  synced_at TIMESTAMPTZ DEFAULT NOW(),
  
  -- Informações básicas
  title TEXT,
  description TEXT,
  transaction_type VARCHAR(20),  -- 'For Sale' ou 'For Rent'
  property_type VARCHAR(100),
  publication_type VARCHAR(50),
  featured BOOLEAN DEFAULT FALSE,
  
  -- Preço
  price DECIMAL(15,2),
  currency VARCHAR(10) DEFAULT 'BRL',
  
  -- Localização
  state VARCHAR(50),
  state_abbr VARCHAR(5),
  city VARCHAR(100),
  neighborhood VARCHAR(100),
  address TEXT,
  street_number VARCHAR(20),
  complement VARCHAR(100),
  postal_code VARCHAR(20),
  latitude DECIMAL(10,7),
  longitude DECIMAL(10,7),
  
  -- Características
  living_area DECIMAL(10,2),
  lot_area DECIMAL(10,2),
  bedrooms INTEGER,
  bathrooms INTEGER,
  suites INTEGER,
  garage INTEGER,
  unit_floor INTEGER,
  year_built INTEGER,
  
  -- Arrays
  features TEXT[],
  images TEXT[],
  primary_image TEXT,
  
  -- URLs e contato
  detail_url TEXT,
  
  -- Controle
  active BOOLEAN DEFAULT TRUE,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Índices importantes para performance
CREATE INDEX IF NOT EXISTS idx_imoveis_arbo_listing_id ON imoveis_arbo(listing_id);
CREATE INDEX IF NOT EXISTS idx_imoveis_arbo_city ON imoveis_arbo(city);
CREATE INDEX IF NOT EXISTS idx_imoveis_arbo_neighborhood ON imoveis_arbo(neighborhood);
CREATE INDEX IF NOT EXISTS idx_imoveis_arbo_price ON imoveis_arbo(price);
CREATE INDEX IF NOT EXISTS idx_imoveis_arbo_bedrooms ON imoveis_arbo(bedrooms);
CREATE INDEX IF NOT EXISTS idx_imoveis_arbo_active ON imoveis_arbo(active);
CREATE INDEX IF NOT EXISTS idx_imoveis_arbo_transaction_type ON imoveis_arbo(transaction_type);

-- Trigger para updated_at automático
CREATE OR REPLACE FUNCTION update_imoveis_arbo_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS trigger_update_imoveis_arbo_updated_at ON imoveis_arbo;
CREATE TRIGGER trigger_update_imoveis_arbo_updated_at
  BEFORE UPDATE ON imoveis_arbo
  FOR EACH ROW
  EXECUTE FUNCTION update_imoveis_arbo_updated_at();

-- Tabela para controle de sincronizações
CREATE TABLE IF NOT EXISTS arbo_sync_log (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  started_at TIMESTAMPTZ DEFAULT NOW(),
  finished_at TIMESTAMPTZ,
  status VARCHAR(20) DEFAULT 'running', -- 'running', 'success', 'error'
  total_xml INTEGER DEFAULT 0,
  created_count INTEGER DEFAULT 0,
  updated_count INTEGER DEFAULT 0,
  deactivated_count INTEGER DEFAULT 0,
  error_message TEXT,
  created_by UUID REFERENCES auth.users(id)
);

-- RLS Policies
ALTER TABLE imoveis_arbo ENABLE ROW LEVEL SECURITY;
ALTER TABLE arbo_sync_log ENABLE ROW LEVEL SECURITY;

-- Permitir leitura pública para imoveis_arbo (vitrine pública)
CREATE POLICY "Allow public read access" ON imoveis_arbo
  FOR SELECT USING (true);

-- Permitir escrita apenas via service role (Edge Functions)
CREATE POLICY "Allow service role write access" ON imoveis_arbo
  FOR ALL USING (auth.role() = 'service_role');

-- Sync log: leitura para autenticados, escrita via service role
CREATE POLICY "Allow authenticated read on sync_log" ON arbo_sync_log
  FOR SELECT USING (auth.role() = 'authenticated');

CREATE POLICY "Allow service role write on sync_log" ON arbo_sync_log
  FOR ALL USING (auth.role() = 'service_role');
