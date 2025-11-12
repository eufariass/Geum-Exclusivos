import { useState, useCallback } from 'react';
import { Header } from '@/components/Header';
import { TabNavigation } from '@/components/TabNavigation';
import { DashboardTab } from '@/components/dashboard/DashboardTab';
import { ImoveisTab } from '@/components/imoveis/ImoveisTab';
import { MetricasTab } from '@/components/metricas/MetricasTab';
import { RelatoriosTab } from '@/components/relatorios/RelatoriosTab';
import { useToastManager } from '@/components/Toast';
import { supabaseStorageService } from '@/lib/supabaseStorage';
import type { TabType } from '@/types';

const Index = () => {
  const [activeTab, setActiveTab] = useState<TabType>('dashboard');
  const [refreshKey, setRefreshKey] = useState(0);
  const { showToast, ToastContainer } = useToastManager();

  const handleUpdate = useCallback(() => {
    setRefreshKey((prev) => prev + 1);
  }, []);

  const handleExport = async () => {
    try {
      const data = await supabaseStorageService.exportData();
      const blob = new Blob([JSON.stringify(data, null, 2)], { type: 'application/json' });
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `geum_backup_${new Date().toISOString().split('T')[0]}.json`;
      a.click();
      URL.revokeObjectURL(url);
      showToast('Dados exportados com sucesso!', 'success');
    } catch (error) {
      console.error('Erro ao exportar:', error);
      showToast('Erro ao exportar dados', 'error');
    }
  };

  const handleImport = () => {
    const input = document.createElement('input');
    input.type = 'file';
    input.accept = 'application/json';
    input.onchange = async (e) => {
      try {
        const file = (e.target as HTMLInputElement).files?.[0];
        if (!file) return;

        const text = await file.text();
        const data = JSON.parse(text);

        if (!data.imoveis || !data.metricas || !data.versao) {
          showToast('Arquivo inválido', 'error');
          return;
        }

        if (
          window.confirm(
            'Importar dados substituirá todos os dados existentes. Deseja continuar?'
          )
        ) {
          await supabaseStorageService.importData(data);
          showToast('Dados importados com sucesso! Recarregando...', 'success');
          setTimeout(() => window.location.reload(), 1500);
        }
      } catch (error) {
        console.error('Erro ao importar:', error);
        showToast('Erro ao importar dados', 'error');
      }
    };
    input.click();
  };

  return (
    <div className="min-h-screen bg-gradient-to-b from-background via-background to-muted">
      <Header onExport={handleExport} onImport={handleImport} />
      <TabNavigation activeTab={activeTab} onTabChange={setActiveTab} />
      
      <main className="container mx-auto px-6 py-8">
        {activeTab === 'dashboard' && <DashboardTab key={refreshKey} />}
        {activeTab === 'imoveis' && (
          <ImoveisTab onToast={showToast} key={refreshKey} />
        )}
        {activeTab === 'metricas' && (
          <MetricasTab onToast={showToast} key={refreshKey} />
        )}
        {activeTab === 'relatorios' && <RelatoriosTab showToast={showToast} key={refreshKey} />}
      </main>

      <ToastContainer />
    </div>
  );
};

export default Index;
