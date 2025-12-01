import { useState, useCallback } from 'react';
import { TopHeader } from '@/components/TopHeader';
import { AppSidebar } from '@/components/AppSidebar';
import { SidebarProvider } from '@/components/ui/sidebar';
import { DashboardTab } from '@/components/dashboard/DashboardTab';
import { ImoveisTab } from '@/components/imoveis/ImoveisTab';
import { LeadsTab } from '@/components/leads/LeadsTab';
import { TasksTab } from '@/components/tasks/TasksTab';
import { MetricasTab } from '@/components/metricas/MetricasTab';
import { RelatoriosTab } from '@/components/relatorios/RelatoriosTab';
import { UsuariosTab } from '@/components/usuarios/UsuariosTab';
import { useToastManager } from '@/components/Toast';
import { usePermissions } from '@/hooks/usePermissions';
import type { TabType } from '@/types';

const Index = () => {
  const [activeTab, setActiveTab] = useState<TabType>('dashboard');
  const [refreshKey, setRefreshKey] = useState(0);
  const { showToast, ToastContainer } = useToastManager();
  const { isAdmin } = usePermissions();

  const handleUpdate = useCallback(() => {
    setRefreshKey((prev) => prev + 1);
  }, []);

  return (
    <SidebarProvider>
      <div className="min-h-screen flex w-full bg-background">
        <AppSidebar activeTab={activeTab} onTabChange={setActiveTab} />
        
        <div className="flex-1 flex flex-col">
          <TopHeader />
          
          <main className="flex-1 p-6 overflow-auto">
            {activeTab === 'dashboard' && <DashboardTab key={refreshKey} />}
            {activeTab === 'imoveis' && (
              <ImoveisTab onToast={showToast} key={refreshKey} />
            )}
            {activeTab === 'leads' && (
              <LeadsTab onToast={showToast} key={refreshKey} />
            )}
            {activeTab === 'tasks' && <TasksTab key={refreshKey} />}
            {activeTab === 'metricas' && (
              <MetricasTab onToast={showToast} key={refreshKey} />
            )}
            {activeTab === 'relatorios' && <RelatoriosTab showToast={showToast} key={refreshKey} />}
            {activeTab === 'usuarios' && isAdmin && <UsuariosTab key={refreshKey} />}
          </main>
        </div>

        <ToastContainer />
      </div>
    </SidebarProvider>
  );
};

export default Index;
