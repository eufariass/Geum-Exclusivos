# Configuração do Supabase

Este projeto requer configuração do Supabase para funcionar corretamente.

## Para Desenvolvimento Local

1. Copie o arquivo `.env.example` para `.env`:
   ```bash
   cp .env.example .env
   ```

2. Acesse seu projeto no [Supabase](https://supabase.com)

3. Obtenha as credenciais em **Project Settings > API**:
   - Project URL → `VITE_SUPABASE_URL`
   - Project API Key (anon, public) → `VITE_SUPABASE_PUBLISHABLE_KEY`
   - Project Reference ID → `VITE_SUPABASE_PROJECT_ID`

4. Edite o arquivo `.env` com suas credenciais reais

5. Execute o projeto:
   ```bash
   npm install
   npm run dev
   ```

## Para Lovable (Produção)

O Lovable injeta automaticamente as variáveis de ambiente quando o projeto está publicado.

Se você está vendo tela em branco no Lovable:

1. Acesse [seu projeto no Lovable](https://lovable.dev/projects/c9e0ccd3-626a-4e89-96d1-11fccf662b6a)

2. Vá em **Project > Settings > Integrations**

3. Configure a integração do Supabase:
   - Conecte seu projeto Supabase
   - As variáveis de ambiente serão configuradas automaticamente

4. Republique o projeto: **Share > Publish**

## Solução de Problemas

### Tela em branco

Se você está vendo uma tela em branco:

1. **Abra o Console do Navegador** (F12) e verifique os erros
2. Procure por mensagens de erro relacionadas ao Supabase
3. Verifique se as variáveis de ambiente estão configuradas corretamente

### Erro: "Configuração do Supabase ausente"

As variáveis de ambiente não estão configuradas. Siga os passos acima para configurá-las.

### Erro: "Configuração do Supabase com valores placeholder"

Você precisa substituir os valores placeholder pelas credenciais reais do seu projeto Supabase.

## Variáveis de Ambiente Necessárias

| Variável | Descrição | Onde Encontrar |
|----------|-----------|----------------|
| `VITE_SUPABASE_URL` | URL do projeto Supabase | Project Settings > API > Project URL |
| `VITE_SUPABASE_PUBLISHABLE_KEY` | Chave pública (anon key) | Project Settings > API > Project API keys |
| `VITE_SUPABASE_PROJECT_ID` | ID de referência do projeto | Project Settings > General > Reference ID |
