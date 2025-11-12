import { useMemo, useEffect, useState } from 'react';
import { Line } from 'react-chartjs-2';
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
        <h2 className="text-lg font-semibold mb-4">Imóveis Recentes</h2>
        {recentImoveis.length === 0 ? (
          <div className="text-center py-8 text-muted-foreground">
            <p className="text-4xl mb-2">🏠</p>
            <p>Nenhum imóvel cadastrado ainda</p>
          </div>
        ) : (
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {recentImoveis.map((imovel) => {
              const metricaAtual = metricas.find((m) => m.imovel_id === imovel.id && m.mes === currentMonth);
              return (
                <div key={imovel.id} className="border border-border rounded-lg p-4 card-hover">
                  <div className="flex items-start justify-between mb-2">
                    <span className="text-xs font-semibold text-muted-foreground bg-muted px-2 py-1 rounded">
                      {imovel.codigo}
                    </span>
                    <span className="text-xs text-muted-foreground">{imovel.tipo}</span>
                  </div>
                  <h3 className="font-semibold text-sm mb-1">{imovel.endereco}</h3>
                  <p className="text-xs text-muted-foreground mb-3">{imovel.cliente}</p>
                  {metricaAtual ? (
                    <div className="flex gap-3 text-xs">
                      <span>📧 {metricaAtual.leads}</span>
                      <span>👁️ {metricaAtual.visualizacoes.toLocaleString('pt-BR')}</span>
                    </div>
                  ) : (
                    <p className="text-xs text-muted-foreground italic">Sem métricas este mês</p>
                  )}
                </div>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
};
