-- Adicionar campo de plataformas de anúncio aos imóveis
ALTER TABLE public.imoveis 
ADD COLUMN plataformas_anuncio text[] DEFAULT ARRAY[]::text[];

COMMENT ON COLUMN public.imoveis.plataformas_anuncio IS 'Plataformas onde o imóvel está sendo anunciado (Meta, Google, etc)';