-- 1. Create enum for roles
CREATE TYPE public.app_role AS ENUM ('admin', 'corretor');

-- 2. Create user_roles table
CREATE TABLE public.user_roles (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  role app_role NOT NULL DEFAULT 'corretor',
  created_at timestamptz DEFAULT now(),
  UNIQUE (user_id, role)
);

-- Enable RLS
ALTER TABLE public.user_roles ENABLE ROW LEVEL SECURITY;

-- 3. Create security definer functions
CREATE OR REPLACE FUNCTION public.has_role(_user_id uuid, _role app_role)
RETURNS boolean
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT EXISTS (
    SELECT 1
    FROM public.user_roles
    WHERE user_id = _user_id
      AND role = _role
  )
$$;

CREATE OR REPLACE FUNCTION public.get_user_role(_user_id uuid)
RETURNS app_role
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT role FROM public.user_roles WHERE user_id = _user_id LIMIT 1
$$;

-- 4. RLS policies for user_roles
CREATE POLICY "Admins podem ver roles" ON public.user_roles
  FOR SELECT TO authenticated
  USING (public.has_role(auth.uid(), 'admin'));

CREATE POLICY "Usuários podem ver própria role" ON public.user_roles
  FOR SELECT TO authenticated
  USING (user_id = auth.uid());

CREATE POLICY "Admins podem criar roles" ON public.user_roles
  FOR INSERT TO authenticated
  WITH CHECK (public.has_role(auth.uid(), 'admin'));

CREATE POLICY "Admins podem atualizar roles" ON public.user_roles
  FOR UPDATE TO authenticated
  USING (public.has_role(auth.uid(), 'admin'));

CREATE POLICY "Admins podem deletar roles" ON public.user_roles
  FOR DELETE TO authenticated
  USING (public.has_role(auth.uid(), 'admin'));

-- 5. Add status column to profiles
ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS status text DEFAULT 'ativo' CHECK (status IN ('ativo', 'inativo'));

-- 6. Add corretor_id to leads and imoveis
ALTER TABLE public.leads ADD COLUMN IF NOT EXISTS corretor_id uuid REFERENCES auth.users(id);
ALTER TABLE public.imoveis ADD COLUMN IF NOT EXISTS corretor_id uuid REFERENCES auth.users(id);

-- 7. Update RLS for leads
DROP POLICY IF EXISTS "Autenticados podem ver leads" ON public.leads;
CREATE POLICY "Ver leads baseado em role" ON public.leads
  FOR SELECT TO authenticated
  USING (
    public.has_role(auth.uid(), 'admin') 
    OR corretor_id = auth.uid()
    OR corretor_id IS NULL
  );

-- 8. Update RLS for imoveis
DROP POLICY IF EXISTS "Todos podem ver imóveis" ON public.imoveis;
CREATE POLICY "Ver imóveis baseado em role" ON public.imoveis
  FOR SELECT TO authenticated
  USING (
    public.has_role(auth.uid(), 'admin') 
    OR corretor_id = auth.uid()
    OR corretor_id IS NULL
  );

-- 9. Trigger to set first user as admin
CREATE OR REPLACE FUNCTION public.set_first_user_as_admin()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  user_count int;
BEGIN
  SELECT COUNT(*) INTO user_count FROM public.user_roles;
  
  IF user_count = 0 THEN
    INSERT INTO public.user_roles (user_id, role) VALUES (NEW.id, 'admin');
  ELSE
    INSERT INTO public.user_roles (user_id, role) VALUES (NEW.id, 'corretor');
  END IF;
  
  RETURN NEW;
END;
$$;

CREATE TRIGGER on_profile_created_set_role
  AFTER INSERT ON public.profiles
  FOR EACH ROW EXECUTE FUNCTION public.set_first_user_as_admin();