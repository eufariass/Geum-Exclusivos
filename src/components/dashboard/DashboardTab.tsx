import { useMemo, useEffect, useState } from 'react';
import { Line } from 'react-chartjs-2';
import { Building2, TrendingUp, Eye, Calendar, Plus, ArrowUpRight, ArrowDownRight } from 'lucide-react';
import {
  Chart as ChartJS,
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  Title,
  Tooltip,
  Legend,
  Filler,
} from 'chart.js';
import { supabaseStorageService } from '@/lib/supabaseStorage';
import { getCurrentMonth, getPreviousMonth, getLast6Months } from '@/lib/dateUtils';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import type { Imovel, Metrica } from '@/types';

ChartJS.register(CategoryScale, LinearScale, PointElement, LineElement, Title, Tooltip, Legend, Filler);

export const DashboardTab = () => {
  const [imoveis, setImoveis] = useState<Imovel[]>([]);
  const [metricas, setMetricas] = useState<Metrica[]>([]);
  const [loading, setLoading] = useState(true);
  const currentMonth = getCurrentMonth();
  const previousMonth = getPreviousMonth(currentMonth);

  useEffect(() => {
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
      } finally {
        setLoading(false);
      }
    };
    loadData();
  }, []);

  const stats = useMemo(() => {
    const currentMetrics = metricas.filter((m) => m.mes === currentMonth);
    const previousMetrics = metricas.filter((m) => m.mes === previousMonth);

    const currentLeads = currentMetrics.reduce((sum, m) => sum + m.leads, 0);
    const previousLeads = previousMetrics.reduce((sum, m) => sum + m.leads, 0);

    const currentViews = currentMetrics.reduce((sum, m) => sum + m.visualizacoes, 0);
    const previousViews = previousMetrics.reduce((sum, m) => sum + m.visualizacoes, 0);

    const currentVisits = currentMetrics.reduce((sum, m) => sum + m.visitas_realizadas, 0);
    const previousVisits = previousMetrics.reduce((sum, m) => sum + m.visitas_realizadas, 0);

    const getTrend = (current: number, previous: number) => {
      if (previous === 0 && current > 0) return { value: 0, direction: 'new' as const };
      if (previous === 0) return { value: 0, direction: 'neutral' as const };
      const percent = Math.round(((current - previous) / previous) * 100);
      if (percent > 0) return { value: percent, direction: 'up' as const };
      if (percent < 0) return { value: Math.abs(percent), direction: 'down' as const };
      return { value: 0, direction: 'neutral' as const };
    };

    return {
      totalImoveis: imoveis.length,
      leads: { value: currentLeads, trend: getTrend(currentLeads, previousLeads) },
      views: { value: currentViews, trend: getTrend(currentViews, previousViews) },
      visits: { value: currentVisits, trend: getTrend(currentVisits, previousVisits) },
    };
  }, [imoveis, metricas, currentMonth, previousMonth]);

  const chartData = useMemo(() => {
    const last6Months = getLast6Months();
    const labels = last6Months.map((month) => {
      const [, m] = month.split('-');
      return new Date(2000, parseInt(m) - 1).toLocaleDateString('pt-BR', { month: 'short' });
    });

    const leadsData = last6Months.map((month) => {
      return metricas.filter((m) => m.mes === month).reduce((sum, m) => sum + m.leads, 0);
    });

    const visitsData = last6Months.map((month) => {
      return metricas.filter((m) => m.mes === month).reduce((sum, m) => sum + m.visitas_realizadas, 0);
    });

    return {
      labels,
      datasets: [
        {
          label: 'Leads',
          data: leadsData,
          borderColor: 'hsl(150, 100%, 50%)',
          backgroundColor: 'hsla(150, 100%, 50%, 0.1)',
          fill: true,
          tension: 0.4,
        },
        {
          label: 'Visitas',
          data: visitsData,
          borderColor: 'hsl(220, 100%, 50%)',
          backgroundColor: 'hsla(220, 100%, 50%, 0.1)',
          fill: true,
          tension: 0.4,
        },
      ],
    };
  }, [metricas]);

  const recentImoveis = useMemo(() => {
    return [...imoveis]
      .sort((a, b) => new Date(b.data_cadastro).getTime() - new Date(a.data_cadastro).getTime())
      .slice(0, 5);
  }, [imoveis]);

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="text-muted-foreground">Carregando...</div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-3xl font-bold tracking-tight">Dashboard</h1>
        <p className="text-muted-foreground mt-1">Visão geral das suas métricas e imóveis</p>
      </div>

      {/* Stats Cards */}
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        <Card className="p-6 hover:shadow-md transition-shadow">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-muted-foreground">Total de Imóveis</p>
              <p className="text-3xl font-bold mt-2">{stats.totalImoveis}</p>
            </div>
            <div className="h-12 w-12 rounded-full bg-primary/10 flex items-center justify-center">
              <Building2 className="h-6 w-6 text-primary" />
            </div>
          </div>
        </Card>

        <Card className="p-6 hover:shadow-md transition-shadow">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-muted-foreground">Leads do Mês</p>
              <p className="text-3xl font-bold mt-2">{stats.leads.value}</p>
              {stats.leads.trend.direction !== 'neutral' && (
                <div className={`flex items-center gap-1 mt-1 text-sm ${stats.leads.trend.direction === 'up' ? 'text-green-600' : 'text-red-600'}`}>
                  {stats.leads.trend.direction === 'up' ? (
                    <ArrowUpRight className="h-4 w-4" />
                  ) : (
                    <ArrowDownRight className="h-4 w-4" />
                  )}
                  <span>{stats.leads.trend.value}%</span>
                </div>
              )}
            </div>
            <div className="h-12 w-12 rounded-full bg-blue-500/10 flex items-center justify-center">
              <TrendingUp className="h-6 w-6 text-blue-600" />
            </div>
          </div>
        </Card>

        <Card className="p-6 hover:shadow-md transition-shadow">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-muted-foreground">Visualizações</p>
              <p className="text-3xl font-bold mt-2">{stats.views.value.toLocaleString('pt-BR')}</p>
              {stats.views.trend.direction !== 'neutral' && (
                <div className={`flex items-center gap-1 mt-1 text-sm ${stats.views.trend.direction === 'up' ? 'text-green-600' : 'text-red-600'}`}>
                  {stats.views.trend.direction === 'up' ? (
                    <ArrowUpRight className="h-4 w-4" />
                  ) : (
                    <ArrowDownRight className="h-4 w-4" />
                  )}
                  <span>{stats.views.trend.value}%</span>
                </div>
              )}
            </div>
            <div className="h-12 w-12 rounded-full bg-purple-500/10 flex items-center justify-center">
              <Eye className="h-6 w-6 text-purple-600" />
            </div>
          </div>
        </Card>

        <Card className="p-6 hover:shadow-md transition-shadow">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-muted-foreground">Visitas Realizadas</p>
              <p className="text-3xl font-bold mt-2">{stats.visits.value}</p>
              {stats.visits.trend.direction !== 'neutral' && (
                <div className={`flex items-center gap-1 mt-1 text-sm ${stats.visits.trend.direction === 'up' ? 'text-green-600' : 'text-red-600'}`}>
                  {stats.visits.trend.direction === 'up' ? (
                    <ArrowUpRight className="h-4 w-4" />
                  ) : (
                    <ArrowDownRight className="h-4 w-4" />
                  )}
                  <span>{stats.visits.trend.value}%</span>
                </div>
              )}
            </div>
            <div className="h-12 w-12 rounded-full bg-green-500/10 flex items-center justify-center">
              <Calendar className="h-6 w-6 text-green-600" />
            </div>
          </div>
        </Card>
      </div>

      {/* Chart */}
      <Card className="p-6">
        <div className="mb-6">
          <h2 className="text-xl font-semibold">Evolução - Últimos 6 Meses</h2>
          <p className="text-sm text-muted-foreground mt-1">Acompanhamento de leads e visitas</p>
        </div>
        <div className="h-[300px]">
          <Line
            data={chartData}
            options={{
              responsive: true,
              maintainAspectRatio: false,
              plugins: {
                legend: { 
                  position: 'top',
                  labels: {
                    usePointStyle: true,
                    padding: 15
                  }
                },
              },
              scales: {
                y: { 
                  beginAtZero: true,
                  grid: {
                    color: 'hsl(var(--border))'
                  }
                },
                x: {
                  grid: {
                    display: false
                  }
                }
              },
            }}
          />
        </div>
      </Card>

      {/* Recent Properties Table */}
      <Card className="p-6">
        <div className="flex items-center justify-between mb-6">
          <div>
            <h2 className="text-xl font-semibold">Imóveis Recentes</h2>
            <p className="text-sm text-muted-foreground mt-1">Últimos imóveis cadastrados</p>
          </div>
          <Button variant="outline" size="sm" className="gap-2">
            <Plus className="h-4 w-4" />
            Novo Imóvel
          </Button>
        </div>
        
        {recentImoveis.length === 0 ? (
          <div className="text-center py-12 text-muted-foreground">
            <Building2 className="h-12 w-12 mx-auto mb-3 opacity-50" />
            <p>Nenhum imóvel cadastrado</p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="border-b text-left">
                  <th className="pb-3 font-semibold text-sm text-muted-foreground">Código</th>
                  <th className="pb-3 font-semibold text-sm text-muted-foreground">Cliente</th>
                  <th className="pb-3 font-semibold text-sm text-muted-foreground text-right">Valor</th>
                  <th className="pb-3 font-semibold text-sm text-muted-foreground">Tipo</th>
                  <th className="pb-3 font-semibold text-sm text-muted-foreground">Status</th>
                </tr>
              </thead>
              <tbody>
                {recentImoveis.map((imovel) => (
                  <tr key={imovel.id} className="border-b last:border-0 hover:bg-muted/30 transition-colors">
                    <td className="py-4">
                      <span className="font-medium">{imovel.codigo}</span>
                    </td>
                    <td className="py-4 text-sm text-muted-foreground">{imovel.cliente}</td>
                    <td className="py-4 text-sm text-right font-medium">
                      {imovel.valor ? `R$ ${new Intl.NumberFormat('pt-BR', { minimumFractionDigits: 2 }).format(imovel.valor)}` : '-'}
                    </td>
                    <td className="py-4 text-sm text-muted-foreground">
                      {imovel.tipos_disponiveis?.join(', ') || 'Venda'}
                    </td>
                    <td className="py-4">
                      <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-blue-100 text-blue-800 dark:bg-blue-900/30 dark:text-blue-400">
                        Ativo
                      </span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </Card>
    </div>
  );
};
