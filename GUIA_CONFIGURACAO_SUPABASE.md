# 🔧 Guia de Configuração do Sistema de Tarefas no Supabase

## ❌ Problema

Ao tentar usar o sistema de tarefas, você está recebendo erros porque as tabelas `tasks` e `task_checklists` não existem no banco de dados do Supabase.

## ✅ Solução

Execute a migration SQL no painel do Supabase seguindo os passos abaixo:

---

## 📋 Passo a Passo

### **1. Acesse o Supabase Dashboard**

- Abra o navegador e vá para: https://supabase.com/dashboard
- Faça login com sua conta
- Selecione o projeto: **polzdhlstwdvzmyxflrk**

### **2. Abra o SQL Editor**

- No menu lateral esquerdo, clique em **"SQL Editor"**
- Ou acesse diretamente: https://supabase.com/dashboard/project/polzdhlstwdvzmyxflrk/sql

### **3. Crie uma Nova Query**

- Clique no botão **"New Query"** (ou "+ New query")
- Isso abrirá um editor SQL em branco

### **4. Cole o SQL da Migration**

- Abra o arquivo `EXECUTAR_NO_SUPABASE.sql` na raiz do projeto
- **Copie TODO o conteúdo** do arquivo (Ctrl/Cmd + A, depois Ctrl/Cmd + C)
- **Cole no editor SQL** do Supabase (Ctrl/Cmd + V)

### **5. Execute a Migration**

- Clique no botão **"Run"** no canto inferior direito
- Ou pressione **Ctrl + Enter** (Windows/Linux) ou **Cmd + Enter** (Mac)
- Aguarde a execução (pode levar alguns segundos)

### **6. Verifique o Resultado**

Se tudo correr bem, você verá mensagens de sucesso como:

```
Success. No rows returned
```

Ou:

```
CREATE TABLE
CREATE INDEX
CREATE FUNCTION
...
```

---

## 🔍 Verificação

Após executar a migration, verifique se as tabelas foram criadas:

### No Supabase Dashboard:

1. Vá em **"Table Editor"** no menu lateral
2. Você deve ver as novas tabelas:
   - ✅ `tasks`
   - ✅ `task_checklists`

### Ou execute esta query no SQL Editor:

```sql
SELECT table_name
FROM information_schema.tables
WHERE table_schema = 'public'
  AND table_name IN ('tasks', 'task_checklists');
```

Resultado esperado:
```
tasks
task_checklists
```

---

## 🚀 Após Configurar

Depois de executar a migration com sucesso:

1. **Recarregue a aplicação** React (Ctrl/Cmd + R no navegador)
2. **Acesse a aba "Tarefas"** no menu lateral
3. **Teste criar uma tarefa** clicando em "Nova Tarefa"

---

## ❓ Problemas Comuns

### Erro: "relation 'tasks' already exists"

✅ **Isso é normal!** Significa que a tabela já foi criada anteriormente. A migration é segura para executar múltiplas vezes.

### Erro: "permission denied"

❌ Você precisa ter **permissões de administrador** no projeto do Supabase. Peça para alguém com acesso de admin executar a migration.

### Erro: "relation 'leads' does not exist"

❌ A tabela `leads` precisa existir antes. Verifique se as migrations anteriores foram executadas.

---

## 🆘 Precisa de Ajuda?

Se você **não tem acesso ao Supabase**:

1. Compartilhe o arquivo `EXECUTAR_NO_SUPABASE.sql` com alguém que tenha acesso
2. Peça para essa pessoa executar os passos acima
3. Depois que for executado, recarregue a aplicação

---

## 📝 O que esta Migration Cria

- ✅ Tabela `tasks` - Armazena todas as tarefas
- ✅ Tabela `task_checklists` - Subtarefas/checklist
- ✅ 8 índices para melhorar performance
- ✅ 4 funções auxiliares
- ✅ 3 triggers automáticos
- ✅ 1 view para métricas (task_summary)
- ✅ 8 políticas RLS de segurança

---

## 🎉 Pronto!

Após executar a migration, o sistema de tarefas estará 100% funcional!
