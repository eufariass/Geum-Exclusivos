/**
 * Meta Ads Service
 * Business logic for Meta (Facebook) Ads integration
 */
import { supabase } from '@/integrations/supabase/client';
import { logger } from '@/lib/logger';

export interface MetaAccount {
  id: string;
  user_id: string;
  access_token: string;
  token_expires_at?: string;
  account_id: string;
  account_name?: string;
  business_id?: string;
  created_at: string;
  updated_at: string;
}

export interface MetaCampaign {
  id: string;
  imovel_id: string;
  meta_account_id: string;
  campaign_id: string;
  campaign_name: string;
  ad_account_id: string;
  status?: string;
  objective?: string;
  created_at: string;
  updated_at: string;
}

export interface MetaCampaignMetrics {
  id: string;
  meta_campaign_id: string;
  date: string;
  impressions: number;
  clicks: number;
  spend: number;
  reach: number;
  frequency: number;
  ctr: number;
  cpc: number;
  cpm: number;
  leads: number;
  cost_per_lead: number;
  conversions: number;
  conversion_rate: number;
  video_views: number;
  link_clicks: number;
}

export interface MetaSyncLog {
  id: string;
  meta_account_id: string;
  sync_type: 'campaigns' | 'metrics' | 'full';
  status: 'success' | 'failed' | 'partial';
  campaigns_synced?: number;
  metrics_synced?: number;
  error_message?: string;
  started_at: string;
  completed_at?: string;
}

export const metaAdsService = {
  /**
   * Get connected Meta accounts for current user
   */
  async getMetaAccounts(): Promise<MetaAccount[]> {
    try {
      const { data, error } = await supabase
        .from('meta_accounts')
        .select('*')
        .order('created_at', { ascending: false });

      if (error) throw error;
      return data || [];
    } catch (error) {
      logger.error('Error fetching meta accounts', error);
      throw error;
    }
  },

  /**
   * Save Meta account connection
   */
  async saveMetaAccount(account: Omit<MetaAccount, 'id' | 'created_at' | 'updated_at'>): Promise<MetaAccount> {
    try {
      const { data, error } = await supabase
        .from('meta_accounts')
        .upsert([account], {
          onConflict: 'user_id,account_id',
          ignoreDuplicates: false
        })
        .select()
        .single();

      if (error) throw error;

      logger.info('Meta account saved', { accountId: account.account_id });
      return data;
    } catch (error) {
      logger.error('Error saving meta account', error);
      throw error;
    }
  },

  /**
   * Delete Meta account connection
   */
  async deleteMetaAccount(accountId: string): Promise<void> {
    try {
      const { error } = await supabase
        .from('meta_accounts')
        .delete()
        .eq('id', accountId);

      if (error) throw error;

      logger.info('Meta account deleted', { accountId });
    } catch (error) {
      logger.error('Error deleting meta account', error);
      throw error;
    }
  },

  /**
   * Get campaigns linked to properties
   */
  async getMetaCampaigns(): Promise<MetaCampaign[]> {
    try {
      const { data, error } = await supabase
        .from('meta_campaigns')
        .select('*')
        .order('created_at', { ascending: false });

      if (error) throw error;
      return data || [];
    } catch (error) {
      logger.error('Error fetching meta campaigns', error);
      throw error;
    }
  },

  /**
   * Get campaigns for a specific property
   */
  async getCampaignsByImovel(imovelId: string): Promise<MetaCampaign[]> {
    try {
      const { data, error } = await supabase
        .from('meta_campaigns')
        .select('*')
        .eq('imovel_id', imovelId);

      if (error) throw error;
      return data || [];
    } catch (error) {
      logger.error('Error fetching campaigns by imovel', { imovelId, error });
      throw error;
    }
  },

  /**
   * Link a campaign to a property
   */
  async linkCampaignToImovel(
    imovelId: string,
    metaAccountId: string,
    campaignId: string,
    campaignName: string,
    adAccountId: string,
    status?: string,
    objective?: string
  ): Promise<MetaCampaign> {
    try {
      const { data, error } = await supabase
        .from('meta_campaigns')
        .upsert([{
          imovel_id: imovelId,
          meta_account_id: metaAccountId,
          campaign_id: campaignId,
          campaign_name: campaignName,
          ad_account_id: adAccountId,
          status,
          objective,
        }], {
          onConflict: 'imovel_id,campaign_id',
          ignoreDuplicates: false
        })
        .select()
        .single();

      if (error) throw error;

      logger.info('Campaign linked to imovel', { imovelId, campaignId });
      return data;
    } catch (error) {
      logger.error('Error linking campaign', error);
      throw error;
    }
  },

  /**
   * Unlink a campaign from a property
   */
  async unlinkCampaign(campaignId: string): Promise<void> {
    try {
      const { error } = await supabase
        .from('meta_campaigns')
        .delete()
        .eq('id', campaignId);

      if (error) throw error;

      logger.info('Campaign unlinked', { campaignId });
    } catch (error) {
      logger.error('Error unlinking campaign', error);
      throw error;
    }
  },

  /**
   * Get metrics for a campaign
   */
  async getCampaignMetrics(
    metaCampaignId: string,
    startDate?: string,
    endDate?: string
  ): Promise<MetaCampaignMetrics[]> {
    try {
      let query = supabase
        .from('meta_campaign_metrics')
        .select('*')
        .eq('meta_campaign_id', metaCampaignId)
        .order('date', { ascending: false });

      if (startDate) {
        query = query.gte('date', startDate);
      }

      if (endDate) {
        query = query.lte('date', endDate);
      }

      const { data, error } = await query;

      if (error) throw error;
      return data || [];
    } catch (error) {
      logger.error('Error fetching campaign metrics', { metaCampaignId, error });
      throw error;
    }
  },

  /**
   * Save campaign metrics
   */
  async saveCampaignMetrics(metrics: Omit<MetaCampaignMetrics, 'id' | 'created_at' | 'updated_at'>[]): Promise<void> {
    try {
      const { error } = await supabase
        .from('meta_campaign_metrics')
        .upsert(metrics, {
          onConflict: 'meta_campaign_id,date',
          ignoreDuplicates: false
        });

      if (error) throw error;

      logger.info('Campaign metrics saved', { count: metrics.length });
    } catch (error) {
      logger.error('Error saving campaign metrics', error);
      throw error;
    }
  },

  /**
   * Get sync logs
   */
  async getSyncLogs(metaAccountId?: string, limit: number = 20): Promise<MetaSyncLog[]> {
    try {
      let query = supabase
        .from('meta_sync_logs')
        .select('*')
        .order('started_at', { ascending: false })
        .limit(limit);

      if (metaAccountId) {
        query = query.eq('meta_account_id', metaAccountId);
      }

      const { data, error } = await query;

      if (error) throw error;
      return data || [];
    } catch (error) {
      logger.error('Error fetching sync logs', error);
      throw error;
    }
  },

  /**
   * Trigger sync via Edge Function
   */
  async syncMetrics(metaAccountId: string): Promise<{ success: boolean; message: string }> {
    try {
      const { data, error } = await supabase.functions.invoke('sync-meta-ads', {
        body: { metaAccountId }
      });

      if (error) throw error;

      logger.info('Meta Ads sync triggered', { metaAccountId });
      return data;
    } catch (error) {
      logger.error('Error triggering sync', error);
      throw error;
    }
  },

  /**
   * Get aggregated metrics for all campaigns
   */
  async getAggregatedMetrics(startDate?: string, endDate?: string): Promise<{
    totalSpend: number;
    totalImpressions: number;
    totalClicks: number;
    totalLeads: number;
    averageCTR: number;
    averageCPC: number;
  }> {
    try {
      let query = supabase
        .from('meta_campaign_metrics')
        .select('spend, impressions, clicks, leads, ctr, cpc');

      if (startDate) {
        query = query.gte('date', startDate);
      }

      if (endDate) {
        query = query.lte('date', endDate);
      }

      const { data, error } = await query;

      if (error) throw error;

      const metrics = data || [];

      return {
        totalSpend: metrics.reduce((sum, m) => sum + (Number(m.spend) || 0), 0),
        totalImpressions: metrics.reduce((sum, m) => sum + (Number(m.impressions) || 0), 0),
        totalClicks: metrics.reduce((sum, m) => sum + (Number(m.clicks) || 0), 0),
        totalLeads: metrics.reduce((sum, m) => sum + (Number(m.leads) || 0), 0),
        averageCTR: metrics.length > 0
          ? metrics.reduce((sum, m) => sum + (Number(m.ctr) || 0), 0) / metrics.length
          : 0,
        averageCPC: metrics.length > 0
          ? metrics.reduce((sum, m) => sum + (Number(m.cpc) || 0), 0) / metrics.length
          : 0,
      };
    } catch (error) {
      logger.error('Error fetching aggregated metrics', error);
      throw error;
    }
  },
};
