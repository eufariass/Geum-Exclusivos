export type TipoImovel = 'Casa' | 'Apartamento' | 'Terreno' | 'Comercial' | 'Rural';

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
  visualizacoes: number;
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

export interface Lead {
  id: string;
  imovel_id: string;
  nome: string;
  telefone: string;
  email: string;
  tipo_interesse: 'Venda' | 'Locação';
  status: 'Aguardando' | 'Enviado ao corretor' | 'Follow up';
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

export type TabType = 'dashboard' | 'imoveis' | 'leads' | 'metricas' | 'relatorios';
