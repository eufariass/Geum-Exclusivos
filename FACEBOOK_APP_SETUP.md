# 🚀 Guia Rápido: Configurar Facebook App para Meta Ads

## ❗ Problema Identificado
**Erro**: Facebook App ID não está configurado no sistema.

**Solução**: Seguir este guia passo a passo para criar e configurar seu Facebook App.

---

## 📋 Passo a Passo (15-20 minutos)

### **PASSO 1: Criar o Facebook App** (5 min)

1. **Acesse**: https://developers.facebook.com/apps
2. **Login**: Use sua conta do Facebook Business
3. **Clique em**: "Criar App"
4. **Selecione**: "Empresa" (Business)
5. **Preencha**:
   - Nome: `Geum Exclusivos CRM`
   - Email: `seu-email@empresa.com`
   - Conta do Business Manager: Selecione sua conta
6. **Clique**: "Criar App"

✅ **Anote o ID do App** que aparece no topo da página!

---

### **PASSO 2: Configurar Produtos** (5 min)

#### A) Adicionar Facebook Login

1. No painel lateral, clique em **"+ Adicionar produto"**
2. Encontre **"Facebook Login"** e clique em **"Configurar"**
3. Selecione **"Web"** como plataforma
4. Em **"URIs de redirecionamento OAuth válidos"**, adicione:
   ```
   http://localhost:5173/sistema
   https://seu-dominio.com.br/sistema
   ```
   ⚠️ **Importante**: Substitua `seu-dominio.com.br` pelo seu domínio real!

5. Clique em **"Salvar alterações"**

#### B) Adicionar Marketing API

1. No painel lateral, clique em **"+ Adicionar produto"** novamente
2. Encontre **"Marketing API"** e clique em **"Configurar"**
3. Aceite os termos de uso

---

### **PASSO 3: Configurar Permissões** (5 min)

1. No painel lateral, vá em **"Facebook Login" > "Configurações"**
2. Em **"URIs de redirecionamento OAuth válidos"**, confirme que adicionou:
   - URL de desenvolvimento: `http://localhost:5173/sistema`
   - URL de produção: `https://seu-dominio.com.br/sistema`

3. Role para baixo e em **"Cliente OAuth Login"**:
   - ✅ Ative: "Login da Web com OAuth"
   - ✅ Ative: "Login do navegador incorporado"

4. Clique em **"Salvar alterações"**

---

### **PASSO 4: Copiar Credenciais** (2 min)

1. No painel lateral, vá em **"Configurações" > "Básico"**
2. **Copie** as seguintes informações:
   - **ID do App** (App ID)
   - **Chave Secreta do App** (App Secret) - clique em "Mostrar"

⚠️ **NUNCA compartilhe a Chave Secreta publicamente!**

---

### **PASSO 5: Configurar no Sistema** (3 min)

1. Abra o arquivo `.env` na raiz do projeto
2. Adicione as seguintes linhas:

```env
# Facebook/Meta Ads Integration
VITE_FACEBOOK_APP_ID=SEU_APP_ID_AQUI
```

3. **Exemplo completo do .env**:
```env
VITE_SUPABASE_PROJECT_ID="polzdhlstwdvzmyxflrk"
VITE_SUPABASE_PUBLISHABLE_KEY="eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9..."
VITE_SUPABASE_URL="https://polzdhlstwdvzmyxflrk.supabase.co"

# Facebook/Meta Ads Integration
VITE_FACEBOOK_APP_ID=1234567890123456
```

4. **Salve o arquivo**

---

### **PASSO 6: Configurar App Secret no Supabase** (2 min)

A chave secreta NÃO pode ficar no frontend. Ela deve ir no Supabase:

1. Acesse: https://supabase.com/dashboard/project/polzdhlstwdvzmyxflrk/settings/vault/secrets
2. Clique em **"New secret"**
3. Preencha:
   - **Name**: `FACEBOOK_APP_SECRET`
   - **Value**: Cole a Chave Secreta do App copiada no Passo 4
4. Clique em **"Add secret"**

---

### **PASSO 7: Modo de Desenvolvimento** (opcional)

Por padrão, o app está em **"Modo de Desenvolvimento"**, que só permite acesso a você e testadores adicionados.

**Para adicionar testadores**:
1. Vá em **"Funções" > "Funções"**
2. Clique em **"Adicionar testadores"**
3. Digite o email/ID do Facebook de quem vai testar
4. Envie o convite

**Para produção** (quando estiver pronto):
1. Complete todas as informações necessárias (política de privacidade, ícone do app, etc.)
2. Vá em **"Configurações" > "Básico"**
3. Alterne o switch para **"Ativo"**

---

## ✅ Verificar se Funcionou

1. **Reinicie o servidor de desenvolvimento**:
   ```bash
   npm run dev
   ```

2. **Acesse o sistema**: http://localhost:5173

3. **Faça login** no sistema

4. **Vá na aba "Meta Ads"**

5. **Clique em "Conectar com Facebook"**

6. Deve abrir um popup do Facebook pedindo permissões ✅

---

## 🐛 Troubleshooting (Problemas Comuns)

### Erro: "URL is not allowed by the Application configuration"
**Causa**: URL de redirecionamento não está configurada no Facebook App
**Solução**: Volte ao Passo 3 e adicione a URL correta em "URIs de redirecionamento OAuth"

### Erro: "Facebook App ID não configurado"
**Causa**: Variável de ambiente não foi adicionada ou servidor não foi reiniciado
**Solução**:
1. Verifique se adicionou `VITE_FACEBOOK_APP_ID` no `.env`
2. Reinicie o servidor: `Ctrl+C` e depois `npm run dev`

### Erro: "Can't Load URL: The domain of this URL isn't included in the app's domains"
**Causa**: Domínio não está na whitelist do Facebook App
**Solução**:
1. Vá em **"Configurações" > "Básico"**
2. Em **"Domínios do App"**, adicione: `localhost` e `seu-dominio.com.br`
3. Salve

### Erro: "This app is in Development Mode"
**Causa**: App em modo de desenvolvimento e você não é administrador/testador
**Solução**: Adicione-se como testador (veja Passo 7) ou coloque o app em produção

### Popup abre mas não pede permissões
**Causa**: Falta adicionar produtos e permissões
**Solução**: Volte ao Passo 2 e certifique-se de ter adicionado **Facebook Login** e **Marketing API**

---

## 📞 Suporte

Se ainda tiver problemas:
1. Verifique o console do navegador (F12) e veja se há erros
2. Verifique se o servidor está rodando sem erros
3. Confirme que todas as URLs estão corretas (sem trailing slash)

---

## 🎯 Próximos Passos (Após Configurar)

Depois que conseguir conectar:

1. ✅ Conecte sua conta do Facebook Business
2. ✅ O sistema vai buscar suas contas de anúncios automaticamente
3. ✅ Ao editar um imóvel, você poderá vincular uma campanha
4. ✅ As métricas serão sincronizadas automaticamente
5. ✅ Veja os relatórios na aba "Meta Ads"

---

## 📝 Checklist

- [ ] Criei o Facebook App
- [ ] Adicionei Facebook Login
- [ ] Adicionei Marketing API
- [ ] Configurei URIs de redirecionamento
- [ ] Copiei o App ID
- [ ] Adicionei `VITE_FACEBOOK_APP_ID` no `.env`
- [ ] Configurei `FACEBOOK_APP_SECRET` no Supabase
- [ ] Reiniciei o servidor
- [ ] Testei a conexão

---

**Tempo estimado total**: 15-20 minutos
**Última atualização**: Janeiro 2025
