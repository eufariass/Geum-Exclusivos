-- Seed CMS Content Migration

BEGIN;

-- 1. Insert Banners
INSERT INTO site_banners (id, title, image_url, link_url, external_link, order_index, active) VALUES
  (gen_random_uuid(), 'Imóveis Exclusivos Geum', '/assets/banner-exclusividade.jpg', '/', false, 0, true),
  (gen_random_uuid(), 'Geum Cast - Podcast Imobiliário', '/assets/banner-geumcast.jpg', 'https://www.youtube.com/@geumcast', true, 1, true);

-- 2. Insert Sections
-- Destaques
INSERT INTO site_sections (id, type, title, subtitle, order_index, active, content) VALUES
  (gen_random_uuid(), 'property_list', 'Destaques', 'Imóveis selecionados para você', 0, true, 
   '{ "filters": { "featured": true } }'::jsonb);

-- Gleba Palhano
INSERT INTO site_sections (id, type, title, subtitle, order_index, active, content) VALUES
  (gen_random_uuid(), 'property_list', 'Gleba Palhano', 'A região mais valorizada de Londrina', 1, true, 
   '{ "filters": { "neighborhoods": ["gleba", "palhano"] } }'::jsonb);

-- Banner Carousel (Placeholder for position, though usually fixed, user might want to move it)
-- Note: Currently the frontend has fixed position for carousel. If we want it dynamic, we treat it as a section.
-- For now, let's keep the carousel fixed in frontend OR make it a section type 'banner_carousel'.
-- The user said "banners que temos... e as sessões atuais...".
-- Let's make the Carousel a section too so it can be reordered!
INSERT INTO site_sections (id, type, title, subtitle, order_index, active, content) VALUES
  (gen_random_uuid(), 'banner_carousel', 'Banner Principal', null, 2, true, '{}'::jsonb);

-- Casas em Condomínio
INSERT INTO site_sections (id, type, title, subtitle, order_index, active, content) VALUES
  (gen_random_uuid(), 'property_list', 'Casas em Condomínio', 'Segurança e conforto para sua família', 3, true, 
   '{ "filters": { "property_types": ["condo", "condomínio", "house in condominium"], "features": ["condomínio"] } }'::jsonb);

-- Terrenos
INSERT INTO site_sections (id, type, title, subtitle, order_index, active, content) VALUES
  (gen_random_uuid(), 'property_list', 'Terrenos', 'Construa o sonho da sua vida', 4, true, 
   '{ "filters": { "property_types": ["land", "lot", "terreno"] } }'::jsonb);

-- Lançamentos
INSERT INTO site_sections (id, type, title, subtitle, order_index, active, content) VALUES
  (gen_random_uuid(), 'property_list', 'Lançamentos', 'Novidades e empreendimentos na planta', 5, true, 
   '{ "filters": { "publication_type": "Launch", "features": ["lançamento"], "property_types": ["development"] } }'::jsonb);

-- Media Section
INSERT INTO site_sections (id, type, title, subtitle, order_index, active, content) VALUES
  (gen_random_uuid(), 'media_grid', 'Geum na Mídia', 'Confira o que os principais portais de notícias falam sobre a Imobiliária Geum.', 6, true, '{}'::jsonb);

COMMIT;
