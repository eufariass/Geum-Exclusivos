-- CMS Tables Migration

BEGIN;

-- 1. Site Sections (Hero, Vitrines, etc.)
CREATE TABLE IF NOT EXISTS site_sections (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  type TEXT NOT NULL, -- 'hero', 'property_list', 'banner_carousel', 'media_grid'
  title TEXT,
  subtitle TEXT,
  order_index INTEGER NOT NULL DEFAULT 0,
  content JSONB DEFAULT '{}'::jsonb, -- Store filters, background images, specific configs
  active BOOLEAN DEFAULT true,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- 2. Site Banners (Carousel Items)
CREATE TABLE IF NOT EXISTS site_banners (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  title TEXT,
  image_url TEXT NOT NULL,
  link_url TEXT,
  desktop_image_url TEXT, -- Optional separate image for desktop
  mobile_image_url TEXT, -- Optional separate image for mobile
  order_index INTEGER NOT NULL DEFAULT 0,
  active BOOLEAN DEFAULT true,
  external_link BOOLEAN DEFAULT false,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- 3. Enable RLS
ALTER TABLE site_sections ENABLE ROW LEVEL SECURITY;
ALTER TABLE site_banners ENABLE ROW LEVEL SECURITY;

-- 4. Policies (Public Read, Admin Write)
CREATE POLICY "Public read access for site_sections" ON site_sections
  FOR SELECT USING (true);

CREATE POLICY "Admin write access for site_sections" ON site_sections
  FOR ALL USING (auth.role() = 'authenticated'); -- Assuming authenticated users are admins for now

CREATE POLICY "Public read access for site_banners" ON site_banners
  FOR SELECT USING (true);

CREATE POLICY "Admin write access for site_banners" ON site_banners
  FOR ALL USING (auth.role() = 'authenticated');

COMMIT;
