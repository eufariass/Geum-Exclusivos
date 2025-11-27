/**
 * Utilitário para tratar erros do Supabase de forma amigável
 */

export class SupabaseMigrationError extends Error {
  constructor(message: string) {
    super(message);
    this.name = 'SupabaseMigrationError';
  }
}

/**
 * Verifica se o erro é relacionado a tabela não existir
 */
export function isTableNotExistsError(error: any): boolean {
  if (!error) return false;

  const errorMessage = error.message?.toLowerCase() || '';
  const errorCode = error.code || '';

  return (
    errorMessage.includes('relation') &&
    errorMessage.includes('does not exist')
  ) ||
  errorCode === '42P01'; // PostgreSQL error code for "undefined_table"
}

/**
 * Retorna mensagem amigável para erro de tabela não existente
 */
export function getTableNotExistsMessage(tableName: string): string {
  return `
⚠️ CONFIGURAÇÃO NECESSÁRIA

A tabela "${tableName}" não existe no banco de dados.

Para resolver:
1. Abra o arquivo GUIA_CONFIGURACAO_SUPABASE.md na raiz do projeto
2. Siga as instruções para executar a migration no Supabase
3. Ou compartilhe o arquivo EXECUTAR_NO_SUPABASE.sql com alguém que tenha acesso ao Supabase

Após executar a migration, recarregue a página.
  `.trim();
}

/**
 * Trata erros do Supabase e retorna mensagem amigável
 */
export function handleSupabaseError(error: any, context: string = 'operação'): Error {
  logger.error(`Erro ao executar ${context}`, error);

  if (isTableNotExistsError(error)) {
    const tableName = extractTableName(error.message || '');
    const message = getTableNotExistsMessage(tableName);
    return new SupabaseMigrationError(message);
  }

  // Outros erros comuns
  if (error.message?.includes('violates foreign key constraint')) {
    return new Error('Erro: O registro está vinculado a outros dados. Remova as vinculações primeiro.');
  }

  if (error.message?.includes('duplicate key')) {
    return new Error('Erro: Este registro já existe.');
  }

  if (error.message?.includes('permission denied')) {
    return new Error('Erro: Você não tem permissão para esta operação.');
  }

  // Erro genérico
  return new Error(`Erro ao executar ${context}: ${error.message || 'Erro desconhecido'}`);
}

/**
 * Extrai o nome da tabela da mensagem de erro
 */
function extractTableName(errorMessage: string): string {
  const match = errorMessage.match(/relation "([^"]+)" does not exist/);
  return match ? match[1] : 'tasks';
}

// Logger mock se não existir
const logger = {
  error: (message: string, error: any) => {
    console.error(message, error);
  },
  info: (message: string, data?: any) => {
    console.log(message, data);
  },
  warn: (message: string, data?: any) => {
    console.warn(message, data);
  }
};
