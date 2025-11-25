-- Meta Ads Integration Tables

-- Table to store Facebook/Meta account connections
CREATE TABLE IF NOT EXISTS meta_accounts (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  access_token TEXT NOT NULL,
  token_expires_at TIMESTAMPTZ,
  account_id TEXT NOT NULL, -- Meta Ad Account ID
  account_name TEXT,
  business_id TEXT,
  refresh_token TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(user_id, account_id)
);

-- Table to store campaigns linked to properties
CREATE TABLE IF NOT EXISTS meta_campaigns (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  imovel_id UUID NOT NULL REFERENCES imoveis(id) ON DELETE CASCADE,
  meta_account_id UUID NOT NULL REFERENCES meta_accounts(id) ON DELETE CASCADE,
  campaign_id TEXT NOT NULL, -- Meta Campaign ID
  campaign_name TEXT NOT NULL,
  ad_account_id TEXT NOT NULL,
  status TEXT, -- ACTIVE, PAUSED, DELETED
  objective TEXT, -- LEAD_GENERATION, TRAFFIC, etc
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(imovel_id, campaign_id)
);

-- Table to store campaign metrics (historical data)
CREATE TABLE IF NOT EXISTS meta_campaign_metrics (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  meta_campaign_id UUID NOT NULL REFERENCES meta_campaigns(id) ON DELETE CASCADE,
  date DATE NOT NULL,
  impressions BIGINT DEFAULT 0,
  clicks BIGINT DEFAULT 0,
  spend DECIMAL(10,2) DEFAULT 0,
  reach BIGINT DEFAULT 0,
  frequency DECIMAL(10,2) DEFAULT 0,
  ctr DECIMAL(5,2) DEFAULT 0, -- Click-through rate
  cpc DECIMAL(10,2) DEFAULT 0, -- Cost per click
  cpm DECIMAL(10,2) DEFAULT 0, -- Cost per thousand impressions
  leads BIGINT DEFAULT 0,
  cost_per_lead DECIMAL(10,2) DEFAULT 0,
  conversions BIGINT DEFAULT 0,
  conversion_rate DECIMAL(5,2) DEFAULT 0,
  video_views BIGINT DEFAULT 0,
  link_clicks BIGINT DEFAULT 0,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(meta_campaign_id, date)
);

-- Table to store sync logs
CREATE TABLE IF NOT EXISTS meta_sync_logs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  meta_account_id UUID NOT NULL REFERENCES meta_accounts(id) ON DELETE CASCADE,
  sync_type TEXT NOT NULL, -- 'campaigns', 'metrics', 'full'
  status TEXT NOT NULL, -- 'success', 'failed', 'partial'
  campaigns_synced INTEGER DEFAULT 0,
  metrics_synced INTEGER DEFAULT 0,
  error_message TEXT,
  started_at TIMESTAMPTZ DEFAULT NOW(),
  completed_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Enable RLS
ALTER TABLE meta_accounts ENABLE ROW LEVEL SECURITY;
ALTER TABLE meta_campaigns ENABLE ROW LEVEL SECURITY;
ALTER TABLE meta_campaign_metrics ENABLE ROW LEVEL SECURITY;
ALTER TABLE meta_sync_logs ENABLE ROW LEVEL SECURITY;

-- RLS Policies
-- meta_accounts: users can only see their own accounts
CREATE POLICY "Users can view their own meta accounts" ON meta_accounts
  FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Users can insert their own meta accounts" ON meta_accounts
  FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own meta accounts" ON meta_accounts
  FOR UPDATE USING (auth.uid() = user_id);

CREATE POLICY "Users can delete their own meta accounts" ON meta_accounts
  FOR DELETE USING (auth.uid() = user_id);

-- meta_campaigns: authenticated users can view all
CREATE POLICY "Authenticated users can view campaigns" ON meta_campaigns
  FOR SELECT USING (auth.role() = 'authenticated');

CREATE POLICY "Authenticated users can manage campaigns" ON meta_campaigns
  FOR ALL USING (auth.role() = 'authenticated');

-- meta_campaign_metrics: authenticated users can view all
CREATE POLICY "Authenticated users can view metrics" ON meta_campaign_metrics
  FOR SELECT USING (auth.role() = 'authenticated');

CREATE POLICY "Authenticated users can manage metrics" ON meta_campaign_metrics
  FOR ALL USING (auth.role() = 'authenticated');

-- meta_sync_logs: authenticated users can view all
CREATE POLICY "Authenticated users can view sync logs" ON meta_sync_logs
  FOR SELECT USING (auth.role() = 'authenticated');

CREATE POLICY "System can insert sync logs" ON meta_sync_logs
  FOR INSERT WITH CHECK (true);

-- Indexes for better performance
CREATE INDEX IF NOT EXISTS idx_meta_accounts_user_id ON meta_accounts(user_id);
CREATE INDEX IF NOT EXISTS idx_meta_campaigns_imovel_id ON meta_campaigns(imovel_id);
CREATE INDEX IF NOT EXISTS idx_meta_campaigns_meta_account_id ON meta_campaigns(meta_account_id);
CREATE INDEX IF NOT EXISTS idx_meta_campaign_metrics_campaign_id ON meta_campaign_metrics(meta_campaign_id);
CREATE INDEX IF NOT EXISTS idx_meta_campaign_metrics_date ON meta_campaign_metrics(date);
CREATE INDEX IF NOT EXISTS idx_meta_sync_logs_account_id ON meta_sync_logs(meta_account_id);
