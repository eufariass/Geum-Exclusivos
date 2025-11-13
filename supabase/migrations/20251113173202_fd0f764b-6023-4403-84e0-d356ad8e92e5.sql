-- Criar tabela de perfis
CREATE TABLE public.profiles (
  id uuid PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  nome_completo text NOT NULL,
  avatar_url text,
  cargo text,
  created_at timestamp with time zone DEFAULT now(),
  updated_at timestamp with time zone DEFAULT now()
);

-- Habilitar RLS na tabela profiles
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;

-- Policies para profiles (todos podem ver todos os perfis, mas só podem editar o próprio)
CREATE POLICY "Todos podem ver perfis"
  ON public.profiles
  FOR SELECT
  USING (true);

CREATE POLICY "Usuários podem criar seu próprio perfil"
  ON public.profiles
  FOR INSERT
  WITH CHECK (auth.uid() = id);

CREATE POLICY "Usuários podem atualizar seu próprio perfil"
  ON public.profiles
  FOR UPDATE
  USING (auth.uid() = id);

-- Função para criar perfil automaticamente ao cadastrar
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  INSERT INTO public.profiles (id, nome_completo)
  VALUES (
    new.id,
    COALESCE(new.raw_user_meta_data->>'nome_completo', split_part(new.email, '@', 1))
  );
  RETURN new;
END;
$$;

-- Trigger para criar perfil automaticamente
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW
  EXECUTE FUNCTION public.handle_new_user();

-- Adicionar campos de rastreamento nas tabelas existentes
ALTER TABLE public.imoveis
  ADD COLUMN created_by uuid REFERENCES public.profiles(id),
  ADD COLUMN updated_by uuid REFERENCES public.profiles(id);

ALTER TABLE public.metricas
  ADD COLUMN created_by uuid REFERENCES public.profiles(id),
  ADD COLUMN updated_by uuid REFERENCES public.profiles(id);

-- Função para atualizar updated_at
CREATE OR REPLACE FUNCTION public.update_updated_at()
RETURNS trigger
LANGUAGE plpgsql
AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$;

-- Trigger para atualizar updated_at em profiles
CREATE TRIGGER update_profiles_updated_at
  BEFORE UPDATE ON public.profiles
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at();