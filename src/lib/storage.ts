import { Imovel, Metrica, ExportData } from '@/types';

const IMOVEIS_KEY = 'geum_imoveis';
const METRICAS_KEY = 'geum_metricas';

export const storageService = {
  // Imóveis
  getImoveis(): Imovel[] {
    try {
      const data = localStorage.getItem(IMOVEIS_KEY);
      return data ? JSON.parse(data) : [];
    } catch {
      return [];
    }
  },

  setImoveis(imoveis: Imovel[]): void {
    localStorage.setItem(IMOVEIS_KEY, JSON.stringify(imoveis));
  },

  addImovel(imovel: Imovel): void {
    const imoveis = this.getImoveis();
    imoveis.push(imovel);
    this.setImoveis(imoveis);
  },

  updateImovel(id: string, data: Partial<Imovel>): void {
    const imoveis = this.getImoveis();
    const index = imoveis.findIndex((i) => i.id === id);
    if (index !== -1) {
      imoveis[index] = { ...imoveis[index], ...data };
      this.setImoveis(imoveis);
    }
  },

  deleteImovel(id: string): void {
    const imoveis = this.getImoveis().filter((i) => i.id !== id);
    this.setImoveis(imoveis);
    // Remove métricas relacionadas
    const metricas = this.getMetricas().filter((m) => m.imovelId !== id);
    this.setMetricas(metricas);
  },

  // Métricas
  getMetricas(): Metrica[] {
    try {
      const data = localStorage.getItem(METRICAS_KEY);
      return data ? JSON.parse(data) : [];
    } catch {
      return [];
    }
  },

  setMetricas(metricas: Metrica[]): void {
    localStorage.setItem(METRICAS_KEY, JSON.stringify(metricas));
  },

  addMetrica(metrica: Metrica): void {
    const metricas = this.getMetricas();
    metricas.push(metrica);
    this.setMetricas(metricas);
  },

  deleteMetrica(id: string): void {
    const metricas = this.getMetricas().filter((m) => m.id !== id);
    this.setMetricas(metricas);
  },

  getMetricaByImovelMes(imovelId: string, mes: string): Metrica | undefined {
    return this.getMetricas().find((m) => m.imovelId === imovelId && m.mes === mes);
  },

  updateMetrica(imovelId: string, mes: string, data: Partial<Metrica>): void {
    const metricas = this.getMetricas();
    const index = metricas.findIndex((m) => m.imovelId === imovelId && m.mes === mes);
    if (index !== -1) {
      metricas[index] = { ...metricas[index], ...data };
      this.setMetricas(metricas);
    }
  },

  // Export/Import
  exportData(): ExportData {
    return {
      imoveis: this.getImoveis(),
      metricas: this.getMetricas(),
      dataExportacao: new Date().toISOString(),
      versao: '2.0',
    };
  },

  importData(data: ExportData): void {
    if (data.imoveis) this.setImoveis(data.imoveis);
    if (data.metricas) this.setMetricas(data.metricas);
  },

  clearAll(): void {
    localStorage.removeItem(IMOVEIS_KEY);
    localStorage.removeItem(METRICAS_KEY);
  },
};
