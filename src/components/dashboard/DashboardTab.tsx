import { useMemo, useEffect, useState } from 'react';
import { Line } from 'react-chartjs-2';
import { Building2, Users, FileText, BarChart3 } from 'lucide-react';
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
import { getCurrentMonth, getPreviousMonth, getLast6Months, getMonthName } from '@/lib/dateUtils';
import { KPICard } from './KPICard';
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
      .slice(0, 3);
  }, [imoveis]);

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="text-muted-foreground">Carregando dashboard...</div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Welcome Section */}
      <div className="bg-gradient-to-r from-primary to-primary/80 rounded-xl p-6 text-primary-foreground">
        <h1 className="text-2xl font-bold mb-2">Bem-vindo de volta!</h1>
        <p className="text-primary-foreground/90 text-sm">
          Hoje é o dia de transformar oportunidades! Use nossa Inteligência de Marketing e alcance resultados extraordinários.
        </p>
      </div>

      {/* Quick Actions */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <button className="bg-card hover:bg-card/80 border border-border rounded-xl p-4 text-left transition-all hover:shadow-md">
          <div className="flex flex-col items-center gap-2">
            <div className="w-12 h-12 rounded-full bg-primary/10 flex items-center justify-center">
              <Building2 className="h-6 w-6 text-primary" />
            </div>
            <span className="text-sm font-medium">Imóveis</span>
          </div>
        </button>
        <button className="bg-card hover:bg-card/80 border border-border rounded-xl p-4 text-left transition-all hover:shadow-md">
          <div className="flex flex-col items-center gap-2">
            <div className="w-12 h-12 rounded-full bg-blue-500/10 flex items-center justify-center">
              <Users className="h-6 w-6 text-blue-500" />
            </div>
            <span className="text-sm font-medium">Ver Leads</span>
          </div>
        </button>
        <button className="bg-card hover:bg-card/80 border border-border rounded-xl p-4 text-left transition-all hover:shadow-md">
          <div className="flex flex-col items-center gap-2">
            <div className="w-12 h-12 rounded-full bg-purple-500/10 flex items-center justify-center">
              <FileText className="h-6 w-6 text-purple-500" />
            </div>
            <span className="text-sm font-medium">Propostas</span>
          </div>
        </button>
        <button className="bg-card hover:bg-card/80 border border-border rounded-xl p-4 text-left transition-all hover:shadow-md">
          <div className="flex flex-col items-center gap-2">
            <div className="w-12 h-12 rounded-full bg-green-500/10 flex items-center justify-center">
              <BarChart3 className="h-6 w-6 text-green-500" />
            </div>
            <span className="text-sm font-medium">Times</span>
          </div>
        </button>
      </div>

      {/* KPI Cards */}
      <div>
        <h2 className="text-lg font-semibold mb-4">Métricas Principais</h2>
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          <KPICard title="Total de Imóveis" value={stats.totalImoveis} icon="🏘️" />
          <KPICard title="Leads do Mês" value={stats.leads.value} icon="📧" trend={stats.leads.trend} />
          <KPICard
            title="Visualizações"
            value={stats.views.value.toLocaleString('pt-BR')}
            icon="👁️"
            trend={stats.views.trend}
          />
          <KPICard title="Visitas Realizadas" value={stats.visits.value} icon="🚗" trend={stats.visits.trend} />
        </div>
      </div>

      <div className="bg-card rounded-xl p-6 shadow-sm border border-border">
        <h2 className="text-lg font-semibold mb-4">Evolução - Últimos 6 Meses</h2>
        <div className="h-[300px]">
          <Line
            data={chartData}
            options={{
              responsive: true,
              maintainAspectRatio: false,
              plugins: {
                legend: { position: 'top' },
              },
              scales: {
                y: { beginAtZero: true },
              },
            }}
          />
        </div>
      </div>

      <div className="bg-card rounded-xl p-6 shadow-sm border border-border">
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-lg font-semibold">Lista de Imóveis</h2>
          <a href="#" className="text-sm text-primary hover:underline">Ver todos os imóveis</a>
        </div>
        <div className="text-xs text-muted-foreground mb-4">
          Atualizado em: {new Date().toLocaleDateString('pt-BR', { day: '2-digit', month: '2-digit', year: 'numeric', hour: '2-digit', minute: '2-digit' })}
        </div>
        {recentImoveis.length === 0 ? (
          <div className="text-center py-8 text-muted-foreground">
            <p className="text-4xl mb-2">🏠</p>
            <p>Nenhum imóvel cadastrado ainda</p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="border-b text-left text-xs text-muted-foreground">
                  <th className="pb-3 font-medium">Imóvel</th>
                  <th className="pb-3 font-medium">Angariador</th>
                  <th className="pb-3 font-medium text-right">Valor (R$)</th>
                  <th className="pb-3 font-medium">Status</th>
                  <th className="pb-3 font-medium">Tipo de negócio</th>
                </tr>
              </thead>
              <tbody>
                {recentImoveis.map((imovel) => (
                  <tr key={imovel.id} className="border-b hover:bg-muted/30 transition-colors">
                    <td className="py-3">
                      <div className="flex items-center gap-2">
                        <span className="text-sm font-medium text-primary">{imovel.codigo}</span>
                      </div>
                    </td>
                    <td className="py-3 text-sm">{imovel.cliente}</td>
                    <td className="py-3 text-sm text-right">
                      {imovel.valor ? new Intl.NumberFormat('pt-BR', { minimumFractionDigits: 2 }).format(imovel.valor) : '-'}
                    </td>
                    <td className="py-3">
                      <span className="inline-flex items-center px-2 py-1 rounded-full text-xs bg-blue-100 text-blue-800">
                        Em aprovação
                      </span>
                    </td>
                    <td className="py-3 text-sm">
                      {imovel.tipos_disponiveis?.join(', ') || 'Venda'}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
            <div className="mt-4 text-xs text-muted-foreground text-right">
              Exibindo {recentImoveis.length} de {imoveis.length} imóveis ativos
            </div>
          </div>
        )}
      </div>
    </div>
  );
};
