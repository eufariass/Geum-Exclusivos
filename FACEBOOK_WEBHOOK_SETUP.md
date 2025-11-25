# 🔔 Configurar Webhooks do Facebook (Meta Ads)

## 📋 O que são Webhooks?

Webhooks permitem que o Facebook envie notificações em tempo real para o seu sistema quando algo muda nas suas campanhas (status, budget, leads, etc). Isso elimina a necessidade de fazer polling constante.

---

## ⚡ Informações Necessárias

Você vai precisar dessas informações para configurar no Facebook:

### **1. URL do Callback (Webhook Endpoint)**

**Desenvolvimento (local com ngrok ou similar)**:
```
https://seu-ngrok-url.ngrok.io/functions/v1/meta-ads-webhook
```

**Produção (após deploy no Supabase)**:
```
https://polzdhlstwdvzmyxflrk.supabase.co/functions/v1/meta-ads-webhook
```

### **2. Verify Token (Token de Verificação)**

```
S6udG5yoiJ4IVahk4jE6uHaLkSWuvOvr
```

⚠️ **IMPORTANTE**: Guarde esse token em local seguro! Você vai precisar dele no Facebook E no Supabase.

---

## 🔧 Passo a Passo - Configuração

### **PASSO 1: Configurar Secrets no Supabase** (5 min)

Antes de tudo, você precisa adicionar o verify token no Supabase:

1. **Acesse**: https://supabase.com/dashboard/project/polzdhlstwdvzmyxflrk/settings/vault/secrets

2. **Adicione um novo secret**:
   - **Name**: `FACEBOOK_WEBHOOK_VERIFY_TOKEN`
   - **Value**: `S6udG5yoiJ4IVahk4jE6uHaLkSWuvOvr`

3. **Clique em "Add secret"**

---

### **PASSO 2: Deploy da Edge Function** (3 min)

Você precisa fazer deploy da função webhook no Supabase:

```bash
# Se você tem o Supabase CLI instalado:
supabase functions deploy meta-ads-webhook

# Se não tem, instale primeiro:
npm install -g supabase
supabase login
supabase link --project-ref polzdhlstwdvzmyxflrk
supabase functions deploy meta-ads-webhook
```

Após o deploy, a URL será:
```
https://polzdhlstwdvzmyxflrk.supabase.co/functions/v1/meta-ads-webhook
```

---

### **PASSO 3: Configurar no Facebook Developers** (5 min)

#### 3.1. Acessar Webhooks

1. **Acesse seu app**: https://developers.facebook.com/apps/982895293202997/webhooks/

2. **No menu lateral**, clique em **"Webhooks"**

#### 3.2. Adicionar Assinatura de Webhook

1. Clique em **"Add Subscription"** ou **"Create Subscription"**

2. **Selecione o produto**: Escolha **"Page"** ou **"User"** (dependendo do tipo de app)
   - Para Meta Ads, geralmente é **"Page"** ou você pode precisar adicionar via **"Instagram"**

3. **Se não aparecer a opção**, procure por **"Webhooks"** no produto **"Meta Business Suite"** ou **"Marketing API"**

#### 3.3. Configurar Callback

Você verá um formulário com:

**Callback URL**:
```
https://polzdhlstwdvzmyxflrk.supabase.co/functions/v1/meta-ads-webhook
```

**Verify Token**:
```
S6udG5yoiJ4IVahk4jE6uHaLkSWuvOvr
```

**Clique em "Verify and Save"**

✅ Se tudo estiver correto, o Facebook vai fazer uma requisição GET para seu endpoint e validar o token.

---

### **PASSO 4: Configurar Campos de Assinatura** (2 min)

Depois de verificar, você precisa selecionar quais eventos deseja receber:

**Eventos recomendados para Meta Ads**:
- ✅ `ads_insights` - Mudanças em métricas
- ✅ `ads_read` - Leitura de anúncios
- ✅ `leadgen` - Novos leads capturados
- ✅ `ad_campaign_activity` - Atividade de campanha
- ✅ `ad_account_update` - Atualizações na conta

**Como selecionar**:
1. Na página de Webhooks, você verá uma lista de campos
2. Marque os checkboxes dos eventos acima
3. Clique em **"Save"** ou **"Subscribe"**

---

## 🧪 Testar o Webhook

### Teste Manual via Facebook

1. Na página de Webhooks do Facebook, clique em **"Test"** ao lado do seu webhook

2. Selecione um tipo de evento (ex: `ads_insights`)

3. Clique em **"Send to My Server"**

4. Verifique os logs no Supabase:
   - https://supabase.com/dashboard/project/polzdhlstwdvzmyxflrk/functions/meta-ads-webhook/logs

### Verificar Logs da Edge Function

Acesse os logs para ver se os eventos estão chegando:
```
https://supabase.com/dashboard/project/polzdhlstwdvzmyxflrk/functions/meta-ads-webhook/logs
```

Você deve ver algo como:
```
Received webhook event: { ... }
Processing entry: 12345
Processing change: { field: 'campaign', value: {...} }
```

---

## 📊 Como Funciona

```
Facebook Ads
    ↓
    ↓ (Evento: campanha mudou status)
    ↓
Webhook Endpoint (Supabase Edge Function)
    ↓
    ↓ (Validação e processamento)
    ↓
Banco de Dados (meta_campaigns, meta_sync_logs)
    ↓
    ↓ (Atualização automática)
    ↓
Dashboard do Sistema (tempo real)
```

### Eventos Processados

A Edge Function processa automaticamente:

1. **Mudanças em Campanhas**
   - Status (ativa, pausada, encerrada)
   - Budget alterado
   - Nome alterado

2. **Mudanças em Anúncios**
   - Novo anúncio criado
   - Anúncio aprovado/rejeitado
   - Anúncio pausado

3. **Novos Leads**
   - Lead capturado via formulário
   - Informações do lead

4. **Métricas Atualizadas**
   - Impressões, cliques, gastos
   - Conversões, resultados

---

## 🔒 Segurança

### Validação de Requisições

O webhook valida:
- ✅ Verify Token correto
- ✅ Requisições vêm do Facebook
- ✅ Payload está no formato esperado

### Proteção de Dados

- ✅ Verify Token armazenado no Supabase Secrets (não no código)
- ✅ HTTPS obrigatório
- ✅ Logs de todos os eventos

---

## 🐛 Troubleshooting

### ❌ "The URL couldn't be validated"

**Possíveis causas**:
1. A Edge Function não foi deployada
2. O verify token no Supabase não corresponde ao do Facebook
3. A URL está incorreta

**Solução**:
```bash
# Verificar se a função está deployada
curl https://polzdhlstwdvzmyxflrk.supabase.co/functions/v1/meta-ads-webhook

# Testar manualmente o webhook
curl "https://polzdhlstwdvzmyxflrk.supabase.co/functions/v1/meta-ads-webhook?hub.mode=subscribe&hub.verify_token=S6udG5yoiJ4IVahk4jE6uHaLkSWuvOvr&hub.challenge=test123"

# Deve retornar: test123
```

### ❌ "Verify Token doesn't match"

O token no Supabase está diferente do que você colocou no Facebook.

**Solução**:
1. Verifique o secret no Supabase: https://supabase.com/dashboard/project/polzdhlstwdvzmyxflrk/settings/vault/secrets
2. Confirme que o nome é exatamente: `FACEBOOK_WEBHOOK_VERIFY_TOKEN`
3. Confirme que o valor é: `S6udG5yoiJ4IVahk4jE6uHaLkSWuvOvr`

### ❌ Webhook configurado mas eventos não chegam

**Solução**:
1. Verifique se subscreveu os campos corretos
2. Verifique os logs da Edge Function
3. Teste manualmente enviando um evento de teste pelo Facebook

---

## 📝 Checklist de Configuração

- [ ] Verify token adicionado no Supabase Secrets
- [ ] Edge Function deployada (`meta-ads-webhook`)
- [ ] Webhook configurado no Facebook Developers
- [ ] Callback URL verificada com sucesso
- [ ] Campos de assinatura selecionados
- [ ] Teste manual enviado e recebido
- [ ] Logs verificados no Supabase

---

## 🎯 Benefícios do Webhook

Depois de configurado, você terá:

✅ **Atualizações em tempo real** - Não precisa fazer sync manual
✅ **Menos requisições à API** - Facebook envia apenas quando há mudanças
✅ **Dados sempre atualizados** - Dashboard sempre com info mais recente
✅ **Captura de leads instantânea** - Leads aparecem imediatamente no CRM
✅ **Notificações automáticas** - Sistema pode alertar sobre mudanças importantes

---

## 📞 Suporte

Se tiver problemas:
1. Verifique os logs da Edge Function no Supabase
2. Verifique os logs de webhooks no Facebook Developers
3. Teste manualmente com curl (comando acima)
4. Verifique se todos os secrets estão configurados

---

**Configuração completa!** 🎉

Agora o sistema receberá atualizações automáticas do Facebook sobre suas campanhas.
