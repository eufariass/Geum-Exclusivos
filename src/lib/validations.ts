/**
 * Validation Schemas using Zod
 */
import { z } from 'zod';
import { PROPERTY_TYPES, BUSINESS_TYPES, AD_PLATFORMS, LEAD_STATUS } from './constants';

// CEP Regex (formato: 12345-678 ou 12345678)
const cepRegex = /^\d{5}-?\d{3}$/;

// Phone Regex (formato brasileiro)
const phoneRegex = /^(?:\+55\s?)?\(?([1-9][0-9])\)?\s?9?\s?\d{4}-?\d{4}$/;

// Imovel Schema
export const imovelSchema = z.object({
  codigo: z.string()
    .min(1, 'Código é obrigatório')
    .max(50, 'Código deve ter no máximo 50 caracteres')
    .trim(),

  titulo: z.string()
    .max(200, 'Título deve ter no máximo 200 caracteres')
    .trim()
    .optional(),

  cliente: z.string()
    .min(1, 'Cliente é obrigatório')
    .max(100, 'Nome do cliente deve ter no máximo 100 caracteres')
    .trim(),

  cep: z.string()
    .regex(cepRegex, 'CEP inválido')
    .optional()
    .or(z.literal('')),

  rua: z.string()
    .max(200, 'Rua deve ter no máximo 200 caracteres')
    .trim()
    .optional(),

  numero: z.string()
    .max(20, 'Número deve ter no máximo 20 caracteres')
    .trim()
    .optional(),

  bairro: z.string()
    .max(100, 'Bairro deve ter no máximo 100 caracteres')
    .trim()
    .optional(),

  cidade: z.string()
    .max(100, 'Cidade deve ter no máximo 100 caracteres')
    .trim()
    .optional(),

  estado: z.string()
    .length(2, 'Estado deve ter 2 caracteres')
    .toUpperCase()
    .optional(),

  endereco: z.string()
    .min(1, 'Endereço é obrigatório')
    .max(500, 'Endereço deve ter no máximo 500 caracteres')
    .trim(),

  tipo: z.enum(PROPERTY_TYPES),

  valor: z.number()
    .positive('Valor deve ser positivo')
    .optional(),

  descricao: z.string()
    .max(2000, 'Descrição deve ter no máximo 2000 caracteres')
    .trim()
    .optional(),

  quartos: z.number()
    .int('Quartos deve ser um número inteiro')
    .min(0, 'Quartos deve ser maior ou igual a 0')
    .optional(),

  banheiros: z.number()
    .int('Banheiros deve ser um número inteiro')
    .min(0, 'Banheiros deve ser maior ou igual a 0')
    .optional(),

  area_m2: z.number()
    .positive('Área deve ser positiva')
    .optional(),

  vagas: z.number()
    .int('Vagas deve ser um número inteiro')
    .min(0, 'Vagas deve ser maior ou igual a 0')
    .optional(),

  tipos_disponiveis: z.array(z.enum(BUSINESS_TYPES))
    .min(1, 'Selecione pelo menos um tipo de negócio'),

  plataformas_anuncio: z.array(z.enum(AD_PLATFORMS))
    .optional()
    .default([]),

  image_urls: z.array(z.string().url('URL de imagem inválida'))
    .optional()
    .default([]),

  cover_image_index: z.number()
    .int()
    .min(0)
    .optional()
    .default(0),
});

export type ImovelFormData = z.infer<typeof imovelSchema>;

// Lead Schema
export const leadSchema = z.object({
  nome: z.string()
    .min(1, 'Nome é obrigatório')
    .max(100, 'Nome deve ter no máximo 100 caracteres')
    .trim(),

  telefone: z.string()
    .min(1, 'Telefone é obrigatório')
    .regex(phoneRegex, 'Telefone inválido. Use o formato: (00) 99999-9999')
    .trim(),

  email: z.string()
    .min(1, 'E-mail é obrigatório')
    .email('E-mail inválido')
    .max(100, 'E-mail deve ter no máximo 100 caracteres')
    .trim()
    .toLowerCase(),

  tipo_interesse: z.enum(BUSINESS_TYPES),

  observacoes: z.string()
    .max(1000, 'Observações devem ter no máximo 1000 caracteres')
    .trim()
    .optional(),

  status: z.enum(LEAD_STATUS)
    .default('Aguardando'),

  imovel_id: z.string().uuid('ID do imóvel inválido'),
});

export type LeadFormData = z.infer<typeof leadSchema>;

// Lead Comment Schema
export const leadCommentSchema = z.object({
  comment: z.string()
    .min(1, 'Comentário é obrigatório')
    .max(500, 'Comentário deve ter no máximo 500 caracteres')
    .trim(),

  lead_id: z.string().uuid('ID do lead inválido'),
});

export type LeadCommentFormData = z.infer<typeof leadCommentSchema>;

// Metrica Schema
export const metricaSchema = z.object({
  imovel_id: z.string().uuid('ID do imóvel inválido'),

  mes: z.string()
    .regex(/^\d{4}-\d{2}$/, 'Mês inválido. Use o formato: YYYY-MM'),

  leads: z.number()
    .int('Leads deve ser um número inteiro')
    .min(0, 'Leads deve ser maior ou igual a 0')
    .default(0),

  visualizacoes: z.number()
    .int('Visualizações deve ser um número inteiro')
    .min(0, 'Visualizações deve ser maior ou igual a 0')
    .default(0),

  visitas_realizadas: z.number()
    .int('Visitas deve ser um número inteiro')
    .min(0, 'Visitas deve ser maior ou igual a 0')
    .default(0),
});

export type MetricaFormData = z.infer<typeof metricaSchema>;

// Auth Schemas
export const loginSchema = z.object({
  email: z.string()
    .min(1, 'E-mail é obrigatório')
    .email('E-mail inválido')
    .trim()
    .toLowerCase(),

  password: z.string()
    .min(6, 'Senha deve ter no mínimo 6 caracteres')
    .max(100, 'Senha deve ter no máximo 100 caracteres'),
});

export type LoginFormData = z.infer<typeof loginSchema>;

export const signupSchema = loginSchema.extend({
  nomeCompleto: z.string()
    .min(1, 'Nome completo é obrigatório')
    .max(100, 'Nome deve ter no máximo 100 caracteres')
    .trim(),

  confirmPassword: z.string()
    .min(6, 'Confirmação de senha deve ter no mínimo 6 caracteres'),
}).refine((data) => data.password === data.confirmPassword, {
  message: 'As senhas não coincidem',
  path: ['confirmPassword'],
});

export type SignupFormData = z.infer<typeof signupSchema>;

export const resetPasswordSchema = z.object({
  email: z.string()
    .min(1, 'E-mail é obrigatório')
    .email('E-mail inválido')
    .trim()
    .toLowerCase(),
});

export type ResetPasswordFormData = z.infer<typeof resetPasswordSchema>;

export const updatePasswordSchema = z.object({
  password: z.string()
    .min(6, 'Senha deve ter no mínimo 6 caracteres')
    .max(100, 'Senha deve ter no máximo 100 caracteres'),

  confirmPassword: z.string()
    .min(6, 'Confirmação de senha deve ter no mínimo 6 caracteres'),
}).refine((data) => data.password === data.confirmPassword, {
  message: 'As senhas não coincidem',
  path: ['confirmPassword'],
});

export type UpdatePasswordFormData = z.infer<typeof updatePasswordSchema>;

// Profile Schema
export const profileSchema = z.object({
  nome_completo: z.string()
    .min(1, 'Nome completo é obrigatório')
    .max(100, 'Nome deve ter no máximo 100 caracteres')
    .trim(),

  cargo: z.string()
    .max(100, 'Cargo deve ter no máximo 100 caracteres')
    .trim()
    .optional(),

  avatar_url: z.string()
    .url('URL do avatar inválida')
    .optional()
    .or(z.literal('')),
});

export type ProfileFormData = z.infer<typeof profileSchema>;
