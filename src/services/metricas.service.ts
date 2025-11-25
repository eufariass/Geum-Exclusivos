/**
 * Métricas Service
 * Business logic for property metrics
 */
import { supabase } from '@/integrations/supabase/client';
import type { Metrica } from '@/types';
import { logger } from '@/lib/logger';

export const metricasService = {
  /**
   * Get all metrics
   */
  async getMetricas(): Promise<Metrica[]> {
    try {
      const { data, error } = await supabase
        .from('metricas')
        .select('*')
        .order('mes', { ascending: false });

      if (error) throw error;
      return data || [];
    } catch (error) {
      logger.error('Error fetching metricas', error);
      throw error;
    }
  },

  /**
   * Get metrics for a specific property and month
   */
  async getMetricaByImovelMes(imovelId: string, mes: string): Promise<Metrica | null> {
    try {
      const { data, error } = await supabase
        .from('metricas')
        .select('*')
        .eq('imovel_id', imovelId)
        .eq('mes', mes)
        .maybeSingle();

      if (error) throw error;
      return data;
    } catch (error) {
      logger.error('Error fetching metrica', { imovelId, mes, error });
      throw error;
    }
  },

  /**
   * Get metrics for a specific property
   */
  async getMetricasByImovel(imovelId: string): Promise<Metrica[]> {
    try {
      const { data, error } = await supabase
        .from('metricas')
        .select('*')
        .eq('imovel_id', imovelId)
        .order('mes', { ascending: false });

      if (error) throw error;
      return data || [];
    } catch (error) {
      logger.error('Error fetching metricas by imovel', { imovelId, error });
      throw error;
    }
  },

  /**
   * Get metrics for a specific month
   */
  async getMetricasByMes(mes: string): Promise<Metrica[]> {
    try {
      const { data, error } = await supabase
        .from('metricas')
        .select('*')
        .eq('mes', mes);

      if (error) throw error;
      return data || [];
    } catch (error) {
      logger.error('Error fetching metricas by mes', { mes, error });
      throw error;
    }
  },

  /**
   * Create a new metric
   */
  async createMetrica(metrica: Omit<Metrica, 'id' | 'created_at'>): Promise<Metrica> {
    try {
      const { data, error } = await supabase
        .from('metricas')
        .insert([metrica])
        .select()
        .single();

      if (error) throw error;

      logger.info('Metrica created', { imovelId: metrica.imovel_id, mes: metrica.mes });
      return data;
    } catch (error) {
      logger.error('Error creating metrica', { metrica, error });
      throw error;
    }
  },

  /**
   * Update an existing metric
   */
  async updateMetrica(imovelId: string, mes: string, updates: Partial<Metrica>): Promise<Metrica> {
    try {
      const { data, error } = await supabase
        .from('metricas')
        .update(updates)
        .eq('imovel_id', imovelId)
        .eq('mes', mes)
        .select()
        .single();

      if (error) throw error;

      logger.info('Metrica updated', { imovelId, mes });
      return data;
    } catch (error) {
      logger.error('Error updating metrica', { imovelId, mes, updates, error });
      throw error;
    }
  },

  /**
   * Delete a metric
   */
  async deleteMetrica(id: string): Promise<void> {
    try {
      const { error } = await supabase
        .from('metricas')
        .delete()
        .eq('id', id);

      if (error) throw error;

      logger.info('Metrica deleted', { id });
    } catch (error) {
      logger.error('Error deleting metrica', { id, error });
      throw error;
    }
  },

  /**
   * Create or update metric (upsert)
   */
  async upsertMetrica(metrica: Omit<Metrica, 'id' | 'created_at'>): Promise<Metrica> {
    try {
      // Check if exists
      const existing = await this.getMetricaByImovelMes(metrica.imovel_id, metrica.mes);

      if (existing) {
        // Update
        return await this.updateMetrica(metrica.imovel_id, metrica.mes, metrica);
      } else {
        // Create
        return await this.createMetrica(metrica);
      }
    } catch (error) {
      logger.error('Error upserting metrica', { metrica, error });
      throw error;
    }
  },

  /**
   * Increment view count for a property in current month
   */
  async incrementVisualizacoes(imovelId: string): Promise<void> {
    try {
      const currentMonth = new Date().toISOString().slice(0, 7); // YYYY-MM
      const existing = await this.getMetricaByImovelMes(imovelId, currentMonth);

      if (existing) {
        await supabase
          .from('metricas')
          .update({ visualizacoes: (existing.visualizacoes || 0) + 1 })
          .eq('imovel_id', imovelId)
          .eq('mes', currentMonth);
      } else {
        await this.createMetrica({
          imovel_id: imovelId,
          mes: currentMonth,
          visualizacoes: 1,
          leads: 0,
          visitas_realizadas: 0,
        } as Omit<Metrica, 'id' | 'created_at'>);
      }

      logger.debug('Visualizacoes incremented', { imovelId, mes: currentMonth });
    } catch (error) {
      logger.error('Error incrementing visualizacoes', { imovelId, error });
      // Don't throw - view tracking is not critical
    }
  },
};
