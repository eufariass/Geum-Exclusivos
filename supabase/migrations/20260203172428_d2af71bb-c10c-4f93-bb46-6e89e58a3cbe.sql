-- Create site_sections table for CMS
CREATE TABLE IF NOT EXISTS public.site_sections (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  type TEXT NOT NULL,
  title TEXT,
  subtitle TEXT,
  order_index INTEGER NOT NULL DEFAULT 0,
  content JSONB NOT NULL DEFAULT '{}'::jsonb,
  active BOOLEAN NOT NULL DEFAULT true,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Create site_banners table for CMS
CREATE TABLE IF NOT EXISTS public.site_banners (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  title TEXT,
  image_url TEXT NOT NULL,
  link_url TEXT,
  desktop_image_url TEXT,
  mobile_image_url TEXT,
  order_index INTEGER NOT NULL DEFAULT 0,
  active BOOLEAN NOT NULL DEFAULT true,
  external_link BOOLEAN NOT NULL DEFAULT false,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Enable RLS
ALTER TABLE public.site_sections ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.site_banners ENABLE ROW LEVEL SECURITY;

-- Policies for site_sections (public read, authenticated write)
CREATE POLICY "Public can read site_sections" ON public.site_sections
  FOR SELECT USING (true);

CREATE POLICY "Authenticated can insert site_sections" ON public.site_sections
  FOR INSERT WITH CHECK (auth.role() = 'authenticated');

CREATE POLICY "Authenticated can update site_sections" ON public.site_sections
  FOR UPDATE USING (auth.role() = 'authenticated');

CREATE POLICY "Authenticated can delete site_sections" ON public.site_sections
  FOR DELETE USING (auth.role() = 'authenticated');

-- Policies for site_banners (public read, authenticated write)
CREATE POLICY "Public can read site_banners" ON public.site_banners
  FOR SELECT USING (true);

CREATE POLICY "Authenticated can insert site_banners" ON public.site_banners
  FOR INSERT WITH CHECK (auth.role() = 'authenticated');

CREATE POLICY "Authenticated can update site_banners" ON public.site_banners
  FOR UPDATE USING (auth.role() = 'authenticated');

CREATE POLICY "Authenticated can delete site_banners" ON public.site_banners
  FOR DELETE USING (auth.role() = 'authenticated');

-- Triggers for updated_at
CREATE TRIGGER update_site_sections_updated_at
  BEFORE UPDATE ON public.site_sections
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at();

CREATE TRIGGER update_site_banners_updated_at
  BEFORE UPDATE ON public.site_banners
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at();