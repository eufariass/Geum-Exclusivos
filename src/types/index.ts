export type TipoImovel = 'Casa' | 'Casa em condomínio' | 'Apartamento' | 'Terreno' | 'Comercial' | 'Rural';

export interface Profile {
  id: string;
  nome_completo: string;
  avatar_url?: string;
  cargo?: string;
  created_at?: string;
  updated_at?: string;
}

export interface Imovel {
  id: string;
  codigo: string;
  titulo?: string;
  cliente: string;
  endereco: string;
  tipo: TipoImovel;
  valor?: number;
  descricao?: string;
  quartos?: number;
  banheiros?: number;
  area_m2?: number;
  vagas?: number;
  image_urls?: string[];
  cover_image_index?: number;
  tipos_disponiveis?: ('Venda' | 'Locação')[];
  plataformas_anuncio?: string[];
  data_cadastro: string;
  created_at?: string;
  created_by?: string;
  updated_by?: string;
}

export interface Metrica {
  id: string;
  imovel_id: string;
  mes: string; // YYYY-MM
  leads: number;
  leads_portais?: number;
  leads_meta?: number;
  leads_google?: number;
  visualizacoes: number;
  visualizacoes_portais?: number;
  visualizacoes_meta?: number;
  visualizacoes_google?: number;
  visitas_realizadas: number;
  data_registro: string;
  created_at?: string;
  created_by?: string;
  updated_by?: string;
}

export interface ExportData {
  imoveis: Imovel[];
  metricas: Metrica[];
  dataExportacao: string;
  versao: string;
}

export interface PipelineStage {
  id: string;
  name: string;
  order_index: number;
  is_final: boolean;
  is_won: boolean;
  color: string;
  created_at?: string;
}

export interface LostReason {
  id: string;
  reason: string;
  is_active: boolean;
  order_index: number;
  created_at?: string;
}

export interface StageHistory {
  id: string;
  lead_id: string;
  from_stage_id?: string;
  to_stage_id?: string;
  changed_by?: string;
  changed_at: string;
  duration_days?: number;
  notes?: string;
}

export interface PipelineMetrics {
  stage_id: string;
  stage_name: string;
  stage_order: number;
  lead_count: number;
  avg_duration_days: number;
  conversion_rate: number;
}

export interface Lead {
  id: string;
  imovel_id: string;
  nome: string;
  telefone: string;
  email: string;
  tipo_interesse: 'Venda' | 'Locação';
  status: 'Aguardando' | 'Enviado ao corretor' | 'Follow up'; // Mantido para compatibilidade
  stage_id?: string;
  lost_reason_id?: string;
  observacoes?: string;
  created_at?: string;
  updated_at?: string;
  created_by?: string;
  updated_by?: string;
}

export interface LeadComment {
  id: string;
  lead_id: string;
  comment: string;
  created_by?: string;
  created_at: string;
}

export type TabType = 'dashboard' | 'imoveis' | 'imoveis-arbo' | 'leads' | 'tasks' | 'metricas' | 'relatorios' | 'usuarios' | 'chat-ia' | 'cms';

// Imóveis do Arbo/Superlógica (Vitrine Pública)
export interface ImovelArbo {
  id: string;
  listing_id: string;
  list_date?: string;
  last_update_date?: string;
  synced_at?: string;
  title?: string;
  description?: string;
  transaction_type?: string;
  property_type?: string;
  publication_type?: string;
  featured?: boolean;
  price?: number;
  currency?: string;
  state?: string;
  state_abbr?: string;
  city?: string;
  neighborhood?: string;
  address?: string;
  street_number?: string;
  complement?: string;
  postal_code?: string;
  latitude?: number;
  longitude?: number;
  living_area?: number;
  lot_area?: number;
  bedrooms?: number;
  bathrooms?: number;
  suites?: number;
  garage?: number;
  unit_floor?: number;
  year_built?: number;
  features?: string[];
  images?: string[];
  primary_image?: string;
  detail_url?: string;
  active?: boolean;
  manual_override?: boolean;
  created_at?: string;
  updated_at?: string;
}

export interface ArboSyncLog {
  id: string;
  started_at: string;
  finished_at?: string;
  status: 'running' | 'success' | 'error';
  total_xml?: number;
  created_count?: number;
  updated_count?: number;
  deactivated_count?: number;
  error_message?: string;
  created_by?: string;
}

// User Roles
export type UserRole = 'admin' | 'corretor';

export interface UserWithRole {
  id: string;
  nome_completo: string;
  email?: string;
  avatar_url?: string;
  cargo?: string;
  status: 'ativo' | 'inativo';
  role: UserRole;
  created_at?: string;
}

// Tarefas
export type TaskType = 'call' | 'email' | 'whatsapp' | 'meeting' | 'visit' | 'follow_up' | 'other';
export type TaskStatus = 'pending' | 'in_progress' | 'completed' | 'cancelled';
export type TaskPriority = 'low' | 'medium' | 'high' | 'urgent';

export interface Task {
  id: string;
  title: string;
  description?: string;
  lead_id?: string;
  imovel_id?: string;
  type: TaskType;
  status: TaskStatus;
  priority: TaskPriority;
  due_date?: string;
  completed_at?: string;
  assigned_to?: string;
  created_by?: string;
  created_at?: string;
  updated_at?: string;
  // Relações populadas
  lead?: Lead;
  imovel?: Imovel;
  checklist?: TaskChecklistItem[];
  comments?: TaskComment[];
  activities?: TaskActivity[];
}

export interface TaskChecklistItem {
  id: string;
  task_id: string;
  item_text: string;
  is_completed: boolean;
  order_index?: number;
  created_at?: string;
}

export interface TaskComment {
  id: string;
  content: string;
  created_by?: string;
  created_by_name?: string;
  created_at: string;
}

export interface TaskActivity {
  id: string;
  action: 'created' | 'status_changed' | 'priority_changed' | 'assigned' | 'due_date_changed' | 'completed' | 'comment_added' | 'comment_deleted';
  description: string;
  old_value?: string;
  new_value?: string;
  created_by?: string;
  created_by_name?: string;
  created_at: string;
}

export interface TaskSummary {
  pending_count: number;
  in_progress_count: number;
  completed_count: number;
  overdue_count: number;
  due_today_count: number;
}

export interface ImovelComment {
  id: string;
  imovel_id: string;
  content: string;
  created_by?: string;
  created_by_name?: string;
  created_at: string;
}

export interface ImovelHistory {
  id: string;
  imovel_id: string;
  action: 'created' | 'updated' | 'image_added' | 'image_removed' | 'comment_added';
  description: string;
  created_by?: string;
  created_by_name?: string;
  created_at: string;
}
