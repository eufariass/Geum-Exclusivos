-- Adicionar coluna CEP na tabela imoveis
ALTER TABLE public.imoveis 
ADD COLUMN cep TEXT;

-- Adicionar comentário explicativo
COMMENT ON COLUMN public.imoveis.cep IS 'CEP do imóvel para geolocalização no mapa';