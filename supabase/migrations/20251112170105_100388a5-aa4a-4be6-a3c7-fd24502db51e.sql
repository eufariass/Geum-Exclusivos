-- Tabela de imóveis
CREATE TABLE public.imoveis (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  codigo TEXT NOT NULL UNIQUE,
  cliente TEXT NOT NULL,
  endereco TEXT NOT NULL,
  tipo TEXT NOT NULL CHECK (tipo IN ('Casa', 'Apartamento', 'Terreno', 'Comercial', 'Rural')),
  valor NUMERIC,
  image_url TEXT,
  data_cadastro TIMESTAMP WITH TIME ZONE DEFAULT now(),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now()
);

-- Tabela de métricas
CREATE TABLE public.metricas (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  imovel_id UUID NOT NULL REFERENCES public.imoveis(id) ON DELETE CASCADE,
  mes TEXT NOT NULL,
  leads INTEGER NOT NULL DEFAULT 0,
  visualizacoes INTEGER NOT NULL DEFAULT 0,
  visitas_realizadas INTEGER NOT NULL DEFAULT 0,
  data_registro TIMESTAMP WITH TIME ZONE DEFAULT now(),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
  UNIQUE(imovel_id, mes)
);

-- Índices para melhor performance
CREATE INDEX idx_metricas_imovel_id ON public.metricas(imovel_id);
CREATE INDEX idx_metricas_mes ON public.metricas(mes);

-- Habilitar RLS
ALTER TABLE public.imoveis ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.metricas ENABLE ROW LEVEL SECURITY;

-- Políticas RLS públicas (todos podem ler/escrever)
-- Imóveis
CREATE POLICY "Todos podem ver imóveis"
  ON public.imoveis FOR SELECT
  USING (true);

CREATE POLICY "Todos podem criar imóveis"
  ON public.imoveis FOR INSERT
  WITH CHECK (true);

CREATE POLICY "Todos podem atualizar imóveis"
  ON public.imoveis FOR UPDATE
  USING (true);

CREATE POLICY "Todos podem deletar imóveis"
  ON public.imoveis FOR DELETE
  USING (true);

-- Métricas
CREATE POLICY "Todos podem ver métricas"
  ON public.metricas FOR SELECT
  USING (true);

CREATE POLICY "Todos podem criar métricas"
  ON public.metricas FOR INSERT
  WITH CHECK (true);

CREATE POLICY "Todos podem atualizar métricas"
  ON public.metricas FOR UPDATE
  USING (true);

CREATE POLICY "Todos podem deletar métricas"
  ON public.metricas FOR DELETE
  USING (true);

-- Bucket para imagens de imóveis
INSERT INTO storage.buckets (id, name, public) 
VALUES ('imoveis', 'imoveis', true);

-- Políticas de storage para imagens públicas
CREATE POLICY "Imagens são públicas"
  ON storage.objects FOR SELECT
  USING (bucket_id = 'imoveis');

CREATE POLICY "Qualquer um pode fazer upload de imagens"
  ON storage.objects FOR INSERT
  WITH CHECK (bucket_id = 'imoveis');

CREATE POLICY "Qualquer um pode atualizar imagens"
  ON storage.objects FOR UPDATE
  USING (bucket_id = 'imoveis');

CREATE POLICY "Qualquer um pode deletar imagens"
  ON storage.objects FOR DELETE
  USING (bucket_id = 'imoveis');