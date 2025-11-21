-- Adicionar campos detalhados de endereço na tabela imoveis
ALTER TABLE public.imoveis 
ADD COLUMN rua TEXT,
ADD COLUMN numero TEXT,
ADD COLUMN bairro TEXT,
ADD COLUMN cidade TEXT DEFAULT 'Londrina',
ADD COLUMN estado TEXT DEFAULT 'PR';

-- Adicionar comentários explicativos
COMMENT ON COLUMN public.imoveis.rua IS 'Nome da rua/avenida (preenchido automaticamente via CEP)';
COMMENT ON COLUMN public.imoveis.numero IS 'Número do imóvel (preenchido manualmente)';
COMMENT ON COLUMN public.imoveis.bairro IS 'Bairro (preenchido automaticamente via CEP)';
COMMENT ON COLUMN public.imoveis.cidade IS 'Cidade do imóvel';
COMMENT ON COLUMN public.imoveis.estado IS 'Estado (UF)';