import { supabase } from '@/integrations/supabase/client';
import { STORAGE } from '@/lib/constants';
import { logger } from '@/lib/logger';

export interface SiteSection {
    id: string;
    type: string;
    title: string | null;
    subtitle: string | null;
    order_index: number;
    content: Record<string, any>;
    active: boolean;
    created_at?: string;
    updated_at?: string;
}

export interface SiteBanner {
    id: string;
    title: string | null;
    image_url: string;
    link_url: string | null;
    desktop_image_url: string | null;
    mobile_image_url: string | null;
    order_index: number;
    active: boolean;
    external_link: boolean;
    created_at?: string;
    updated_at?: string;
}

export const cmsService = {
    // --- Site Sections ---

    async getSections() {
        try {
            const { data, error } = await supabase
                .from('site_sections')
                .select('*')
                .order('order_index', { ascending: true });

            if (error) throw error;
            return data as SiteSection[];
        } catch (error) {
            logger.error('Error fetching site sections', error);
            throw error;
        }
    },

    async updateSection(id: string, updates: Partial<SiteSection>) {
        try {
            const { data, error } = await supabase
                .from('site_sections')
                .update(updates)
                .eq('id', id)
                .select()
                .single();

            if (error) throw error;
            return data as SiteSection;
        } catch (error) {
            logger.error('Error updating site section', { id, error });
            throw error;
        }
    },

    async reorderSections(sectionIds: string[]) {
        try {
            const { error } = await supabase.rpc('reorder_site_sections', {
                section_ids: sectionIds,
            });

            if (error) throw error;
        } catch (error) {
            logger.error('Error reordering site sections', error);
            throw error;
        }
    },

    // --- Site Banners ---

    async getBanners() {
        try {
            const { data, error } = await supabase
                .from('site_banners')
                .select('*')
                .order('order_index', { ascending: true });

            if (error) throw error;
            return data as SiteBanner[];
        } catch (error) {
            logger.error('Error fetching site banners', error);
            throw error;
        }
    },

    async createBanner(banner: Omit<SiteBanner, 'id' | 'created_at' | 'updated_at'>) {
        try {
            const { data, error } = await supabase
                .from('site_banners')
                .insert(banner)
                .select()
                .single();

            if (error) throw error;
            return data as SiteBanner;
        } catch (error) {
            logger.error('Error creating site banner', error);
            throw error;
        }
    },

    async updateBanner(id: string, updates: Partial<SiteBanner>) {
        try {
            const { data, error } = await supabase
                .from('site_banners')
                .update(updates)
                .eq('id', id)
                .select()
                .single();

            if (error) throw error;
            return data as SiteBanner;
        } catch (error) {
            logger.error('Error updating site banner', { id, error });
            throw error;
        }
    },

    async deleteBanner(id: string) {
        try {
            const { error } = await supabase
                .from('site_banners')
                .delete()
                .eq('id', id);

            if (error) throw error;
        } catch (error) {
            logger.error('Error deleting site banner', { id, error });
            throw error;
        }
    },

    async reorderBanners(bannerIds: string[]) {
        try {
            const { error } = await supabase.rpc('reorder_site_banners', {
                banner_ids: bannerIds,
            });

            if (error) throw error;
        } catch (error) {
            logger.error('Error reordering site banners', error);
            throw error;
        }
    },

    async uploadBannerImage(file: File): Promise<string> {
        try {
            const fileExt = file.name.split('.').pop();
            const fileName = `banners/banner-${Date.now()}.${fileExt}`;

            const { error: uploadError } = await supabase.storage
                .from(STORAGE.BUCKET_NAME)
                .upload(fileName, file, {
                    cacheControl: '3600',
                    upsert: false,
                });

            if (uploadError) throw uploadError;

            const { data: { publicUrl } } = supabase.storage
                .from(STORAGE.BUCKET_NAME)
                .getPublicUrl(fileName);

            return publicUrl;
        } catch (error) {
            logger.error('Error uploading banner image', error);
            throw error;
        }
    },

    async getFilterOptions() {
        try {
            const { data, error } = await supabase
                .from('imoveis_arbo')
                .select('neighborhood, property_type, publication_type')
                .eq('active', true);

            if (error) throw error;

            const neighborhoods = [...new Set(data.map(i => i.neighborhood).filter(Boolean))].sort();
            const propertyTypes = [...new Set(data.map(i => i.property_type).filter(Boolean))].sort();
            const publicationTypes = [...new Set(data.map(i => i.publication_type).filter(Boolean))].sort();

            return { neighborhoods, propertyTypes, publicationTypes };
        } catch (error) {
            logger.error('Error fetching filter options', error);
            throw error;
        }
    },
};
