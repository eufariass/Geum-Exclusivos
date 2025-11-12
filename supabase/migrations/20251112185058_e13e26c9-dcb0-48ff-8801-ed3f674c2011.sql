-- Adicionar colunas de características do imóvel
ALTER TABLE public.imoveis 
ADD COLUMN quartos INTEGER,
ADD COLUMN banheiros INTEGER,
ADD COLUMN area_m2 NUMERIC,
ADD COLUMN vagas INTEGER;