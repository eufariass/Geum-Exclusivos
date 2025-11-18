import { useState, useCallback } from 'react';
import { Header } from '@/components/Header';
import { TabNavigation } from '@/components/TabNavigation';
import { DashboardTab } from '@/components/dashboard/DashboardTab';
import { ImoveisTab } from '@/components/imoveis/ImoveisTab';
import { LeadsTab } from '@/components/leads/LeadsTab';
import { MetricasTab } from '@/components/metricas/MetricasTab';
import { RelatoriosTab } from '@/components/relatorios/RelatoriosTab';
import { useToastManager } from '@/components/Toast';
import type { TabType } from '@/types';

const Index = () => {
  const [activeTab, setActiveTab] = useState<TabType>('dashboard');
  const [refreshKey, setRefreshKey] = useState(0);
  const { showToast, ToastContainer } = useToastManager();

  const handleUpdate = useCallback(() => {
    setRefreshKey((prev) => prev + 1);
  }, []);

  return (
    <div className="min-h-screen bg-gradient-to-b from-background via-background to-muted">
      <Header />
      <TabNavigation activeTab={activeTab} onTabChange={setActiveTab} />
      
      <main className="container mx-auto px-6 py-8">
        {activeTab === 'dashboard' && <DashboardTab key={refreshKey} />}
        {activeTab === 'imoveis' && (
          <ImoveisTab onToast={showToast} key={refreshKey} />
        )}
        {activeTab === 'leads' && (
          <LeadsTab onToast={showToast} key={refreshKey} />
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
