-- Criar função para retornar usuários com suas roles
-- Esta função contorna problemas de RLS ao fazer um JOIN direto
CREATE OR REPLACE FUNCTION public.get_users_with_roles()
RETURNS TABLE (
  id uuid,
  nome_completo text,
  email text,
  avatar_url text,
  cargo text,
  status text,
  role app_role,
  created_at timestamptz
)
LANGUAGE sql
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT 
    p.id,
    p.nome_completo,
    p.email,
    p.avatar_url,
    p.cargo,
    p.status,
    COALESCE(ur.role, 'corretor'::app_role) as role,
    p.created_at
  FROM profiles p
  LEFT JOIN user_roles ur ON p.id = ur.user_id
  ORDER BY p.created_at DESC;
$$;