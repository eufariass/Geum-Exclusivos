-- Adicionar colunas JSON para comentários e atividades na tabela tasks
ALTER TABLE tasks 
ADD COLUMN comments JSONB DEFAULT '[]'::jsonb,
ADD COLUMN activities JSONB DEFAULT '[]'::jsonb;

-- Dropar as tabelas que não funcionam
DROP TABLE IF EXISTS task_comments;
DROP TABLE IF EXISTS task_activities;