# 🎯 Integração com Meta Ads (Facebook Ads)

## 📋 Visão Geral

Esta integração permite conectar contas do Facebook Business Manager ao sistema Geum Exclusivos para rastrear automaticamente as métricas das campanhas de anúncios dos imóveis.

---

## ⚙️ Configuração Inicial

### 1. Criar App no Facebook Developers

1. Acesse: https://developers.facebook.com/apps
2. Clique em "Criar App"
3. Escolha "Empresas" como tipo de app
4. Preencha:
   - **Nome do App**: Geum Exclusivos CRM
   - **Email de contato**: seu-email@empresa.com
5. Clique em "Criar App"

### 2. Configurar o App

#### A. Configurações Básicas
1. No painel do app, vá em **Configurações > Básico**
2. Anote o **ID do App** e a **Chave Secreta**
3. Adicione domínios do app:
   - Domínio do App: `seu-dominio.com`
   - URL da Política de Privacidade: `https://seu-dominio.com/privacidade`

#### B. Adicionar Produto "Facebook Login"
1. No painel, clique em **Adicionar Produto**
2. Escolha **Facebook Login** e clique em "Configurar"
3. Escolha **Web** como plataforma
4. Configure URLs de redirecionamento válidas:
   ```
   http://localhost:5173/sistema
   https://seu-dominio.com/sistema
   https://seu-dominio-preview.com/sistema
   ```

#### C. Adicionar Produto "Marketing API"
1. No painel, clique em **Adicionar Produto**
2. Escolha **Marketing API** e clique em "Configurar"
3. Aceite os termos de uso

### 3. Solicitar Permissões

As seguintes permissões são necessárias:

- **ads_read** - Ler dados de anúncios
- **ads_management** - Gerenciar campanhas
- **business_management** - Acessar Business Manager
- **leads_retrieval** - Capturar leads

Para solicitar permissões avançadas:
1. Vá em **Revisão de App > Permissões e Recursos**
2. Solicite cada permissão acima
3. Preencha os casos de uso
4. Envie capturas de tela do sistema

---

## 🔧 Configuração no Projeto

### 1. Variáveis de Ambiente

Adicione no arquivo `.env`:

```env
# Facebook/Meta Ads
VITE_FACEBOOK_APP_ID=seu_app_id_aqui

# Supabase (se ainda não tiver)
VITE_SUPABASE_URL=https://seu-projeto.supabase.co
VITE_SUPABASE_PUBLISHABLE_KEY=sua_key_aqui
```

### 2. Deploy da Migration

Execute a migration do banco de dados:

```bash
# Via Supabase CLI
supabase db push

# Ou manualmente via Dashboard do Supabase
# SQL Editor > Cole o conteúdo de:
# supabase/migrations/20250125000000_meta_ads_integration.sql
```

### 3. Deploy da Edge Function

```bash
# Deploy via Supabase CLI
supabase functions deploy sync-meta-ads

# Configure secrets da Edge Function
supabase secrets set FACEBOOK_APP_SECRET=sua_chave_secreta
```

---

## 🚀 Como Usar

### 1. Conectar Conta do Facebook

1. Acesse **Sistema > Relatórios dos Anúncios**
2. Clique na aba **Conexão**
3. Clique em **Conectar com Facebook**
4. Faça login com sua conta do Facebook Business
5. Autorize as permissões solicitadas
6. Selecione a conta de anúncios

### 2. Vincular Campanha a um Imóvel

1. Acesse **Sistema > Imóveis**
2. Edite um imóvel
3. Na seção "Meta Ads" (nova):
   - Selecione a conta conectada
   - Escolha a campanha
   - Clique em "Vincular"

### 3. Visualizar Métricas

#### Dashboard Geral
- Acesse **Relatórios dos Anúncios**
- Veja métricas consolidadas:
  - Investimento total
  - Impressões
  - Cliques
  - Leads gerados
  - CTR médio
  - CPC médio

#### Métricas por Imóvel
- Acesse **Imóveis > [Imóvel específico]**
- Veja métricas da campanha vinculada
- Histórico de 30 dias

### 4. Sincronização Automática

As métricas são sincronizadas:
- **Automático**: A cada 6 horas (via cron job)
- **Manual**: Clique no botão "Sincronizar" em Relatórios dos Anúncios

---

## 📊 Métricas Rastreadas

| Métrica | Descrição |
|---------|-----------|
| **Impressões** | Quantas vezes o anúncio foi exibido |
| **Alcance** | Número de pessoas únicas que viram o anúncio |
| **Cliques** | Total de cliques no anúncio |
| **CTR** | Click-Through Rate (taxa de cliques) |
| **CPC** | Cost Per Click (custo por clique) |
| **CPM** | Cost Per Mille (custo por mil impressões) |
| **Gastos** | Valor investido na campanha |
| **Leads** | Leads capturados via formulário |
| **Custo por Lead** | Quanto custou cada lead |
| **Conversões** | Ações completadas |
| **Taxa de Conversão** | % de cliques que viraram conversões |

---

## 🔐 Segurança

### Tokens de Acesso

- **Armazenamento**: Criptografado no Supabase
- **Validade**: Tokens duram 60 dias
- **Refresh**: Automático quando expira
- **Revogação**: Ao desconectar conta, tokens são deletados

### RLS Policies

- Usuários só veem suas próprias contas conectadas
- Campanhas e métricas são compartilhadas entre usuários autenticados
- Edge Functions usam Service Role Key

### HTTPS

- Todas as chamadas à API do Meta usam HTTPS
- OAuth flow é seguro (state parameter)

---

## 🐛 Troubleshooting

### Erro: "Facebook App ID não configurado"

**Solução**: Adicione `VITE_FACEBOOK_APP_ID` no `.env`

### Erro: "Invalid OAuth redirect URI"

**Solução**:
1. Verifique se a URL está cadastrada no Facebook App
2. URLs devem ser exatas (incluindo porta em dev)
3. Formato: `http://localhost:5173/sistema`

### Erro: "This app doesn't have permission to access ads_read"

**Solução**:
1. Solicite permissões avançadas no Facebook Developers
2. Aguarde aprovação (pode levar alguns dias)
3. Para testes, use uma conta de teste do Business Manager

### Métricas não atualizam

**Possíveis causas**:
1. Token expirado → Reconecte a conta
2. Campanha pausada → Verifique status no Meta Ads
3. Edge Function com erro → Verifique logs no Supabase

**Como verificar**:
```sql
-- Ver últimos syncs
SELECT * FROM meta_sync_logs
ORDER BY started_at DESC
LIMIT 10;
```

### Campanha não aparece para vincular

**Solução**:
1. Verifique se a campanha está ativa no Meta Ads
2. Clique em "Sincronizar" para buscar novas campanhas
3. Verifique se a conta conectada tem acesso à campanha

---

## 📈 Roadmap Futuro

- [ ] Gráficos de tendências
- [ ] Comparação entre campanhas
- [ ] Alertas de performance (custo alto, CTR baixo)
- [ ] Export de relatórios em PDF
- [ ] Sugestões de otimização baseadas em IA
- [ ] Integração com Google Ads
- [ ] Budget tracking e alertas

---

## 🆘 Suporte

### Links Úteis

- [Documentação Meta Marketing API](https://developers.facebook.com/docs/marketing-apis)
- [Permissões do Facebook Login](https://developers.facebook.com/docs/permissions/reference)
- [Business Manager](https://business.facebook.com/)
- [Supabase Edge Functions](https://supabase.com/docs/guides/functions)

### Logs e Debug

```sql
-- Ver contas conectadas
SELECT * FROM meta_accounts;

-- Ver campanhas vinculadas
SELECT mc.*, i.codigo, i.cliente
FROM meta_campaigns mc
JOIN imoveis i ON i.id = mc.imovel_id;

-- Ver métricas recentes
SELECT * FROM meta_campaign_metrics
WHERE date >= CURRENT_DATE - INTERVAL '7 days'
ORDER BY date DESC;

-- Ver logs de sincronização
SELECT * FROM meta_sync_logs
ORDER BY started_at DESC;
```

---

## 📄 Licença e Compliance

- Certifique-se de estar em compliance com os termos de uso do Meta
- Política de privacidade deve informar uso de dados do Facebook
- Não armazene dados pessoais de usuários além do necessário
- Respeite limites de rate da API (200 calls/hour por usuário)

---

**Última atualização**: 2025-01-25
**Versão**: 1.0.0
