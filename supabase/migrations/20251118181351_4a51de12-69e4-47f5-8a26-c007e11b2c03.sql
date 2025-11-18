-- Create leads table
CREATE TABLE public.leads (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  imovel_id UUID NOT NULL REFERENCES public.imoveis(id) ON DELETE CASCADE,
  nome TEXT NOT NULL,
  telefone TEXT NOT NULL,
  email TEXT NOT NULL,
  tipo_interesse TEXT NOT NULL CHECK (tipo_interesse IN ('Venda', 'Locação')),
  status TEXT NOT NULL DEFAULT 'Aguardando' CHECK (status IN ('Aguardando', 'Em Atendimento', 'Visita', 'Proposta', 'Fechado', 'Inativo')),
  observacoes TEXT,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  created_by UUID,
  updated_by UUID
);

-- Enable RLS
ALTER TABLE public.leads ENABLE ROW LEVEL SECURITY;

-- RLS Policies
CREATE POLICY "Todos podem criar leads"
ON public.leads
FOR INSERT
TO anon, authenticated
WITH CHECK (true);

CREATE POLICY "Autenticados podem ver leads"
ON public.leads
FOR SELECT
TO authenticated
USING (true);

CREATE POLICY "Autenticados podem atualizar leads"
ON public.leads
FOR UPDATE
TO authenticated
USING (true);

CREATE POLICY "Autenticados podem deletar leads"
ON public.leads
FOR DELETE
TO authenticated
USING (true);

-- Trigger for updated_at
CREATE TRIGGER update_leads_updated_at
BEFORE UPDATE ON public.leads
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at();

-- Index for better performance
CREATE INDEX idx_leads_imovel_id ON public.leads(imovel_id);
CREATE INDEX idx_leads_status ON public.leads(status);