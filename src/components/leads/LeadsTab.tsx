import { useState } from 'react';
import { PipelineBoard } from './PipelineBoard';
import { PipelineMetricsComponent } from './PipelineMetricsComponent';
import { CreateLeadModal } from './CreateLeadModal';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Button } from '@/components/ui/button';
import { LayoutGrid, BarChart3, Plus } from 'lucide-react';

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
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Gestão de Leads</h1>
          <p className="text-muted-foreground mt-1">
            Acompanhe seus leads do primeiro contato ao fechamento
          </p>
        </div>

        <Button onClick={() => setShowCreateModal(true)} className="gap-2" size="lg">
          <Plus className="h-5 w-5" />
          Novo Lead
        </Button>
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