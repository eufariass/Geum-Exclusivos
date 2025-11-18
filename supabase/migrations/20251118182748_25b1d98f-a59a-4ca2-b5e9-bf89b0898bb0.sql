-- Create lead_comments table
CREATE TABLE public.lead_comments (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  lead_id UUID NOT NULL REFERENCES public.leads(id) ON DELETE CASCADE,
  comment TEXT NOT NULL,
  created_by UUID REFERENCES auth.users(id),
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Enable RLS
ALTER TABLE public.lead_comments ENABLE ROW LEVEL SECURITY;

-- Create policies
CREATE POLICY "Autenticados podem ver comentários"
ON public.lead_comments
FOR SELECT
USING (true);

CREATE POLICY "Autenticados podem criar comentários"
ON public.lead_comments
FOR INSERT
WITH CHECK (true);

CREATE POLICY "Autenticados podem deletar comentários"
ON public.lead_comments
FOR DELETE
USING (true);

-- Create index for better performance
CREATE INDEX idx_lead_comments_lead_id ON public.lead_comments(lead_id);
CREATE INDEX idx_lead_comments_created_at ON public.lead_comments(created_at DESC);