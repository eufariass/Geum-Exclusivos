-- Seed Hero Section
BEGIN;

INSERT INTO site_sections (id, type, title, subtitle, order_index, active, content) VALUES
  (gen_random_uuid(), 'hero', 'Imobiliária Geum.', 'Encontre seu próximo imóvel.', -1, true, 
   '{ "background_image": "/assets/londrina-hero.jpg" }'::jsonb);

COMMIT;
