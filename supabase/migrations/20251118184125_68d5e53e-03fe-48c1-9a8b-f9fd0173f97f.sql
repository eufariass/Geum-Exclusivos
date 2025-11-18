-- Drop the old check constraint
ALTER TABLE public.leads 
DROP CONSTRAINT IF EXISTS leads_status_check;

-- Add new check constraint with the updated status values
ALTER TABLE public.leads 
ADD CONSTRAINT leads_status_check 
CHECK (status IN ('Aguardando', 'Enviado ao corretor', 'Follow up'));

-- Update any existing leads with old status values to new ones
UPDATE public.leads 
SET status = CASE 
  WHEN status = 'Em Atendimento' THEN 'Enviado ao corretor'
  WHEN status = 'Visita' THEN 'Follow up'
  WHEN status = 'Proposta' THEN 'Follow up'
  WHEN status = 'Fechado' THEN 'Follow up'
  WHEN status = 'Inativo' THEN 'Follow up'
  ELSE status
END
WHERE status NOT IN ('Aguardando', 'Enviado ao corretor', 'Follow up');