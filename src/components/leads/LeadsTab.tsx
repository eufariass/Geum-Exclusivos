import { useState } from 'react';
import { PipelineBoard } from './PipelineBoard';
import { PipelineMetricsComponent } from './PipelineMetricsComponent';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { LayoutGrid, BarChart3 } from 'lucide-react';

interface LeadsTabProps {
  onToast: (message: string, type: 'success' | 'error') => void;
}

export const LeadsTab = ({ onToast }: LeadsTabProps) => {
  const [refreshKey, setRefreshKey] = useState(0);

  const handleRefresh = () => {
    setRefreshKey((prev) => prev + 1);
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

        <TabsContent value="pipeline" className="mt-6">
          <PipelineBoard key={refreshKey} onRefresh={handleRefresh} />
        </TabsContent>

        <TabsContent value="metrics" className="mt-6">
          <PipelineMetricsComponent key={refreshKey} />
        </TabsContent>
      </Tabs>
    </div>
  );
};