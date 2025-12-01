-- Adicionar política para permitir que admins atualizem qualquer perfil
CREATE POLICY "Admins podem atualizar qualquer perfil" ON profiles
  FOR UPDATE
  USING (has_role(auth.uid(), 'admin'::app_role));