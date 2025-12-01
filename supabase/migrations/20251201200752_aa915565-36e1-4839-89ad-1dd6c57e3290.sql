-- Remover a política restritiva atual que bloqueia acesso público
DROP POLICY IF EXISTS "Ver imóveis baseado em role" ON imoveis;

-- Criar política PERMISSIVE que permite acesso público de leitura
-- Isso permite que visitantes não autenticados vejam os imóveis na página de divulgação
CREATE POLICY "Acesso público aos imóveis" ON imoveis
  FOR SELECT
  USING (true);

-- As políticas de modificação (INSERT, UPDATE, DELETE) continuam protegidas
-- apenas para usuários autenticados, mantendo a segurança dos dados