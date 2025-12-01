import { useMemo, useEffect, useState } from 'react';
import { Line } from 'react-chartjs-2';
import { Building2, Eye, Calendar } from 'lucide-react';
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
    const currentLeads = currentMetrics.reduce((sum, m) => sum + m.leads, 0);
    const currentViews = currentMetrics.reduce((sum, m) => sum + m.visualizacoes, 0);
    const currentVisits = currentMetrics.reduce((sum, m) => sum + m.visitas_realizadas, 0);

    return {
      totalImoveis: imoveis.length,
      leads: currentLeads,
      views: currentViews,
      visits: currentVisits,
    };
  }, [imoveis, metricas, currentMonth]);

  const chartData = useMemo(() => {
    const last6Months = getLast6Months();
    const labels = last6Months.map((month) => {
      const [, m] = month.split('-');
      return new Date(2000, parseInt(m) - 1).toLocaleDateString('pt-BR', { month: 'short' }).replace('.', '').toUpperCase();
    });

    const leadsData = last6Months.map((month) => {
      return metricas.filter((m) => m.mes === month).reduce((sum, m) => sum + m.leads, 0);
    });

    const visitsData = last6Months.map((month) => {
      return metricas.filter((m) => m.mes === month).reduce((sum, m) => sum + m.visitas_realizadas, 0);
    });

    const viewsData = last6Months.map((month) => {
      return metricas.filter((m) => m.mes === month).reduce((sum, m) => sum + m.visualizacoes, 0);
    });

    // Create gradient for the area chart
    const createGradient = (ctx: CanvasRenderingContext2D, color: string) => {
      const gradient = ctx.createLinearGradient(0, 0, 0, 320);
      gradient.addColorStop(0, color);
      gradient.addColorStop(1, 'rgba(139, 92, 246, 0)');
      return gradient;
    };

    return {
      labels,
      datasets: [
        {
          label: 'Leads',
          data: leadsData,
          borderColor: 'rgb(139, 92, 246)',
          backgroundColor: (context: any) => {
            const ctx = context.chart.ctx;
            return createGradient(ctx, 'rgba(139, 92, 246, 0.4)');
          },
          fill: true,
          tension: 0.4,
          borderWidth: 2.5,
          pointRadius: 4,
          pointHoverRadius: 6,
          pointBackgroundColor: '#fff',
          pointBorderColor: 'rgb(139, 92, 246)',
          pointBorderWidth: 2,
        },
        {
          label: 'Visualizações',
          data: viewsData,
          borderColor: 'rgb(34, 197, 94)',
          backgroundColor: (context: any) => {
            const ctx = context.chart.ctx;
            const gradient = ctx.createLinearGradient(0, 0, 0, 320);
            gradient.addColorStop(0, 'rgba(34, 197, 94, 0.4)');
            gradient.addColorStop(1, 'rgba(34, 197, 94, 0)');
            return gradient;
          },
          fill: true,
          tension: 0.4,
          borderWidth: 2.5,
          pointRadius: 4,
          pointHoverRadius: 6,
          pointBackgroundColor: '#fff',
          pointBorderColor: 'rgb(34, 197, 94)',
          pointBorderWidth: 2,
        },
        {
          label: 'Visitas',
          data: visitsData,
          borderColor: 'rgb(59, 130, 246)',
          backgroundColor: (context: any) => {
            const ctx = context.chart.ctx;
            const gradient = ctx.createLinearGradient(0, 0, 0, 320);
            gradient.addColorStop(0, 'rgba(59, 130, 246, 0.4)');
            gradient.addColorStop(1, 'rgba(59, 130, 246, 0)');
            return gradient;
          },
          fill: true,
          tension: 0.4,
          borderWidth: 2.5,
          pointRadius: 4,
          pointHoverRadius: 6,
          pointBackgroundColor: '#fff',
          pointBorderColor: 'rgb(59, 130, 246)',
          pointBorderWidth: 2,
        },
      ],
    };
  }, [metricas]);

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="text-muted-foreground">Carregando...</div>
      </div>
    );
  }

  return (
    <div className="space-y-6 p-6">
      {/* Activity Cards Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        <KPICard
          title="Total de Leads"
          value={stats.leads}
        />
        <KPICard
          title="Visualizações"
          value={stats.views.toLocaleString('pt-BR')}
        />
        <KPICard
          title="Visitas Realizadas"
          value={stats.visits}
        />
      </div>

      {/* General Data Section */}
      <div>
        <h2 className="text-lg font-semibold mb-4">Dados gerais</h2>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <Card className="p-6">
            <div className="flex items-start justify-between">
              <div>
                <p className="text-sm text-muted-foreground mb-1">Total de Imóveis</p>
                <p className="text-2xl font-bold">{stats.totalImoveis}</p>
              </div>
              <Building2 className="h-8 w-8 text-muted-foreground" />
            </div>
          </Card>

          <Card className="p-6">
            <div className="flex items-start justify-between">
              <div>
                <p className="text-sm text-muted-foreground mb-1">Visualizações</p>
                <p className="text-2xl font-bold">{stats.views.toLocaleString('pt-BR')}</p>
              </div>
              <Eye className="h-8 w-8 text-muted-foreground" />
            </div>
          </Card>

          <Card className="p-6">
            <div className="flex items-start justify-between">
              <div>
                <p className="text-sm text-muted-foreground mb-1">Visitas Realizadas</p>
                <p className="text-2xl font-bold">{stats.visits}</p>
              </div>
              <Calendar className="h-8 w-8 text-muted-foreground" />
            </div>
          </Card>
        </div>
      </div>

      {/* Chart Section */}
      <Card className="p-6">
        <div className="flex items-center justify-between mb-6">
          <div>
            <h2 className="text-lg font-semibold">Evolução - Últimos 6 Meses</h2>
            <p className="text-sm text-muted-foreground mt-1">Acompanhamento de leads, visualizações e visitas</p>
          </div>
        </div>
        <div className="h-[320px]">
          <Line
            data={chartData}
            options={{
              responsive: true,
              maintainAspectRatio: false,
              interaction: {
                mode: 'index',
                intersect: false,
              },
              plugins: {
                legend: { 
                  display: true,
                  position: 'top',
                  align: 'end',
                  labels: {
                    usePointStyle: true,
                    padding: 20,
                    font: {
                      size: 12,
                      weight: 500
                    },
                    boxWidth: 8,
                    boxHeight: 8,
                  }
                },
                tooltip: {
                  backgroundColor: '#fff',
                  titleColor: '#000',
                  bodyColor: '#000',
                  borderColor: 'rgb(229, 231, 235)',
                  borderWidth: 1,
                  padding: 12,
                  displayColors: true,
                  boxPadding: 6,
                  cornerRadius: 8,
                }
              },
              scales: {
                y: { 
                  beginAtZero: true,
                  grid: {
                    display: true,
                    color: 'rgba(0, 0, 0, 0.05)',
                    drawTicks: false,
                  },
                  border: {
                    display: false
                  },
                  ticks: {
                    padding: 12,
                    font: {
                      size: 11,
                      family: 'Inter'
                    },
                    color: 'rgba(0, 0, 0, 0.6)'
                  }
                },
                x: {
                  grid: {
                    display: false
                  },
                  border: {
                    display: false
                  },
                  ticks: {
                    padding: 12,
                    font: {
                      size: 11,
                      family: 'Inter'
                    },
                    color: 'rgba(0, 0, 0, 0.6)'
                  }
                }
              },
            }}
          />
        </div>
      </Card>
    </div>
  );
};
