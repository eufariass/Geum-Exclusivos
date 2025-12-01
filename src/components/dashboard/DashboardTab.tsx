import { useMemo, useEffect, useState } from 'react';
import { Line } from 'react-chartjs-2';
import { Building2, TrendingUp, Eye, Calendar, Sparkles } from 'lucide-react';
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
import { Badge } from '@/components/ui/badge';
import { KPICard } from './KPICard';
import { Progress } from '@/components/ui/progress';
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

    return {
      labels,
      datasets: [
        {
          label: 'Leads',
          data: leadsData,
          borderColor: 'hsl(var(--primary))',
          backgroundColor: 'hsla(var(--primary), 0.08)',
          fill: true,
          tension: 0.4,
          borderWidth: 2.5,
          pointRadius: 4,
          pointHoverRadius: 6,
          pointBackgroundColor: 'hsl(var(--primary))',
          pointBorderColor: '#fff',
          pointBorderWidth: 2,
        },
        {
          label: 'Visitas',
          data: visitsData,
          borderColor: 'hsl(var(--muted-foreground))',
          backgroundColor: 'hsla(var(--muted-foreground), 0.08)',
          fill: true,
          tension: 0.4,
          borderWidth: 2.5,
          pointRadius: 4,
          pointHoverRadius: 6,
          pointBackgroundColor: 'hsl(var(--muted-foreground))',
          pointBorderColor: '#fff',
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
          title="Taxa de conversão"
          value="0,00%"
          badge="0/700"
        />
        <KPICard
          title="Novos clientes"
          value={stats.leads}
        />
        <KPICard
          title="Ticket médio"
          value="R$ 0,00"
        />
      </div>

      {/* Highlight Card */}
      <Card className="relative overflow-hidden bg-gradient-to-br from-primary via-primary to-primary/80 text-primary-foreground p-8 border-0">
        <Badge className="absolute top-4 right-4 bg-success text-success-foreground">
          NOVIDADE
        </Badge>
        <div className="flex items-start gap-4">
          <Sparkles className="h-8 w-8 flex-shrink-0" />
          <div>
            <h3 className="text-xl font-bold mb-2">Descubra o Novo Dashboard</h3>
            <p className="text-primary-foreground/90 text-sm mb-4">
              Explore as novas funcionalidades e visualizações de dados que preparamos para você.
            </p>
            <button className="bg-background text-foreground px-4 py-2 rounded-lg text-sm font-medium hover:bg-background/90 transition-colors">
              Saiba mais
            </button>
          </div>
        </div>
      </Card>

      {/* General Data Section */}
      <div>
        <h2 className="text-lg font-semibold mb-4">Dados gerais</h2>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <Card className="p-6">
            <div className="flex items-start justify-between mb-4">
              <div>
                <p className="text-sm text-muted-foreground mb-1">Total de Imóveis</p>
                <p className="text-2xl font-bold">{stats.totalImoveis}</p>
              </div>
              <Building2 className="h-8 w-8 text-primary" />
            </div>
            <Progress value={75} className="h-2" />
            <p className="text-xs text-muted-foreground mt-2">75% da meta mensal</p>
          </Card>

          <Card className="p-6">
            <div className="flex items-start justify-between mb-4">
              <div>
                <p className="text-sm text-muted-foreground mb-1">Visualizações</p>
                <p className="text-2xl font-bold">{stats.views.toLocaleString('pt-BR')}</p>
              </div>
              <Eye className="h-8 w-8 text-primary" />
            </div>
            <Progress value={60} className="h-2" />
            <p className="text-xs text-muted-foreground mt-2">60% da meta mensal</p>
          </Card>

          <Card className="p-6">
            <div className="flex items-start justify-between mb-4">
              <div>
                <p className="text-sm text-muted-foreground mb-1">Visitas Realizadas</p>
                <p className="text-2xl font-bold">{stats.visits}</p>
              </div>
              <Calendar className="h-8 w-8 text-primary" />
            </div>
            <Progress value={45} className="h-2" />
            <p className="text-xs text-muted-foreground mt-2">45% da meta mensal</p>
          </Card>
        </div>
      </div>

      {/* Chart Section */}
      <Card className="p-6">
        <div className="flex items-center justify-between mb-6">
          <div>
            <h2 className="text-lg font-semibold">Evolução - Últimos 6 Meses</h2>
            <p className="text-sm text-muted-foreground mt-1">Acompanhamento de leads e visitas</p>
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
                  backgroundColor: 'hsl(var(--popover))',
                  titleColor: 'hsl(var(--popover-foreground))',
                  bodyColor: 'hsl(var(--popover-foreground))',
                  borderColor: 'hsl(var(--border))',
                  borderWidth: 1,
                  padding: 12,
                  displayColors: true,
                  boxPadding: 6,
                }
              },
              scales: {
                y: { 
                  beginAtZero: true,
                  grid: {
                    display: true,
                    color: 'hsl(var(--border))',
                  },
                  border: {
                    display: false
                  },
                  ticks: {
                    padding: 8,
                    font: {
                      size: 11
                    }
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
                    padding: 8,
                    font: {
                      size: 11
                    }
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
