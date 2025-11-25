/**
 * Application Constants
 * Centralized configuration values
 */

// Contact Information
export const CONTACT = {
  WHATSAPP_NUMBER: '554333413000',
  EMAIL: 'contato@geumexclusivos.com.br',
} as const;

// File Upload Limits
export const FILE_UPLOAD = {
  MAX_IMAGE_SIZE_MB: 5, // Reduzido de 15MB para 5MB
  MAX_IMAGE_SIZE_BYTES: 5 * 1024 * 1024,
  MAX_IMAGES_PER_PROPERTY: 10,
  ALLOWED_IMAGE_TYPES: ['image/jpeg', 'image/jpg', 'image/png', 'image/webp'],
  IMAGE_COMPRESSION_QUALITY: 0.85,
  MAX_IMAGE_WIDTH: 1920,
  MAX_IMAGE_HEIGHT: 1920,
} as const;

// Storage Configuration
export const STORAGE = {
  CACHE_CONTROL: '3600',
  BUCKET_NAME: 'imoveis',
} as const;

// Pagination
export const PAGINATION = {
  DEFAULT_PAGE_SIZE: 10,
  ITEMS_PER_PAGE_OPTIONS: [10, 25, 50, 100],
} as const;

// Date Formats
export const DATE_FORMATS = {
  DISPLAY: 'dd/MM/yyyy',
  DISPLAY_WITH_TIME: 'dd/MM/yyyy HH:mm',
  API: 'yyyy-MM-dd',
  MONTH: 'yyyy-MM',
} as const;

// Property Types
export const PROPERTY_TYPES = ['Casa', 'Apartamento', 'Terreno', 'Comercial', 'Rural'] as const;
export type PropertyType = typeof PROPERTY_TYPES[number];

// Business Types
export const BUSINESS_TYPES = ['Venda', 'Locação'] as const;
export type BusinessType = typeof BUSINESS_TYPES[number];

// Ad Platforms
export const AD_PLATFORMS = ['Meta', 'Google'] as const;
export type AdPlatform = typeof AD_PLATFORMS[number];

// Lead Status
export const LEAD_STATUS = ['Aguardando', 'Enviado ao corretor', 'Follow up'] as const;
export type LeadStatus = typeof LEAD_STATUS[number];

// API Configuration
export const API = {
  VIA_CEP_URL: 'https://viacep.com.br/ws',
  MAPBOX_STYLE: 'mapbox://styles/mapbox/streets-v12',
  REQUEST_TIMEOUT: 10000, // 10 seconds
} as const;

// Rate Limiting
export const RATE_LIMIT = {
  CEP_SEARCH_DEBOUNCE_MS: 500,
  GENERAL_SEARCH_DEBOUNCE_MS: 300,
  MAX_REQUESTS_PER_MINUTE: 60,
} as const;

// Toast Messages
export const TOAST_MESSAGES = {
  SUCCESS: {
    SAVE: 'Salvo com sucesso!',
    DELETE: 'Excluído com sucesso!',
    UPDATE: 'Atualizado com sucesso!',
    COPY: 'Copiado para a área de transferência!',
  },
  ERROR: {
    GENERIC: 'Ocorreu um erro. Tente novamente.',
    NETWORK: 'Erro de conexão. Verifique sua internet.',
    SAVE: 'Erro ao salvar. Tente novamente.',
    DELETE: 'Erro ao excluir. Tente novamente.',
    LOAD: 'Erro ao carregar dados.',
    FILE_TOO_LARGE: `Arquivo muito grande. Tamanho máximo: ${FILE_UPLOAD.MAX_IMAGE_SIZE_MB}MB`,
    INVALID_FILE_TYPE: 'Tipo de arquivo inválido. Use apenas imagens.',
  },
  WARNING: {
    UNSAVED_CHANGES: 'Você tem alterações não salvas. Deseja continuar?',
  },
} as const;

// Feature Flags
export const FEATURES = {
  ENABLE_DARK_MODE: true,
  ENABLE_ANALYTICS: false,
  ENABLE_NOTIFICATIONS: false,
  ENABLE_EXPORT_IMPORT: true,
} as const;

// Query Keys (React Query)
export const QUERY_KEYS = {
  IMOVEIS: ['imoveis'] as const,
  IMOVEL: (id: string) => ['imoveis', id] as const,
  METRICAS: ['metricas'] as const,
  METRICA: (imovelId: string, mes: string) => ['metricas', imovelId, mes] as const,
  LEADS: ['leads'] as const,
  LEAD: (id: string) => ['leads', id] as const,
  LEAD_COMMENTS: (leadId: string) => ['lead_comments', leadId] as const,
  PROFILES: ['profiles'] as const,
} as const;

// Environment Variables
export const ENV = {
  SUPABASE_URL: import.meta.env.VITE_SUPABASE_URL,
  SUPABASE_ANON_KEY: import.meta.env.VITE_SUPABASE_PUBLISHABLE_KEY,
  MAPBOX_TOKEN: import.meta.env.VITE_MAPBOX_TOKEN,
  IS_PRODUCTION: import.meta.env.PROD,
  IS_DEVELOPMENT: import.meta.env.DEV,
} as const;
