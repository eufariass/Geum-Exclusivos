import { useState, useMemo } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Metrica } from '@/types';
import { storageService } from '@/lib/storage';
import { getCurrentMonth, getMonthName } from '@/lib/dateUtils';

interface MetricasTabProps {
  onUpdate: () => void;
  showToast: (message: string, type: 'success' | 'error') => void;
}

export const MetricasTab = ({ onUpdate, showToast }: MetricasTabProps) => {
  const imoveis = storageService.getImoveis();
  const [metricas, setMetricas] = useState<Metrica[]>(storageService.getMetricas());

  const [formData, setFormData] = useState({
    imovelId: '',
    mes: getCurrentMonth(),
    leads: '',
    visualizacoes: '',
    visitasRealizadas: '',
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();

    if (!formData.imovelId) {
      showToast('Selecione um imóvel', 'error');
      return;
    }

    const leads = parseInt(formData.leads) || 0;
    const visualizacoes = parseInt(formData.visualizacoes) || 0;
    const visitasRealizadas = parseInt(formData.visitasRealizadas) || 0;

    // Check if exists
    const existing = storageService.getMetricaByImovelMes(formData.imovelId, formData.mes);

    if (existing) {
      if (window.confirm('Já existe uma métrica para este imóvel neste mês. Deseja substituir?')) {
        storageService.updateMetrica(formData.imovelId, formData.mes, {
          leads,
          visualizacoes,
          visitasRealizadas,
          dataRegistro: new Date().toISOString(),
        });
        showToast('Métrica atualizada com sucesso!', 'success');
      } else {
        return;
      }
    } else {
      const metrica: Metrica = {
        id: Math.random().toString(36).substring(7),
        imovelId: formData.imovelId,
        mes: formData.mes,
        leads,
        visualizacoes,
        visitasRealizadas,
        dataRegistro: new Date().toISOString(),
      };
      storageService.addMetrica(metrica);
      showToast('Métrica adicionada com sucesso!', 'success');
    }

    setMetricas(storageService.getMetricas());
    setFormData({
      imovelId: '',
      mes: getCurrentMonth(),
      leads: '',
      visualizacoes: '',
      visitasRealizadas: '',
    });
    onUpdate();
  };

  const handleDelete = (id: string) => {
    if (window.confirm('Tem certeza que deseja deletar esta métrica?')) {
      storageService.deleteMetrica(id);
      setMetricas(storageService.getMetricas());
      showToast('Métrica deletada com sucesso!', 'success');
      onUpdate();
    }
  };

  const metricasByMonth = useMemo(() => {
    const grouped = metricas.reduce((acc, metrica) => {
      if (!acc[metrica.mes]) acc[metrica.mes] = [];
      acc[metrica.mes].push(metrica);
      return acc;
    }, {} as Record<string, Metrica[]>);

    return Object.entries(grouped)
      .sort(([a], [b]) => b.localeCompare(a))
      .map(([mes, items]) => ({ mes, items }));
  }, [metricas]);

  return (
    <div className="space-y-6">
      <div className="bg-card rounded-xl p-6 shadow-sm border border-border">
        <h2 className="text-xl font-bold mb-4">Adicionar Métricas</h2>
        <form onSubmit={handleSubmit} className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          <div>
            <Label htmlFor="imovel">Imóvel *</Label>
            <Select value={formData.imovelId} onValueChange={(value) => setFormData((prev) => ({ ...prev, imovelId: value }))}>
              <SelectTrigger id="imovel">
                <SelectValue placeholder="Selecione..." />
              </SelectTrigger>
              <SelectContent>
                {imoveis.map((imovel) => (
                  <SelectItem key={imovel.id} value={imovel.id}>
                    {imovel.codigo} - {imovel.endereco}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <div>
            <Label htmlFor="mes">Mês *</Label>
            <Input
              id="mes"
              type="month"
              value={formData.mes}
              onChange={(e) => setFormData((prev) => ({ ...prev, mes: e.target.value }))}
            />
          </div>

          <div>
            <Label htmlFor="leads">Leads</Label>
            <Input
              id="leads"
              type="number"
              min="0"
              value={formData.leads}
              onChange={(e) => setFormData((prev) => ({ ...prev, leads: e.target.value }))}
              placeholder="0"
            />
          </div>

          <div>
            <Label htmlFor="visualizacoes">Visualizações</Label>
            <Input
              id="visualizacoes"
              type="number"
              min="0"
              value={formData.visualizacoes}
              onChange={(e) => setFormData((prev) => ({ ...prev, visualizacoes: e.target.value }))}
              placeholder="0"
            />
          </div>

          <div>
            <Label htmlFor="visitas">Visitas Realizadas</Label>
            <Input
              id="visitas"
              type="number"
              min="0"
              value={formData.visitasRealizadas}
              onChange={(e) => setFormData((prev) => ({ ...prev, visitasRealizadas: e.target.value }))}
              placeholder="0"
            />
          </div>

          <div className="flex items-end">
            <Button type="submit" className="w-full">
              Adicionar Métricas
            </Button>
          </div>
        </form>
      </div>

      <div>
        <h2 className="text-xl font-bold mb-4">Histórico de Métricas</h2>
        {metricasByMonth.length === 0 ? (
          <div className="bg-card rounded-xl p-12 text-center shadow-sm border border-border">
            <p className="text-6xl mb-4">📊</p>
            <h3 className="text-xl font-semibold mb-2">Nenhuma métrica registrada</h3>
            <p className="text-muted-foreground">Adicione métricas usando o formulário acima</p>
          </div>
        ) : (
          <div className="space-y-6">
            {metricasByMonth.map(({ mes, items }) => (
              <div key={mes} className="bg-card rounded-xl p-6 shadow-sm border border-border">
                <h3 className="text-lg font-semibold mb-4 capitalize">{getMonthName(mes)}</h3>
                <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
                  {items.map((metrica) => {
                    const imovel = imoveis.find((i) => i.id === metrica.imovelId);
                    return (
                      <div key={metrica.id} className="border border-border rounded-lg p-4 card-hover">
                        <div className="flex items-start justify-between mb-3">
                          <span className="text-xs font-semibold text-muted-foreground bg-muted px-2 py-1 rounded">
                            {imovel?.codigo || 'N/A'}
                          </span>
                          <button
                            onClick={() => handleDelete(metrica.id)}
                            className="text-destructive hover:text-destructive/80 text-sm"
                          >
                            🗑️
                          </button>
                        </div>
                        <p className="text-sm font-medium mb-3">{imovel?.endereco || 'Imóvel não encontrado'}</p>
                        <div className="space-y-1 text-sm">
                          <p>📧 Leads: {metrica.leads}</p>
                          <p>👁️ Visualizações: {metrica.visualizacoes.toLocaleString('pt-BR')}</p>
                          <p>🚗 Visitas: {metrica.visitasRealizadas}</p>
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
};
