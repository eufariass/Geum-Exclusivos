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
    return data || [];
  },

  async addImovel(imovel: Omit<Imovel, 'id' | 'created_at'>): Promise<Imovel> {
    const { data, error } = await supabase
      .from('imoveis')
      .insert([imovel])
      .select()
      .single();
    
    if (error) throw error;
    return data;
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

  // Upload de imagem
  async uploadImage(file: File, imovelId: string): Promise<string> {
    const fileExt = file.name.split('.').pop();
    const fileName = `${imovelId}-${Date.now()}.${fileExt}`;
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
  },

  async deleteImage(imageUrl: string): Promise<void> {
    try {
      const fileName = imageUrl.split('/').pop();
      if (!fileName) return;

      await supabase.storage
        .from('imoveis')
        .remove([fileName]);
    } catch (error) {
      console.error('Erro ao deletar imagem:', error);
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
};
