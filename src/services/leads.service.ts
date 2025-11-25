/**
 * Leads Service
 * Business logic for lead management
 */
import { supabase } from '@/integrations/supabase/client';
import { logger } from '@/lib/logger';

export interface Lead {
  id: string;
  imovel_id: string;
  nome: string;
  telefone: string;
  email: string;
  tipo_interesse: 'Venda' | 'Locação';
  status: 'Aguardando' | 'Enviado ao corretor' | 'Follow up';
  observacoes?: string;
  created_at: string;
  updated_at?: string;
  created_by?: string;
  updated_by?: string;
}

export interface LeadComment {
  id: string;
  lead_id: string;
  comment: string;
  created_by: string;
  created_at: string;
}

export const leadsService = {
  /**
   * Get all leads
   */
  async getLeads(): Promise<Lead[]> {
    try {
      const { data, error } = await supabase
        .from('leads')
        .select('*')
        .order('created_at', { ascending: false });

      if (error) throw error;
      return data || [];
    } catch (error) {
      logger.error('Error fetching leads', error);
      throw error;
    }
  },

  /**
   * Get a single lead by ID
   */
  async getLeadById(id: string): Promise<Lead> {
    try {
      const { data, error } = await supabase
        .from('leads')
        .select('*')
        .eq('id', id)
        .single();

      if (error) throw error;
      return data;
    } catch (error) {
      logger.error('Error fetching lead by ID', { id, error });
      throw error;
    }
  },

  /**
   * Get leads for a specific property
   */
  async getLeadsByImovel(imovelId: string): Promise<Lead[]> {
    try {
      const { data, error } = await supabase
        .from('leads')
        .select('*')
        .eq('imovel_id', imovelId)
        .order('created_at', { ascending: false });

      if (error) throw error;
      return data || [];
    } catch (error) {
      logger.error('Error fetching leads by imovel', { imovelId, error });
      throw error;
    }
  },

  /**
   * Create a new lead
   */
  async createLead(lead: Omit<Lead, 'id' | 'created_at'>): Promise<Lead> {
    try {
      const { data, error } = await supabase
        .from('leads')
        .insert([lead])
        .select()
        .single();

      if (error) throw error;

      logger.info('Lead created', { leadId: data.id, imovelId: lead.imovel_id });

      // Try to send webhook (don't fail if it doesn't work)
      try {
        await supabase.functions.invoke('send-lead-webhook', {
          body: {
            lead_id: data.id,
            nome: lead.nome,
            telefone: lead.telefone,
            imovel_id: lead.imovel_id,
          },
        });
      } catch (webhookError) {
        logger.warn('Error sending webhook', webhookError);
      }

      return data;
    } catch (error) {
      logger.error('Error creating lead', { lead, error });
      throw error;
    }
  },

  /**
   * Update an existing lead
   */
  async updateLead(id: string, updates: Partial<Lead>): Promise<Lead> {
    try {
      const { data, error } = await supabase
        .from('leads')
        .update(updates)
        .eq('id', id)
        .select()
        .single();

      if (error) throw error;

      logger.info('Lead updated', { id });
      return data;
    } catch (error) {
      logger.error('Error updating lead', { id, updates, error });
      throw error;
    }
  },

  /**
   * Delete a lead
   */
  async deleteLead(id: string): Promise<void> {
    try {
      const { error } = await supabase
        .from('leads')
        .delete()
        .eq('id', id);

      if (error) throw error;

      logger.info('Lead deleted', { id });
    } catch (error) {
      logger.error('Error deleting lead', { id, error });
      throw error;
    }
  },

  /**
   * Get comments for a lead
   */
  async getLeadComments(leadId: string): Promise<LeadComment[]> {
    try {
      const { data, error } = await supabase
        .from('lead_comments')
        .select('*')
        .eq('lead_id', leadId)
        .order('created_at', { ascending: true });

      if (error) throw error;
      return data || [];
    } catch (error) {
      logger.error('Error fetching lead comments', { leadId, error });
      throw error;
    }
  },

  /**
   * Add a comment to a lead
   */
  async addLeadComment(leadId: string, comment: string, createdBy: string): Promise<LeadComment> {
    try {
      const { data, error } = await supabase
        .from('lead_comments')
        .insert([{
          lead_id: leadId,
          comment,
          created_by: createdBy,
        }])
        .select()
        .single();

      if (error) throw error;

      logger.info('Lead comment added', { leadId });
      return data;
    } catch (error) {
      logger.error('Error adding lead comment', { leadId, comment, error });
      throw error;
    }
  },

  /**
   * Update lead status
   */
  async updateLeadStatus(id: string, status: Lead['status']): Promise<Lead> {
    return this.updateLead(id, { status });
  },
};
