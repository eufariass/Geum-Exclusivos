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
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-foreground">Gestão de Leads</h1>
          <p className="text-muted-foreground mt-1">
            Acompanhe seus leads do primeiro contato ao fechamento
          </p>
        </div>
      </div>

      {/* Tabs: Funil / Métricas */}
      <Tabs defaultValue="pipeline" className="w-full">
        <div className="flex items-center gap-4">
          <TabsList className="grid w-full max-w-[400px] grid-cols-2">
            <TabsTrigger value="pipeline" className="gap-2">
              <LayoutGrid className="h-4 w-4" />
              Funil de Vendas
            </TabsTrigger>
            <TabsTrigger value="metrics" className="gap-2">
              <BarChart3 className="h-4 w-4" />
              Métricas
            </TabsTrigger>
          </TabsList>

          <Button onClick={() => setShowCreateModal(true)} className="gap-2">
            <Plus className="h-4 w-4" />
            Novo Lead
          </Button>
        </div>

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