import { useState } from 'react';
import { PipelineBoard } from './PipelineBoard';
import { PipelineMetricsComponent } from './PipelineMetricsComponent';
import { CreateLeadModal } from './CreateLeadModal';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Button } from '@/components/ui/button';
import { LayoutGrid, BarChart3, Plus, Users, Sparkles } from 'lucide-react';

interface LeadsTabProps {
  onToast: (message: string, type: 'success' | 'error') => void;
}

export const LeadsTab = ({ onToast }: LeadsTabProps) => {
  const [refreshKey, setRefreshKey] = useState(0);
  const [showCreateModal, setShowCreateModal] = useState(false);

  const handleRefresh = () => {
    setRefreshKey((prev) => prev + 1);
  };

  const handleCreateSuccess = () => {
    handleRefresh();
  };

  return (
    <div className="space-y-8">
      {/* Header Premium */}
      <div className="relative overflow-hidden rounded-2xl bg-gradient-to-br from-slate-900 via-slate-800 to-slate-900 p-8 border border-white/10">
        {/* Efeitos decorativos */}
        <div className="absolute top-0 right-0 w-64 h-64 bg-blue-500/10 rounded-full blur-3xl -translate-y-1/2 translate-x-1/2" />
        <div className="absolute bottom-0 left-0 w-48 h-48 bg-purple-500/10 rounded-full blur-3xl translate-y-1/2 -translate-x-1/2" />

        <div className="relative z-10 flex items-center justify-between">
          <div className="flex items-center gap-4">
            <div className="p-3 bg-gradient-to-br from-blue-500 to-purple-600 rounded-xl shadow-lg shadow-blue-500/20">
              <Users className="h-6 w-6 text-white" />
            </div>
            <div>
              <h1 className="text-3xl font-bold text-white tracking-tight">
                Gestão de Leads
              </h1>
              <p className="text-slate-400 mt-1 flex items-center gap-2">
                <Sparkles className="h-4 w-4 text-purple-400" />
                Acompanhe seus leads do primeiro contato ao fechamento
              </p>
            </div>
          </div>

          <Button
            onClick={() => setShowCreateModal(true)}
            className="gap-2 bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-500 hover:to-purple-500 border-0 shadow-lg shadow-purple-500/20 text-white"
            size="lg"
          >
            <Plus className="h-5 w-5" />
            Novo Lead
          </Button>
        </div>
      </div>

      {/* Tabs: Funil / Métricas */}
      <Tabs defaultValue="pipeline" className="w-full">
        <TabsList className="inline-flex h-12 items-center justify-center rounded-xl bg-muted/50 p-1.5 backdrop-blur-sm border border-border/50">
          <TabsTrigger
            value="pipeline"
            className="gap-2 rounded-lg px-6 py-2.5 text-sm font-medium transition-all data-[state=active]:bg-background data-[state=active]:shadow-sm"
          >
            <LayoutGrid className="h-4 w-4" />
            Funil de Vendas
          </TabsTrigger>
          <TabsTrigger
            value="metrics"
            className="gap-2 rounded-lg px-6 py-2.5 text-sm font-medium transition-all data-[state=active]:bg-background data-[state=active]:shadow-sm"
          >
            <BarChart3 className="h-4 w-4" />
            Métricas
          </TabsTrigger>
        </TabsList>

        <TabsContent value="pipeline" className="mt-6">
          <PipelineBoard key={refreshKey} onRefresh={handleRefresh} />
        </TabsContent>

        <TabsContent value="metrics" className="mt-6">
          <PipelineMetricsComponent key={refreshKey} />
        </TabsContent>
      </Tabs>

      {/* Modal de criação */}
      <CreateLeadModal
        isOpen={showCreateModal}
        onClose={() => setShowCreateModal(false)}
        onSuccess={handleCreateSuccess}
      />
    </div>
  );
};