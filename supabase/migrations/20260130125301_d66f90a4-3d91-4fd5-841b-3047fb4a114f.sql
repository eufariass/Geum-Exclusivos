-- Tabela para imóveis sincronizados do Arbo/Superlógica
CREATE TABLE IF NOT EXISTS imoveis_arbo (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  listing_id VARCHAR(50) UNIQUE NOT NULL,
  list_date TIMESTAMPTZ,
  last_update_date TIMESTAMPTZ,
  synced_at TIMESTAMPTZ DEFAULT NOW(),
  title TEXT,
  description TEXT,
  transaction_type VARCHAR(20),
  property_type VARCHAR(100),
  publication_type VARCHAR(50),
  featured BOOLEAN DEFAULT FALSE,
  price DECIMAL(15,2),
  currency VARCHAR(10) DEFAULT 'BRL',
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
  living_area DECIMAL(10,2),
  lot_area DECIMAL(10,2),
  bedrooms INTEGER,
  bathrooms INTEGER,
  suites INTEGER,
  garage INTEGER,
  unit_floor INTEGER,
  year_built INTEGER,
  features TEXT[],
  images TEXT[],
  primary_image TEXT,
  detail_url TEXT,
  active BOOLEAN DEFAULT TRUE,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Tabela de log de sincronizações
CREATE TABLE IF NOT EXISTS arbo_sync_log (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  started_at TIMESTAMPTZ DEFAULT NOW(),
  finished_at TIMESTAMPTZ,
  status VARCHAR(20) DEFAULT 'running',
  total_xml INTEGER DEFAULT 0,
  created_count INTEGER DEFAULT 0,
  updated_count INTEGER DEFAULT 0,
  deactivated_count INTEGER DEFAULT 0,
  error_message TEXT,
  created_by UUID REFERENCES auth.users(id)
);

-- Índices para performance
CREATE INDEX IF NOT EXISTS idx_imoveis_arbo_listing_id ON imoveis_arbo(listing_id);
CREATE INDEX IF NOT EXISTS idx_imoveis_arbo_city ON imoveis_arbo(city);
CREATE INDEX IF NOT EXISTS idx_imoveis_arbo_neighborhood ON imoveis_arbo(neighborhood);
CREATE INDEX IF NOT EXISTS idx_imoveis_arbo_price ON imoveis_arbo(price);
CREATE INDEX IF NOT EXISTS idx_imoveis_arbo_bedrooms ON imoveis_arbo(bedrooms);
CREATE INDEX IF NOT EXISTS idx_imoveis_arbo_active ON imoveis_arbo(active);

-- Habilitar RLS
ALTER TABLE imoveis_arbo ENABLE ROW LEVEL SECURITY;
ALTER TABLE arbo_sync_log ENABLE ROW LEVEL SECURITY;

-- Políticas RLS: leitura pública para imoveis_arbo
CREATE POLICY "Allow public read on imoveis_arbo" ON imoveis_arbo
  FOR SELECT USING (true);

-- Políticas RLS: leitura para autenticados no log
CREATE POLICY "Allow authenticated read on arbo_sync_log" ON arbo_sync_log
  FOR SELECT USING (auth.role() = 'authenticated');

-- Política para inserção no log (autenticados)
CREATE POLICY "Allow authenticated insert on arbo_sync_log" ON arbo_sync_log
  FOR INSERT WITH CHECK (auth.role() = 'authenticated');

-- Política para atualização no log (autenticados)
CREATE POLICY "Allow authenticated update on arbo_sync_log" ON arbo_sync_log
  FOR UPDATE USING (auth.role() = 'authenticated');