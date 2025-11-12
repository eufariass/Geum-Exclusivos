-- Alterar coluna image_url para image_urls (array de URLs)
ALTER TABLE public.imoveis 
DROP COLUMN IF EXISTS image_url;

ALTER TABLE public.imoveis 
ADD COLUMN image_urls text[] DEFAULT ARRAY[]::text[];