import { useCallback } from 'react';
import { toast } from 'sonner';
import { TOAST_MESSAGES } from '@/lib/constants';
import { PostgrestError } from '@supabase/supabase-js';

interface ErrorHandlerOptions {
  showToast?: boolean;
  customMessage?: string;
  logError?: boolean;
}

/**
 * Hook to handle errors consistently across the application
 */
export function useErrorHandler() {
  const handleError = useCallback((
    error: unknown,
    options: ErrorHandlerOptions = {}
  ) => {
    const {
      showToast = true,
      customMessage,
      logError = true,
    } = options;

    let errorMessage = customMessage || TOAST_MESSAGES.ERROR.GENERIC;

    // Handle Supabase/Postgres errors
    if (isPostgrestError(error)) {
      errorMessage = getPostgrestErrorMessage(error);
    }
    // Handle standard Error objects
    else if (error instanceof Error) {
      errorMessage = error.message;
    }
    // Handle network errors
    else if (isNetworkError(error)) {
      errorMessage = TOAST_MESSAGES.ERROR.NETWORK;
    }
    // Handle string errors
    else if (typeof error === 'string') {
      errorMessage = error;
    }

    // Log error in development
    if (logError && import.meta.env.DEV) {
      console.error('Error caught by useErrorHandler:', error);
    }

    // Show toast notification
    if (showToast) {
      toast.error(errorMessage);
    }

    return errorMessage;
  }, []);

  return { handleError };
}

// Type guard for Postgrest errors
function isPostgrestError(error: unknown): error is PostgrestError {
  return (
    typeof error === 'object' &&
    error !== null &&
    'code' in error &&
    'message' in error &&
    'details' in error
  );
}

// Type guard for network errors
function isNetworkError(error: unknown): boolean {
  if (error instanceof Error) {
    return (
      error.message.toLowerCase().includes('network') ||
      error.message.toLowerCase().includes('fetch') ||
      error.message.toLowerCase().includes('connection')
    );
  }
  return false;
}

// Get user-friendly message for Postgrest errors
function getPostgrestErrorMessage(error: PostgrestError): string {
  // Common Postgrest error codes
  switch (error.code) {
    case '23505': // unique_violation
      return 'Este registro já existe.';
    case '23503': // foreign_key_violation
      return 'Não é possível excluir este registro pois está sendo usado.';
    case '23502': // not_null_violation
      return 'Campo obrigatório não foi preenchido.';
    case '42501': // insufficient_privilege
      return 'Você não tem permissão para realizar esta ação.';
    case 'PGRST116': // JWT expired
      return 'Sua sessão expirou. Faça login novamente.';
    case 'PGRST301': // Row not found
      return 'Registro não encontrado.';
    default:
      return error.message || TOAST_MESSAGES.ERROR.GENERIC;
  }
}
