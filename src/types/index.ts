export type TipoImovel = 'Casa' | 'Apartamento' | 'Terreno' | 'Comercial' | 'Rural';

export interface Imovel {
  id: string;
  codigo: string;
  cliente: string;
  endereco: string;
  tipo: TipoImovel;
  valor?: number;
  dataCadastro: string;
}

export interface Metrica {
  id: string;
  imovelId: string;
  mes: string; // YYYY-MM
  leads: number;
  visualizacoes: number;
  visitasRealizadas: number;
  dataRegistro: string;
}

export interface ExportData {
  imoveis: Imovel[];
  metricas: Metrica[];
  dataExportacao: string;
  versao: string;
}

export type TabType = 'dashboard' | 'imoveis' | 'metricas' | 'relatorios';
