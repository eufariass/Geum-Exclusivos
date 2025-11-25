# 🔐 Configurar App Secret no Supabase

## ⚠️ Importante
O **App Secret** (token do cliente) NUNCA deve estar no código frontend ou no arquivo `.env`.
Ele deve ser configurado como um **Secret** no Supabase para ser usado apenas nas Edge Functions.

---

## 📋 Passo a Passo (3 minutos)

### **1. Acessar o Supabase Dashboard**

Acesse o painel de secrets do seu projeto:

🔗 **Link direto**: https://supabase.com/dashboard/project/polzdhlstwdvzmyxflrk/settings/vault/secrets

Ou manualmente:
1. Acesse: https://supabase.com/dashboard
2. Selecione o projeto: **polzdhlstwdvzmyxflrk**
3. No menu lateral, vá em: **Project Settings** (ícone de engrenagem)
4. Clique em: **Edge Functions** > **Secrets**

---

### **2. Adicionar o Secret**

1. Clique no botão **"Add a new secret"** ou **"New secret"**

2. Preencha o formulário:

   **Name (Nome do secret)**:
   ```
   FACEBOOK_APP_SECRET
   ```

   **Value (Valor)**:
   ```
   bdf53f7d9463cb35ef1f5fb4668dc92
   ```

3. Clique em **"Add secret"** ou **"Create"**

---

### **3. Verificar se foi adicionado**

Você deve ver o secret listado como:
```
✅ FACEBOOK_APP_SECRET  (hidden)
```

⚠️ **Nota**: O valor ficará oculto por segurança, é normal!

---

## 🧪 Testar a Configuração

Depois de adicionar o secret:

1. ✅ O App Secret está configurado no Supabase
2. ✅ O App ID está no `.env` do projeto
3. ✅ Agora pode reiniciar o servidor e testar

---

## 🔄 Reiniciar o Servidor de Desenvolvimento

No terminal onde o projeto está rodando:

1. **Pare o servidor**: Pressione `Ctrl + C`

2. **Inicie novamente**:
   ```bash
   npm run dev
   ```

3. **Acesse**: http://localhost:5173

4. **Faça login** no sistema

5. **Vá na aba "Meta Ads"**

6. **Clique em "Conectar com Facebook"**

---

## ✅ O que deve acontecer:

- ✅ O botão "Conectar com Facebook" estará habilitado
- ✅ Ao clicar, deve abrir um popup do Facebook
- ✅ O Facebook vai pedir permissões para acessar suas contas de anúncios
- ✅ Após aceitar, o sistema vai salvar sua conta conectada

---

## 🐛 Se der erro no popup do Facebook

### **Erro: "URL is not allowed by the Application configuration"**

**Solução**: Configurar as URLs de redirecionamento no Facebook App

1. Acesse: https://developers.facebook.com/apps/982895293202997/fb-login/settings/

2. Em **"Valid OAuth Redirect URIs"** (URIs de redirecionamento OAuth válidos), adicione:
   ```
   http://localhost:5173/sistema
   https://seu-dominio.com.br/sistema
   ```

3. Clique em **"Save Changes"** (Salvar alterações)

4. Tente conectar novamente no sistema

---

### **Erro: "This app is in Development Mode"**

Significa que o app está em modo de desenvolvimento. Você tem 2 opções:

**Opção 1: Adicionar-se como testador** (mais rápido)
1. Acesse: https://developers.facebook.com/apps/982895293202997/roles/roles/
2. Clique em **"Add Testers"**
3. Digite seu email ou ID do Facebook
4. Envie o convite e aceite pelo Facebook

**Opção 2: Colocar o app em produção** (requer mais configurações)
1. Complete todas as informações do app (política de privacidade, ícone, etc.)
2. Vá em: https://developers.facebook.com/apps/982895293202997/settings/basic/
3. Alterne o switch para **"Live"** (Ativo)

---

## 📝 Checklist Final

- [x] App ID adicionado no `.env`
- [ ] App Secret adicionado no Supabase Secrets
- [ ] Servidor reiniciado
- [ ] URLs de redirecionamento configuradas no Facebook App
- [ ] Testado a conexão com Facebook

---

## 📞 Próximos Passos

Depois que tudo estiver funcionando:

1. ✅ Conecte sua conta do Facebook Business
2. ✅ Suas contas de anúncios serão carregadas automaticamente
3. ✅ Ao editar um imóvel, você verá a opção de vincular uma campanha
4. ✅ As métricas serão sincronizadas automaticamente
5. ✅ Visualize os relatórios na aba "Meta Ads"

---

**Configurações aplicadas com sucesso!** 🎉
