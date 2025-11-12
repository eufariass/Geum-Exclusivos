-- Adiciona coluna para armazenar o índice da imagem de capa
ALTER TABLE public.imoveis
ADD COLUMN cover_image_index integer DEFAULT 0;