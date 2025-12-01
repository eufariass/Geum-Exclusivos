-- Add email column to profiles table
ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS email text;

-- Update the trigger to also save email
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  INSERT INTO public.profiles (id, nome_completo, email)
  VALUES (
    new.id,
    COALESCE(new.raw_user_meta_data->>'nome_completo', split_part(new.email, '@', 1)),
    new.email
  );
  RETURN new;
END;
$$;