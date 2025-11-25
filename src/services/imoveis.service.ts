/**
 * Imóveis Service
 * Business logic for properties (imóveis)
 */
import { supabase } from '@/integrations/supabase/client';
import type { Imovel } from '@/types';
import { STORAGE, PAGINATION } from '@/lib/constants';
import { logger } from '@/lib/logger';

export interface GetImoveisOptions {
  page?: number;
  pageSize?: number;
  search?: string;
  tipo?: string;
  tipoNegocio?: 'Venda' | 'Locação';
}

export interface PaginatedResponse<T> {
  data: T[];
  total: number;
  page: number;
  pageSize: number;
  totalPages: number;
}

export const imoveisService = {
  /**
   * Get all properties with optional filtering and pagination
   */
  async getImoveis(options: GetImoveisOptions = {}): Promise<PaginatedResponse<Imovel>> {
    const {
      page = 1,
      pageSize = PAGINATION.DEFAULT_PAGE_SIZE,
      search,
      tipo,
      tipoNegocio,
    } = options;

    try {
      let query = supabase
        .from('imoveis')
        .select('*', { count: 'exact' });

      // Apply filters
      if (search) {
        query = query.or(`codigo.ilike.%${search}%,cliente.ilike.%${search}%,endereco.ilike.%${search}%`);
      }

      if (tipo) {
        query = query.eq('tipo', tipo);
      }

      if (tipoNegocio) {
        query = query.contains('tipos_disponiveis', [tipoNegocio]);
      }

      // Apply pagination
      const from = (page - 1) * pageSize;
      const to = from + pageSize - 1;

      const { data, error, count } = await query
        .order('created_at', { ascending: false })
        .range(from, to);

      if (error) throw error;

      const total = count ?? 0;
      const totalPages = Math.ceil(total / pageSize);

      return {
        data: (data || []) as Imovel[],
        total,
        page,
        pageSize,
        totalPages,
      };
    } catch (error) {
      logger.error('Error fetching imoveis', error);
      throw error;
    }
  },

  /**
   * Get a single property by ID
   */
  async getImovelById(id: string): Promise<Imovel> {
    try {
      const { data, error } = await supabase
        .from('imoveis')
        .select('*')
        .eq('id', id)
        .single();

      if (error) throw error;
      return data as Imovel;
    } catch (error) {
      logger.error('Error fetching imovel by ID', { id, error });
      throw error;
    }
  },

  /**
   * Get a property by codigo (unique code)
   */
  async getImovelByCodigo(codigo: string): Promise<Imovel | null> {
    try {
      const { data, error } = await supabase
        .from('imoveis')
        .select('*')
        .eq('codigo', codigo)
        .maybeSingle();

      if (error) throw error;
      return data as Imovel | null;
    } catch (error) {
      logger.error('Error fetching imovel by codigo', { codigo, error });
      throw error;
    }
  },

  /**
   * Create a new property
   */
  async createImovel(imovel: Omit<Imovel, 'id' | 'created_at'>): Promise<Imovel> {
    try {
      const { data, error } = await supabase
        .from('imoveis')
        .insert([imovel])
        .select()
        .single();

      if (error) throw error;

      logger.info('Imovel created', { codigo: imovel.codigo });
      return data as Imovel;
    } catch (error) {
      logger.error('Error creating imovel', { imovel, error });
      throw error;
    }
  },

  /**
   * Update an existing property
   */
  async updateImovel(id: string, updates: Partial<Imovel>): Promise<Imovel> {
    try {
      const { data, error } = await supabase
        .from('imoveis')
        .update(updates)
        .eq('id', id)
        .select()
        .single();

      if (error) throw error;

      logger.info('Imovel updated', { id });
      return data as Imovel;
    } catch (error) {
      logger.error('Error updating imovel', { id, updates, error });
      throw error;
    }
  },

  /**
   * Delete a property
   */
  async deleteImovel(id: string): Promise<void> {
    try {
      // Get imovel to delete images
      const imovel = await this.getImovelById(id);

      // Delete from database
      const { error } = await supabase
        .from('imoveis')
        .delete()
        .eq('id', id);

      if (error) throw error;

      // Delete associated images
      if (imovel.image_urls && imovel.image_urls.length > 0) {
        await this.deleteImages(imovel.image_urls);
      }

      logger.info('Imovel deleted', { id });
    } catch (error) {
      logger.error('Error deleting imovel', { id, error });
      throw error;
    }
  },

  /**
   * Upload multiple images for a property
   */
  async uploadImages(files: File[], imovelId: string): Promise<string[]> {
    try {
      const uploadPromises = files.map(async (file) => {
        const fileExt = file.name.split('.').pop();
        const fileName = `${imovelId}-${Date.now()}-${Math.random().toString(36).substring(7)}.${fileExt}`;
        const filePath = `${fileName}`;

        const { error: uploadError } = await supabase.storage
          .from(STORAGE.BUCKET_NAME)
          .upload(filePath, file, {
            cacheControl: STORAGE.CACHE_CONTROL,
            upsert: true,
          });

        if (uploadError) throw uploadError;

        const { data: { publicUrl } } = supabase.storage
          .from(STORAGE.BUCKET_NAME)
          .getPublicUrl(filePath);

        return publicUrl;
      });

      const urls = await Promise.all(uploadPromises);
      logger.info('Images uploaded', { count: urls.length, imovelId });
      return urls;
    } catch (error) {
      logger.error('Error uploading images', { imovelId, error });
      throw error;
    }
  },

  /**
   * Delete multiple images from storage
   */
  async deleteImages(imageUrls: string[]): Promise<void> {
    try {
      const fileNames = imageUrls
        .map(url => url.split('/').pop())
        .filter(name => name) as string[];

      if (fileNames.length === 0) return;

      const { error } = await supabase.storage
        .from(STORAGE.BUCKET_NAME)
        .remove(fileNames);

      if (error) throw error;

      logger.info('Images deleted', { count: fileNames.length });
    } catch (error) {
      logger.error('Error deleting images', { imageUrls, error });
      // Don't throw - image deletion is not critical
    }
  },

  /**
   * Check if codigo already exists
   */
  async codigoExists(codigo: string, excludeId?: string): Promise<boolean> {
    try {
      let query = supabase
        .from('imoveis')
        .select('id')
        .eq('codigo', codigo);

      if (excludeId) {
        query = query.neq('id', excludeId);
      }

      const { data, error } = await query.maybeSingle();

      if (error) throw error;

      return data !== null;
    } catch (error) {
      logger.error('Error checking codigo existence', { codigo, error });
      throw error;
    }
  },
};
