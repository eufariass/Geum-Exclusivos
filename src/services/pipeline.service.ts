import { supabase } from '@/integrations/supabase/client';
import type { Lead, PipelineStage, LostReason, StageHistory, PipelineMetrics } from '@/types';
import { logger } from '@/lib/logger';

export interface LeadsByStage {
  stage: PipelineStage;
  leads: Lead[];
}

export const pipelineService = {
  /**
   * Buscar todas as etapas do pipeline ordenadas
   */
  async getStages(): Promise<PipelineStage[]> {
    try {
      const { data, error } = await supabase
        .from('lead_pipeline_stages')
        .select('*')
        .order('order_index');

      if (error) throw error;

      logger.info('Pipeline stages fetched', { count: data?.length });
      return data || [];
    } catch (error) {
      logger.error('Error fetching pipeline stages', error);
      throw new Error('Erro ao buscar etapas do funil');
    }
  },

  /**
   * Buscar leads agrupados por etapa
   */
  async getLeadsByStage(): Promise<LeadsByStage[]> {
    try {
      // Buscar todas as etapas
      const stages = await this.getStages();

      // Buscar todos os leads com suas etapas
      const { data: leads, error } = await supabase
        .from('leads')
        .select(`
          *,
          imovel:imoveis(codigo, endereco),
          stage:lead_pipeline_stages(*)
        `)
        .order('created_at', { ascending: false });

      if (error) throw error;

      // Agrupar leads por etapa
      const leadsMap = new Map<string, Lead[]>();

      // Inicializar mapa com todas as etapas
      stages.forEach((stage) => {
        leadsMap.set(stage.id, []);
      });

      // Distribuir leads nas etapas
      leads?.forEach((lead: any) => {
        const stageId = lead.stage_id;
        if (stageId && leadsMap.has(stageId)) {
          leadsMap.get(stageId)!.push(lead);
        }
      });

      // Converter para array
      const result: LeadsByStage[] = stages.map((stage) => ({
        stage,
        leads: leadsMap.get(stage.id) || [],
      }));

      logger.info('Leads grouped by stage', {
        totalStages: stages.length,
        totalLeads: leads?.length || 0,
      });

      return result;
    } catch (error) {
      logger.error('Error fetching leads by stage', error);
      throw new Error('Erro ao buscar leads por etapa');
    }
  },

  /**
   * Mover lead para outra etapa
   */
  async moveLeadToStage(
    leadId: string,
    toStageId: string,
    notes?: string
  ): Promise<void> {
    try {
      const { error } = await supabase
        .from('leads')
        .update({
          stage_id: toStageId,
          updated_at: new Date().toISOString(),
        })
        .eq('id', leadId);

      if (error) throw error;

      // Se tiver notas, adicionar ao histórico manualmente
      if (notes) {
        await supabase.from('lead_stage_history').update({ notes }).eq('lead_id', leadId).order('changed_at', { ascending: false }).limit(1);
      }

      logger.info('Lead moved to stage', { leadId, toStageId, notes });
    } catch (error) {
      logger.error('Error moving lead to stage', error);
      throw new Error('Erro ao mover lead para nova etapa');
    }
  },

  /**
   * Marcar lead como perdido
   */
  async markAsLost(
    leadId: string,
    lostReasonId: string,
    notes?: string
  ): Promise<void> {
    try {
      // Buscar etapa "Perdido"
      const { data: lostStage, error: stageError } = await supabase
        .from('lead_pipeline_stages')
        .select('id')
        .eq('is_final', true)
        .eq('is_won', false)
        .single();

      if (stageError) throw stageError;

      // Atualizar lead
      const { error } = await supabase
        .from('leads')
        .update({
          stage_id: lostStage.id,
          lost_reason_id: lostReasonId,
          updated_at: new Date().toISOString(),
        })
        .eq('id', leadId);

      if (error) throw error;

      logger.info('Lead marked as lost', { leadId, lostReasonId, notes });
    } catch (error) {
      logger.error('Error marking lead as lost', error);
      throw new Error('Erro ao marcar lead como perdido');
    }
  },

  /**
   * Marcar lead como ganho
   */
  async markAsWon(leadId: string, notes?: string): Promise<void> {
    try {
      // Buscar etapa "Fechado/Ganho"
      const { data: wonStage, error: stageError } = await supabase
        .from('lead_pipeline_stages')
        .select('id')
        .eq('is_final', true)
        .eq('is_won', true)
        .single();

      if (stageError) throw stageError;

      // Atualizar lead
      const { error } = await supabase
        .from('leads')
        .update({
          stage_id: wonStage.id,
          updated_at: new Date().toISOString(),
        })
        .eq('id', leadId);

      if (error) throw error;

      logger.info('Lead marked as won', { leadId, notes });
    } catch (error) {
      logger.error('Error marking lead as won', error);
      throw new Error('Erro ao marcar lead como ganho');
    }
  },

  /**
   * Buscar histórico de mudanças de um lead
   */
  async getStageHistory(leadId: string): Promise<StageHistory[]> {
    try {
      const { data, error } = await supabase
        .from('lead_stage_history')
        .select(`
          *,
          from_stage:lead_pipeline_stages!lead_stage_history_from_stage_id_fkey(name),
          to_stage:lead_pipeline_stages!lead_stage_history_to_stage_id_fkey(name)
        `)
        .eq('lead_id', leadId)
        .order('changed_at', { ascending: false });

      if (error) throw error;

      logger.info('Stage history fetched', { leadId, count: data?.length });
      return data || [];
    } catch (error) {
      logger.error('Error fetching stage history', error);
      throw new Error('Erro ao buscar histórico de mudanças');
    }
  },

  /**
   * Buscar motivos de perda
   */
  async getLostReasons(): Promise<LostReason[]> {
    try {
      const { data, error } = await supabase
        .from('lost_reasons')
        .select('*')
        .eq('is_active', true)
        .order('order_index');

      if (error) throw error;

      logger.info('Lost reasons fetched', { count: data?.length });
      return data || [];
    } catch (error) {
      logger.error('Error fetching lost reasons', error);
      throw new Error('Erro ao buscar motivos de perda');
    }
  },

  /**
   * Calcular métricas do funil
   */
  async getMetrics(): Promise<PipelineMetrics[]> {
    try {
      const { data, error } = await supabase.rpc('get_pipeline_metrics');

      if (error) throw error;

      // Mapear para incluir campos faltantes
      const metrics: PipelineMetrics[] = (data || []).map((item: any) => ({
        stage_id: item.stage_id,
        stage_name: item.stage_name,
        stage_order: 0, // Não disponível na função atual
        lead_count: item.lead_count,
        avg_duration_days: 0, // Não disponível na função atual
        conversion_rate: item.conversion_rate,
      }));

      logger.info('Pipeline metrics calculated', {
        stagesCount: metrics.length,
      });

      return metrics;
    } catch (error) {
      logger.error('Error calculating pipeline metrics', error);
      throw new Error('Erro ao calcular métricas do funil');
    }
  },

  /**
   * Buscar leads em risco (parados há muito tempo)
   */
  async getStuckLeads(days: number = 7): Promise<Lead[]> {
    try {
      const cutoffDate = new Date();
      cutoffDate.setDate(cutoffDate.getDate() - days);

      const { data, error } = await supabase
        .from('leads')
        .select(`
          *,
          stage:lead_pipeline_stages(*),
          imovel:imoveis(codigo, endereco)
        `)
        .lt('updated_at', cutoffDate.toISOString())
        .not('stage_id', 'in', `(
          SELECT id FROM lead_pipeline_stages WHERE is_final = true
        )`)
        .order('updated_at', { ascending: true });

      if (error) throw error;

      logger.info('Stuck leads found', { count: data?.length, days });
      return (data || []) as Lead[];
    } catch (error) {
      logger.error('Error fetching stuck leads', error);
      throw new Error('Erro ao buscar leads parados');
    }
  },
};
