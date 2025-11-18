-- Add campo tipos_disponiveis to imoveis table
ALTER TABLE public.imoveis 
ADD COLUMN tipos_disponiveis TEXT[] DEFAULT ARRAY['Venda', 'Locação']::TEXT[];

-- Add comment to explain the field
COMMENT ON COLUMN public.imoveis.tipos_disponiveis IS 'Tipos de negócio disponíveis para o imóvel: Venda, Locação ou ambos';