/**
 * Script para executar a migration do sistema de tarefas
 * Execute com: node scripts/run-tasks-migration.js
 */

import { createClient } from '@supabase/supabase-js';
import { readFileSync } from 'fs';
import { fileURLToPath } from 'url';
import { dirname, join } from 'path';
import dotenv from 'dotenv';

// Carregar variáveis de ambiente
dotenv.config();

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

const supabaseUrl = process.env.VITE_SUPABASE_URL;
const supabaseKey = process.env.VITE_SUPABASE_PUBLISHABLE_KEY;

if (!supabaseUrl || !supabaseKey) {
  console.error('❌ Erro: VITE_SUPABASE_URL ou VITE_SUPABASE_PUBLISHABLE_KEY não encontrados no .env');
  process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseKey);

async function runMigration() {
  try {
    console.log('🚀 Iniciando migration do sistema de tarefas...\n');

    // Ler arquivo de migration
    const migrationPath = join(__dirname, '..', 'supabase', 'migrations', '20250127000002_tasks_system.sql');
    const migrationSQL = readFileSync(migrationPath, 'utf8');

    console.log('📄 Migration carregada:', migrationPath);
    console.log('📝 Tamanho:', migrationSQL.length, 'caracteres\n');

    // Dividir em statements individuais (por ponto-e-vírgula)
    const statements = migrationSQL
      .split(';')
      .map(s => s.trim())
      .filter(s => s.length > 0 && !s.startsWith('--'));

    console.log('📋 Total de comandos SQL:', statements.length, '\n');

    // Executar cada statement
    for (let i = 0; i < statements.length; i++) {
      const statement = statements[i] + ';';

      console.log(`⏳ Executando comando ${i + 1}/${statements.length}...`);

      const { data, error } = await supabase.rpc('exec_sql', {
        sql: statement
      });

      if (error) {
        console.error(`❌ Erro no comando ${i + 1}:`, error.message);
        console.error('SQL:', statement.substring(0, 200) + '...');

        // Alguns erros são esperados (como "table already exists")
        if (error.message.includes('already exists')) {
          console.log('ℹ️  Tabela/função já existe, continuando...\n');
        } else {
          throw error;
        }
      } else {
        console.log(`✅ Comando ${i + 1} executado com sucesso\n`);
      }
    }

    console.log('✨ Migration concluída com sucesso!\n');

    // Verificar se as tabelas foram criadas
    console.log('🔍 Verificando tabelas criadas...\n');

    const { data: tables, error: tablesError } = await supabase
      .from('tasks')
      .select('count')
      .limit(0);

    if (tablesError) {
      console.error('❌ Erro ao verificar tabela tasks:', tablesError.message);
    } else {
      console.log('✅ Tabela "tasks" criada e acessível');
    }

    const { data: checklists, error: checklistsError } = await supabase
      .from('task_checklists')
      .select('count')
      .limit(0);

    if (checklistsError) {
      console.error('❌ Erro ao verificar tabela task_checklists:', checklistsError.message);
    } else {
      console.log('✅ Tabela "task_checklists" criada e acessível');
    }

    console.log('\n✅ Tudo pronto! O sistema de tarefas está configurado.\n');

  } catch (error) {
    console.error('\n❌ Erro ao executar migration:', error.message);
    console.error(error);
    process.exit(1);
  }
}

runMigration();
