import { useState, useMemo, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Imovel, Metrica } from '@/types';
import { supabaseStorageService } from '@/lib/supabaseStorage';
import { getCurrentMonth, getMonthName } from '@/lib/dateUtils';

interface MetricasTabProps {
  onToast: (message: string, type: 'success' | 'error') => void;
}

export const MetricasTab = ({ onToast }: MetricasTabProps) => {
  const [imoveis, setImoveis] = useState<Imovel[]>([]);
  const [metricas, setMetricas] = useState<Metrica[]>([]);
  const [loading, setLoading] = useState(true);

  const [formData, setFormData] = useState({
    imovelId: '',
    mes: getCurrentMonth(),
    leads: '',
    visualizacoes: '',
    visitasRealizadas: '',
  });

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    try {
      const [imoveisData, metricasData] = await Promise.all([
        supabaseStorageService.getImoveis(),
        supabaseStorageService.getMetricas()
      ]);
      setImoveis(imoveisData);
      setMetricas(metricasData);
    } catch (error) {
      console.error('Erro ao carregar dados:', error);
      onToast('Erro ao carregar dados', 'error');
    } finally {
      setLoading(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!formData.imovelId) {
      onToast('Selecione um imóvel', 'error');
      return;
    }

    try {
      const leads = parseInt(formData.leads) || 0;
      const visualizacoes = parseInt(formData.visualizacoes) || 0;
      const visitas_realizadas = parseInt(formData.visitasRealizadas) || 0;

      const existing = await supabaseStorageService.getMetricaByImovelMes(formData.imovelId, formData.mes);

      if (existing) {
        if (window.confirm('Já existe uma métrica para este imóvel neste mês. Deseja substituir?')) {
          await supabaseStorageService.updateMetrica(formData.imovelId, formData.mes, {
            leads,
            visualizacoes,
            visitas_realizadas,
            data_registro: new Date().toISOString(),
          });
          onToast('Métrica atualizada com sucesso!', 'success');
        } else {
          return;
        }
      } else {
        await supabaseStorageService.addMetrica({
          imovel_id: formData.imovelId,
          mes: formData.mes,
          leads,
          visualizacoes,
          visitas_realizadas,
          data_registro: new Date().toISOString(),
        });
        onToast('Métrica adicionada com sucesso!', 'success');
      }

      await loadData();
      setFormData({
        imovelId: '',
        mes: getCurrentMonth(),
        leads: '',
        visualizacoes: '',
        visitasRealizadas: '',
      });
    } catch (error) {
      console.error('Erro ao salvar métrica:', error);
      onToast('Erro ao salvar métrica', 'error');
    }
  };

  const handleDelete = async (id: string) => {
    if (window.confirm('Tem certeza que deseja deletar esta métrica?')) {
      try {
        await supabaseStorageService.deleteMetrica(id);
        await loadData();
        onToast('Métrica deletada com sucesso!', 'success');
      } catch (error) {
        console.error('Erro ao deletar métrica:', error);
        onToast('Erro ao deletar métrica', 'error');
      }
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

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="text-muted-foreground">Carregando métricas...</div>
      </div>
    );
  }

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
                    const imovel = imoveis.find((i) => i.id === metrica.imovel_id);
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
                          <p>🚗 Visitas: {metrica.visitas_realizadas}</p>
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
