import { useState, useCallback } from 'react';
import { TopHeader } from '@/components/TopHeader';
import { PageTransition } from '@/components/PageTransition';
import { AppSidebar } from '@/components/AppSidebar';
import { SidebarProvider } from '@/components/ui/sidebar';
import { DashboardTab } from '@/components/dashboard/DashboardTab';
import { ImoveisTab } from '@/components/imoveis/ImoveisTab';
import { LeadsTab } from '@/components/leads/LeadsTab';
import { TasksTab } from '@/components/tasks/TasksTab';
import { MetricasTab } from '@/components/metricas/MetricasTab';
import { RelatoriosTab } from '@/components/relatorios/RelatoriosTab';
import { UsuariosTab } from '@/components/usuarios/UsuariosTab';
import { ChatIATab } from '@/components/chat-ia/ChatIATab';
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
      <div className="min-h-screen flex w-full bg-[#f8f9fc] dark:bg-black">
        <AppSidebar activeTab={activeTab} onTabChange={setActiveTab} />

        <div className="flex-1 flex flex-col h-screen overflow-hidden p-3 md:p-4 gap-4">
          <div className="flex-1 flex flex-col bg-background rounded-[2.5rem] shadow-sm border border-border/40 overflow-hidden relative">
            <TopHeader />

            <main className="flex-1 p-8 overflow-auto scrollbar-hide">
              {activeTab === 'dashboard' && (
                <PageTransition>
                  <DashboardTab key={refreshKey} />
                </PageTransition>
              )}
              {activeTab === 'imoveis' && (
                <PageTransition>
                  <ImoveisTab onToast={showToast} key={refreshKey} />
                </PageTransition>
              )}
              {activeTab === 'leads' && (
                <PageTransition>
                  <LeadsTab onToast={showToast} key={refreshKey} />
                </PageTransition>
              )}
              {activeTab === 'tasks' && (
                <PageTransition>
                  <TasksTab key={refreshKey} />
                </PageTransition>
              )}
              {activeTab === 'metricas' && (
                <PageTransition>
                  <MetricasTab onToast={showToast} key={refreshKey} />
                </PageTransition>
              )}
              {activeTab === 'relatorios' && (
                <PageTransition>
                  <RelatoriosTab showToast={showToast} key={refreshKey} />
                </PageTransition>
              )}
              {activeTab === 'chat-ia' && (
                <PageTransition>
                  <ChatIATab key={refreshKey} />
                </PageTransition>
              )}
              {activeTab === 'usuarios' && isAdmin && (
                <PageTransition>
                  <UsuariosTab key={refreshKey} />
                </PageTransition>
              )}
            </main>
          </div>
        </div>

        <ToastContainer />
      </div>
    </SidebarProvider>
  );
};

export default Index;
