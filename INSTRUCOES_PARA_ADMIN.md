# 🔐 Instruções para Administrador do Supabase

## Contexto

O sistema de tarefas foi implementado no código, mas as tabelas do banco de dados ainda não foram criadas. Este arquivo contém as instruções para você executar a migration necessária.

---

## ⚡ Passo a Passo Rápido

### 1. Acesse o Supabase
- URL: https://supabase.com/dashboard
- Projeto: **polzdhlstwdvzmyxflrk**

### 2. Abra o SQL Editor
- Menu lateral → **SQL Editor**
- Ou acesse: https://supabase.com/dashboard/project/polzdhlstwdvzmyxflrk/sql

### 3. Execute a Migration
- Clique em **"New Query"**
- Copie TODO o conteúdo do arquivo `EXECUTAR_NO_SUPABASE.sql`
- Cole no editor
- Clique em **"Run"** (ou Ctrl/Cmd + Enter)

### 4. Confirme
Após executar, você deve ver mensagens de sucesso. Verifique se as tabelas foram criadas:

```sql
SELECT table_name 
FROM information_schema.tables 
WHERE table_schema = 'public' 
  AND table_name IN ('tasks', 'task_checklists');
```

Deve retornar:
```
tasks
task_checklists
```

---

## 📋 O que esta migration faz?

✅ Cria tabela `tasks` - armazena todas as tarefas
✅ Cria tabela `task_checklists` - subtarefas/checklist
✅ Cria 8 índices para performance
✅ Cria 4 funções auxiliares
✅ Cria 3 triggers automáticos:
   - Atualiza `updated_at` automaticamente
   - Cria tarefa quando novo lead é criado
✅ Cria view `task_summary` para métricas
✅ Configura 8 políticas RLS (Row Level Security)

---

## 🔍 Verificação Final

Após executar, teste no SQL Editor:

```sql
-- Deve retornar 0 tarefas (tabela vazia mas existente)
SELECT COUNT(*) FROM tasks;

-- Deve retornar as métricas zeradas
SELECT * FROM task_summary;
```

---

## ✅ Pronto!

Depois de executar a migration:
1. Avise o desenvolvedor que finalizou
2. Ele vai recarregar a aplicação
3. O sistema de tarefas estará 100% funcional

---

## ❓ Problemas?

### "relation 'tasks' already exists"
✅ Normal! A migration já foi executada antes. Tudo ok.

### "permission denied"
❌ Você precisa ser **Owner** ou ter permissões de **admin** no projeto.

### "relation 'leads' does not exist"
❌ Verifique se as migrations anteriores foram executadas (tabela de leads deve existir).

---

## 📞 Suporte

Se tiver dúvidas, consulte o arquivo `GUIA_CONFIGURACAO_SUPABASE.md` para mais detalhes.
