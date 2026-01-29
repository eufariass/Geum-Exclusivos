import { supabase } from '@/integrations/supabase/client';
import type { Imovel, Metrica, ExportData } from '@/types';

export const supabaseStorageService = {
  // Imóveis
  async getImoveis(): Promise<Imovel[]> {
    const { data, error } = await supabase
      .from('imoveis')
      .select('*')
      .order('created_at', { ascending: false });

    if (error) throw error;
    return (data || []) as Imovel[];
  },

  async addImovel(imovel: Omit<Imovel, 'id' | 'created_at'>): Promise<Imovel> {
    const { data, error } = await supabase
      .from('imoveis')
      .insert([imovel])
      .select()
      .single();

    if (error) throw error;
    return data as Imovel;
  },

  async updateImovel(id: string, updates: Partial<Imovel>): Promise<void> {
    const { error } = await supabase
      .from('imoveis')
      .update(updates)
      .eq('id', id);

    if (error) throw error;
  },

  async deleteImovel(id: string): Promise<void> {
    const { error } = await supabase
      .from('imoveis')
      .delete()
      .eq('id', id);

    if (error) throw error;
  },

  // Upload de múltiplas imagens
  async uploadImages(files: File[], imovelId: string): Promise<string[]> {
    const uploadPromises = files.map(async (file) => {
      const fileExt = file.name.split('.').pop();
      const fileName = `${imovelId}-${Date.now()}-${Math.random().toString(36).substring(7)}.${fileExt}`;
      const filePath = `${fileName}`;

      const { error: uploadError } = await supabase.storage
        .from('imoveis')
        .upload(filePath, file, {
          cacheControl: '3600',
          upsert: true
        });

      if (uploadError) throw uploadError;

      const { data: { publicUrl } } = supabase.storage
        .from('imoveis')
        .getPublicUrl(filePath);

      return publicUrl;
    });

    return Promise.all(uploadPromises);
  },

  async deleteImages(imageUrls: string[]): Promise<void> {
    try {
      const fileNames = imageUrls
        .map(url => url.split('/').pop())
        .filter(name => name) as string[];

      if (fileNames.length === 0) return;

      await supabase.storage
        .from('imoveis')
        .remove(fileNames);
    } catch (error) {
      console.error('Erro ao deletar imagens:', error);
    }
  },

  // Métricas
  async getMetricas(): Promise<Metrica[]> {
    const { data, error } = await supabase
      .from('metricas')
      .select('*')
      .order('mes', { ascending: false });

    if (error) throw error;
    return data || [];
  },

  async addMetrica(metrica: Omit<Metrica, 'id' | 'created_at'>): Promise<Metrica> {
    const { data, error } = await supabase
      .from('metricas')
      .insert([metrica])
      .select()
      .single();

    if (error) throw error;
    return data;
  },

  async updateMetrica(imovelId: string, mes: string, updates: Partial<Metrica>): Promise<void> {
    const { error } = await supabase
      .from('metricas')
      .update(updates)
      .eq('imovel_id', imovelId)
      .eq('mes', mes);

    if (error) throw error;
  },

  async deleteMetrica(id: string): Promise<void> {
    const { error } = await supabase
      .from('metricas')
      .delete()
      .eq('id', id);

    if (error) throw error;
  },

  async getMetricaByImovelMes(imovelId: string, mes: string): Promise<Metrica | null> {
    const { data, error } = await supabase
      .from('metricas')
      .select('*')
      .eq('imovel_id', imovelId)
      .eq('mes', mes)
      .maybeSingle();

    if (error) throw error;
    return data;
  },

  // Export/Import
  async exportData(): Promise<ExportData> {
    const imoveis = await this.getImoveis();
    const metricas = await this.getMetricas();

    return {
      imoveis,
      metricas,
      dataExportacao: new Date().toISOString(),
      versao: '2.0',
    };
  },

  async importData(data: ExportData): Promise<void> {
    // Limpar dados existentes
    await supabase.from('metricas').delete().neq('id', '00000000-0000-0000-0000-000000000000');
    await supabase.from('imoveis').delete().neq('id', '00000000-0000-0000-0000-000000000000');

    // Importar imóveis
    if (data.imoveis && data.imoveis.length > 0) {
      const { error: imoveisError } = await supabase
        .from('imoveis')
        .insert(data.imoveis);

      if (imoveisError) throw imoveisError;
    }

    // Importar métricas
    if (data.metricas && data.metricas.length > 0) {
      const { error: metricasError } = await supabase
        .from('metricas')
        .insert(data.metricas);

      if (metricasError) throw metricasError;
    }
  },

  // Comentários e Histórico
  async getImovelComments(imovelId: string): Promise<any[]> {
    const { data, error } = await supabase
      .from('imovel_comments' as any)
      .select('*')
      .eq('imovel_id', imovelId)
      .order('created_at', { ascending: false });

    if (error) {
      console.warn('Error fetching comments (table might not exist yet):', error);
      return [];
    }
    return data || [];
  },

  async addImovelComment(comment: { imovel_id: string; content: string; created_by: string; created_by_name: string }): Promise<any> {
    const { data, error } = await supabase
      .from('imovel_comments' as any)
      .insert([comment])
      .select()
      .single();

    if (error) throw error;
    return data;
  },

  async getImovelHistory(imovelId: string): Promise<any[]> {
    const { data, error } = await supabase
      .from('imovel_history' as any)
      .select('*')
      .eq('imovel_id', imovelId)
      .order('created_at', { ascending: false });

    if (error) {
      console.warn('Error fetching history (table might not exist yet):', error);
      return [];
    }
    return data || [];
  },

  async logImovelHistory(history: { imovel_id: string; action: string; description: string; created_by: string; created_by_name: string }): Promise<void> {
    try {
      await supabase
        .from('imovel_history' as any)
        .insert([history]);
    } catch (error) {
      console.warn('Error logging history:', error);
    }
  },
};
