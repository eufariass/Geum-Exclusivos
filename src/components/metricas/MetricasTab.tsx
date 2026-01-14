import { useState, useMemo, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Eye, Users, Calendar, BarChart3, Edit2, Trash2, Save, Undo2 } from 'lucide-react';
import type { Imovel, Metrica } from '@/types';
import { supabaseStorageService } from '@/lib/supabaseStorage';
import { getCurrentMonth, getMonthName } from '@/lib/dateUtils';
import { useAuth } from '@/contexts/AuthContext';
import { AIMetricsImport } from './AIMetricsImport';

interface MetricasTabProps {
  onToast: (message: string, type: 'success' | 'error') => void;
}

const MONTHS = [
  { value: '01', label: 'Janeiro' },
  { value: '02', label: 'Fevereiro' },
  { value: '03', label: 'Março' },
  { value: '04', label: 'Abril' },
  { value: '05', label: 'Maio' },
  { value: '06', label: 'Junho' },
  { value: '07', label: 'Julho' },
  { value: '08', label: 'Agosto' },
  { value: '09', label: 'Setembro' },
  { value: '10', label: 'Outubro' },
  { value: '11', label: 'Novembro' },
  { value: '12', label: 'Dezembro' },
];

const YEARS = Array.from({ length: 5 }, (_, i) => new Date().getFullYear() - i);

export const MetricasTab = ({ onToast }: MetricasTabProps) => {
  const { user } = useAuth();
  const [imoveis, setImoveis] = useState<Imovel[]>([]);
  const [metricas, setMetricas] = useState<Metrica[]>([]);
  const [loading, setLoading] = useState(true);
  const [editingId, setEditingId] = useState<string | null>(null);

  const [selectedMonth, setSelectedMonth] = useState(getCurrentMonth().split('-')[1]);
  const [selectedYear, setSelectedYear] = useState(getCurrentMonth().split('-')[0]);

  const [formData, setFormData] = useState({
    imovelId: '',
    leads: '',
    leads_portais: '',
    leads_meta: '',
    leads_google: '',
    visualizacoes: '',
    visualizacoes_portais: '',
    visualizacoes_meta: '',
    visualizacoes_google: '',
    visitasRealizadas: '',
  });

  // Combine month/year into YYYY-MM
  const currentMonthValue = `${selectedYear}-${selectedMonth}`;

  // Auto-calculate totals when granular data changes
  useEffect(() => {
    const lPortais = parseInt(formData.leads_portais) || 0;
    const lMeta = parseInt(formData.leads_meta) || 0;
    const lGoogle = parseInt(formData.leads_google) || 0;
    const totalLeads = lPortais + lMeta + lGoogle;

    const vPortais = parseInt(formData.visualizacoes_portais) || 0;
    const vMeta = parseInt(formData.visualizacoes_meta) || 0;
    const vGoogle = parseInt(formData.visualizacoes_google) || 0;
    const totalViews = vPortais + vMeta + vGoogle;

    if (lPortais > 0 || lMeta > 0 || lGoogle > 0) {
      setFormData(prev => ({ ...prev, leads: totalLeads.toString() }));
    }

    if (vPortais > 0 || vMeta > 0 || vGoogle > 0) {
      setFormData(prev => ({ ...prev, visualizacoes: totalViews.toString() }));
    }
  }, [formData.leads_portais, formData.leads_meta, formData.leads_google,
  formData.visualizacoes_portais, formData.visualizacoes_meta, formData.visualizacoes_google]);

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

  const handleEdit = (metrica: Metrica) => {
    setEditingId(metrica.id);
    const [year, month] = metrica.mes.split('-');
    setSelectedYear(year);
    setSelectedMonth(month);

    setFormData({
      imovelId: metrica.imovel_id,
      leads: metrica.leads.toString(),
      leads_portais: metrica.leads_portais?.toString() || '',
      leads_meta: metrica.leads_meta?.toString() || '',
      leads_google: metrica.leads_google?.toString() || '',
      visualizacoes: metrica.visualizacoes.toString(),
      visualizacoes_portais: metrica.visualizacoes_portais?.toString() || '',
      visualizacoes_meta: metrica.visualizacoes_meta?.toString() || '',
      visualizacoes_google: metrica.visualizacoes_google?.toString() || '',
      visitasRealizadas: metrica.visitas_realizadas.toString(),
    });

    // Scroll to top of form
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const cancelEdit = () => {
    setEditingId(null);
    setFormData({
      imovelId: '',
      leads: '',
      leads_portais: '',
      leads_meta: '',
      leads_google: '',
      visualizacoes: '',
      visualizacoes_portais: '',
      visualizacoes_meta: '',
      visualizacoes_google: '',
      visitasRealizadas: '',
    });
    setSelectedMonth(getCurrentMonth().split('-')[1]);
    setSelectedYear(getCurrentMonth().split('-')[0]);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!formData.imovelId) {
      onToast('Selecione um imóvel', 'error');
      return;
    }

    if (!user) {
      onToast('Usuário não autenticado', 'error');
      return;
    }

    try {
      const leads = parseInt(formData.leads) || 0;
      const leads_portais = parseInt(formData.leads_portais) || 0;
      const leads_meta = parseInt(formData.leads_meta) || 0;
      const leads_google = parseInt(formData.leads_google) || 0;

      const visualizacoes = parseInt(formData.visualizacoes) || 0;
      const visualizacoes_portais = parseInt(formData.visualizacoes_portais) || 0;
      const visualizacoes_meta = parseInt(formData.visualizacoes_meta) || 0;
      const visualizacoes_google = parseInt(formData.visualizacoes_google) || 0;

      const visitas_realizadas = parseInt(formData.visitasRealizadas) || 0;

      if (editingId) {
        await supabaseStorageService.updateMetrica(formData.imovelId, currentMonthValue, {
          leads,
          leads_portais,
          leads_meta,
          leads_google,
          visualizacoes,
          visualizacoes_portais,
          visualizacoes_meta,
          visualizacoes_google,
          visitas_realizadas,
          data_registro: new Date().toISOString(),
          updated_by: user.id,
        });
        onToast('Métrica atualizada com sucesso!', 'success');
        setEditingId(null);
      } else {
        const existing = await supabaseStorageService.getMetricaByImovelMes(formData.imovelId, currentMonthValue);

        if (existing) {
          if (window.confirm('Já existe uma métrica para este imóvel neste mês. Deseja substituir?')) {
            await supabaseStorageService.updateMetrica(formData.imovelId, currentMonthValue, {
              leads,
              leads_portais,
              leads_meta,
              leads_google,
              visualizacoes,
              visualizacoes_portais,
              visualizacoes_meta,
              visualizacoes_google,
              visitas_realizadas,
              data_registro: new Date().toISOString(),
              updated_by: user.id,
            });
            onToast('Métrica atualizada com sucesso!', 'success');
          } else {
            return;
          }
        } else {
          await supabaseStorageService.addMetrica({
            imovel_id: formData.imovelId,
            mes: currentMonthValue,
            leads,
            leads_portais,
            leads_meta,
            leads_google,
            visualizacoes,
            visualizacoes_portais,
            visualizacoes_meta,
            visualizacoes_google,
            visitas_realizadas,
            data_registro: new Date().toISOString(),
            created_by: user.id,
            updated_by: user.id,
          });
          onToast('Métrica adicionada com sucesso!', 'success');
        }
      }

      await loadData();
      if (!editingId) {
        setFormData({
          imovelId: '',
          leads: '',
          leads_portais: '',
          leads_meta: '',
          leads_google: '',
          visualizacoes: '',
          visualizacoes_portais: '',
          visualizacoes_meta: '',
          visualizacoes_google: '',
          visitasRealizadas: '',
        });
      }
    } catch (error) {
      console.error('Erro detalhado ao salvar métrica:', error);
      const errorMessage = error instanceof Error ? error.message : 'Erro desconhecido';
      onToast(`Erro ao salvar métrica: ${errorMessage}`, 'error');
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
      <Tabs defaultValue="manual" className="w-full">
        <TabsList className="grid w-full max-w-md grid-cols-2">
          <TabsTrigger value="manual">📝 Manual</TabsTrigger>
          <TabsTrigger value="ai">📸 Importar por IA</TabsTrigger>
        </TabsList>

        <TabsContent value="manual" className="mt-6">
          <div className="space-y-6">
            <div className="flex items-center justify-between">
              <h2 className="text-xl font-bold">
                {editingId ? 'Editar Métrica' : 'Adicionar Métricas'}
              </h2>
              {editingId && (
                <Button variant="ghost" onClick={cancelEdit} className="text-muted-foreground mr-2">
                  <Undo2 className="w-4 h-4 mr-2" />
                  Cancelar Edição
                </Button>
              )}
            </div>

            <form onSubmit={handleSubmit} className="space-y-6">
              {/* Context Section */}
              <Card className="border-l-4 border-l-black">
                <CardHeader className="pb-4">
                  <CardTitle className="text-lg flex items-center gap-2">
                    <BarChart3 className="w-5 h-5 text-zinc-700" />
                    Informações do Registro
                  </CardTitle>
                </CardHeader>
                <CardContent className="grid gap-6 md:grid-cols-2">
                  <div className="space-y-2">
                    <Label htmlFor="imovel">Imóvel *</Label>
                    <Select value={formData.imovelId} onValueChange={(value) => setFormData((prev) => ({ ...prev, imovelId: value }))} disabled={!!editingId}>
                      <SelectTrigger id="imovel" className="h-11">
                        <SelectValue placeholder="Selecione o imóvel..." />
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

                  <div className="space-y-2">
                    <Label>Mês de Referência *</Label>
                    <div className="flex gap-2">
                      <Select value={selectedMonth} onValueChange={setSelectedMonth} disabled={!!editingId}>
                        <SelectTrigger className="h-11 flex-1">
                          <SelectValue placeholder="Mês" />
                        </SelectTrigger>
                        <SelectContent>
                          {MONTHS.map((month) => (
                            <SelectItem key={month.value} value={month.value}>
                              {month.label}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>

                      <Select value={selectedYear} onValueChange={setSelectedYear} disabled={!!editingId}>
                        <SelectTrigger className="h-11 w-32">
                          <SelectValue placeholder="Ano" />
                        </SelectTrigger>
                        <SelectContent>
                          {YEARS.map((year) => (
                            <SelectItem key={year} value={year.toString()}>
                              {year}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>
                  </div>
                </CardContent>
              </Card>

              {/* Funnels Section */}
              <div className="grid gap-6 md:grid-cols-2">
                {/* Views Funnel */}
                <Card className="overflow-hidden border border-zinc-200 shadow-sm">
                  <CardHeader className="bg-zinc-50 pb-4 border-b border-zinc-100">
                    <CardTitle className="text-lg flex items-center gap-2 text-zinc-800">
                      <Eye className="w-5 h-5 text-zinc-600" />
                      Funil de Visualizações
                    </CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-6 pt-6">
                    <div className="space-y-4">
                      <div className="flex items-center gap-4">
                        <Label htmlFor="visualizacoes_portais" className="w-32 text-sm font-normal text-zinc-500">Portais Imobiliários</Label>
                        <Input
                          id="visualizacoes_portais"
                          type="number"
                          min="0"
                          value={formData.visualizacoes_portais}
                          onChange={(e) => setFormData((prev) => ({ ...prev, visualizacoes_portais: e.target.value }))}
                          placeholder="0"
                          className="font-mono"
                        />
                      </div>
                      <div className="flex items-center gap-4">
                        <Label htmlFor="visualizacoes_meta" className="w-32 text-sm font-normal text-zinc-500">Meta Ads</Label>
                        <Input
                          id="visualizacoes_meta"
                          type="number"
                          min="0"
                          value={formData.visualizacoes_meta}
                          onChange={(e) => setFormData((prev) => ({ ...prev, visualizacoes_meta: e.target.value }))}
                          placeholder="0"
                          className="font-mono"
                        />
                      </div>
                      <div className="flex items-center gap-4">
                        <Label htmlFor="visualizacoes_google" className="w-32 text-sm font-normal text-zinc-500">Google</Label>
                        <Input
                          id="visualizacoes_google"
                          type="number"
                          min="0"
                          value={formData.visualizacoes_google}
                          onChange={(e) => setFormData((prev) => ({ ...prev, visualizacoes_google: e.target.value }))}
                          placeholder="0"
                          className="font-mono"
                        />
                      </div>
                    </div>

                    <div className="pt-4 border-t flex items-center justify-between bg-zinc-50/50 -mx-6 px-6 pb-2">
                      <span className="font-semibold text-xs uppercase tracking-widest text-zinc-500">Total Visualizações</span>
                      <span className="text-2xl font-light text-black">
                        {parseInt(formData.visualizacoes || '0').toLocaleString('pt-BR')}
                      </span>
                    </div>
                  </CardContent>
                </Card>

                {/* Leads Funnel */}
                <Card className="overflow-hidden border border-zinc-200 shadow-sm">
                  <CardHeader className="bg-zinc-50 pb-4 border-b border-zinc-100">
                    <CardTitle className="text-lg flex items-center gap-2 text-zinc-800">
                      <Users className="w-5 h-5 text-zinc-600" />
                      Funil de Leads
                    </CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-6 pt-6">
                    <div className="space-y-4">
                      <div className="flex items-center gap-4">
                        <Label htmlFor="leads_portais" className="w-32 text-sm font-normal text-zinc-500">Portais Imobiliários</Label>
                        <Input
                          id="leads_portais"
                          type="number"
                          min="0"
                          value={formData.leads_portais}
                          onChange={(e) => setFormData((prev) => ({ ...prev, leads_portais: e.target.value }))}
                          placeholder="0"
                          className="font-mono"
                        />
                      </div>
                      <div className="flex items-center gap-4">
                        <Label htmlFor="leads_meta" className="w-32 text-sm font-normal text-zinc-500">Meta Ads</Label>
                        <Input
                          id="leads_meta"
                          type="number"
                          min="0"
                          value={formData.leads_meta}
                          onChange={(e) => setFormData((prev) => ({ ...prev, leads_meta: e.target.value }))}
                          placeholder="0"
                          className="font-mono"
                        />
                      </div>
                      <div className="flex items-center gap-4">
                        <Label htmlFor="leads_google" className="w-32 text-sm font-normal text-zinc-500">Google</Label>
                        <Input
                          id="leads_google"
                          type="number"
                          min="0"
                          value={formData.leads_google}
                          onChange={(e) => setFormData((prev) => ({ ...prev, leads_google: e.target.value }))}
                          placeholder="0"
                          className="font-mono"
                        />
                      </div>
                    </div>

                    <div className="pt-4 border-t flex items-center justify-between bg-zinc-50/50 -mx-6 px-6 pb-2">
                      <span className="font-semibold text-xs uppercase tracking-widest text-zinc-500">Total Leads</span>
                      <span className="text-2xl font-light text-black">
                        {parseInt(formData.leads || '0').toLocaleString('pt-BR')}
                      </span>
                    </div>
                  </CardContent>
                </Card>
              </div>

              {/* Visits Section */}
              <Card>
                <CardHeader>
                  <CardTitle className="text-lg flex items-center gap-2">
                    <Calendar className="w-5 h-5 text-zinc-800" />
                    Visitas e Fechamento
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="flex items-center gap-4 max-w-sm">
                    <Label htmlFor="visitas" className="w-32 text-sm font-normal text-zinc-500">Visitas Realizadas</Label>
                    <Input
                      id="visitas"
                      type="number"
                      min="0"
                      value={formData.visitasRealizadas}
                      onChange={(e) => setFormData((prev) => ({ ...prev, visitasRealizadas: e.target.value }))}
                      placeholder="0"
                      className="font-mono h-12 text-lg"
                    />
                  </div>
                </CardContent>
              </Card>

              <div className="flex justify-end pt-4">
                <Button type="submit" size="lg" className="w-full md:w-48 h-12 text-base font-semibold shadow-lg hover:shadow-xl transition-all bg-black hover:bg-zinc-800 text-white">
                  {editingId ? (
                    <>
                      <Save className="w-4 h-4 mr-2" />
                      Atualizar
                    </>
                  ) : (
                    <>
                      <Save className="w-4 h-4 mr-2" />
                      Salvar Métricas
                    </>
                  )}
                </Button>
              </div>
            </form>
          </div>
        </TabsContent>

        <TabsContent value="ai" className="mt-6">
          <AIMetricsImport
            imoveis={imoveis}
            onSuccess={loadData}
            onToast={onToast}
          />
        </TabsContent>
      </Tabs>

      <div>
        <h2 className="text-xl font-bold mb-4">Histórico de Métricas</h2>
        {metricasByMonth.length === 0 ? (
          <div className="bg-card rounded-xl p-12 text-center shadow-sm border border-border">
            <BarChart3 className="w-16 h-16 text-muted-foreground mx-auto mb-4" />
            <h3 className="text-xl font-semibold mb-2">Nenhuma métrica registrada</h3>
            <p className="text-muted-foreground">Adicione métricas usando o formulário acima</p>
          </div>
        ) : (
          <div className="space-y-6">
            {metricasByMonth.map(({ mes, items }) => (
              <div key={mes} className="bg-card rounded-xl p-6 shadow-sm border border-border">
                <h3 className="text-lg font-semibold mb-4 capitalize flex items-center gap-2">
                  <Calendar className="w-4 h-4" />
                  {getMonthName(mes)}
                </h3>
                <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
                  {items.map((metrica) => {
                    const imovel = imoveis.find((i) => i.id === metrica.imovel_id);
                    return (
                      <div key={metrica.id} className="border border-border rounded-lg p-4 card-hover hover:border-black transition-colors group">
                        <div className="flex items-start justify-between mb-3">
                          <span className="text-xs font-semibold text-zinc-600 bg-zinc-100 px-2 py-1 rounded">
                            {imovel?.codigo || 'N/A'}
                          </span>
                          <div className="flex items-center gap-1 opacity-100 sm:opacity-0 group-hover:opacity-100 transition-opacity">
                            <button
                              onClick={() => handleEdit(metrica)}
                              className="p-1 hover:bg-zinc-100 rounded text-zinc-600"
                              title="Editar"
                            >
                              <Edit2 className="w-4 h-4" />
                            </button>
                            <button
                              onClick={() => handleDelete(metrica.id)}
                              className="p-1 hover:bg-red-50 rounded text-red-500"
                              title="Deletar"
                            >
                              <Trash2 className="w-4 h-4" />
                            </button>
                          </div>
                        </div>
                        <p className="text-sm font-medium mb-3 truncate" title={imovel?.endereco}>{imovel?.endereco || 'Imóvel não encontrado'}</p>
                        <div className="space-y-2 text-sm text-zinc-600">
                          <div className="flex items-center gap-2">
                            <Users className="w-4 h-4 opacity-50" />
                            <span>Leads: <span className="font-semibold text-black">{metrica.leads}</span></span>
                          </div>
                          <div className="flex items-center gap-2">
                            <Eye className="w-4 h-4 opacity-50" />
                            <span>Views: <span className="font-semibold text-black">{metrica.visualizacoes.toLocaleString('pt-BR')}</span></span>
                          </div>
                          <div className="flex items-center gap-2">
                            <Calendar className="w-4 h-4 opacity-50" />
                            <span>Visitas: <span className="font-semibold text-black">{metrica.visitas_realizadas}</span></span>
                          </div>
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
