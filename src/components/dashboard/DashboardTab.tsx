import { useMemo, useEffect, useState } from 'react';
import { Building2, Eye, Calendar } from 'lucide-react';
import { motion } from 'framer-motion';
import { supabaseStorageService } from '@/lib/supabaseStorage';
import { getCurrentMonth, getPreviousMonth, getLast6Months } from '@/lib/dateUtils';
import { Card } from '@/components/ui/card';
import { KPICard } from './KPICard';
import { LeadsVisitsChart } from './LeadsVisitsChart';
import { ViewsChart } from './ViewsChart';
import type { Imovel, Metrica } from '@/types';

export const DashboardTab = () => {
  const [imoveis, setImoveis] = useState<Imovel[]>([]);
  const [metricas, setMetricas] = useState<Metrica[]>([]);
  const [loading, setLoading] = useState(true);
  const currentMonth = getCurrentMonth();

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
    // Encontrar o mês mais recente com dados
    const availableMonths = [...new Set(metricas.map(m => m.mes))].sort().reverse();
    const latestMonth = availableMonths[0] || currentMonth;

    const latestMetrics = metricas.filter((m) => m.mes === latestMonth);
    const totalLeads = latestMetrics.reduce((sum, m) => sum + m.leads, 0);
    const totalViews = latestMetrics.reduce((sum, m) => sum + m.visualizacoes, 0);
    const totalVisits = latestMetrics.reduce((sum, m) => sum + m.visitas_realizadas, 0);

    return {
      totalImoveis: imoveis.length,
      leads: totalLeads,
      views: totalViews,
      visits: totalVisits,
    };
  }, [imoveis, metricas, currentMonth]);

  const totalStats = useMemo(() => {
    const allLeads = metricas.reduce((sum, m) => sum + m.leads, 0);
    const allViews = metricas.reduce((sum, m) => sum + m.visualizacoes, 0);
    const allVisits = metricas.reduce((sum, m) => sum + m.visitas_realizadas, 0);

    return {
      totalImoveis: imoveis.length,
      leads: allLeads,
      views: allViews,
      visits: allVisits,
    };
  }, [imoveis, metricas]);

  // Dados para os gráficos
  const chartData = useMemo(() => {
    const last6Months = getLast6Months();
    return last6Months.map((month) => {
      const [, m] = month.split('-');
      const monthLabel = new Date(2000, parseInt(m) - 1).toLocaleDateString('pt-BR', { month: 'short' }).replace('.', '').toUpperCase();

      const metricsForMonth = metricas.filter((m) => m.mes === month);
      const leads = metricsForMonth.reduce((sum, m) => sum + m.leads, 0);
      const visits = metricsForMonth.reduce((sum, m) => sum + m.visitas_realizadas, 0);
      const views = metricsForMonth.reduce((sum, m) => sum + m.visualizacoes, 0);

      return {
        name: monthLabel,
        leads,
        visits,
        views
      };
    });
  }, [metricas]);

  if (loading) {
    return (
      <div className="flex items-center justify-center h-[calc(100vh-200px)]">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary"></div>
      </div>
    );
  }

  const containerVariants = {
    hidden: { opacity: 0 },
    show: {
      opacity: 1,
      transition: {
        staggerChildren: 0.1
      }
    }
  };

  const itemVariants = {
    hidden: { opacity: 0, y: 20 },
    show: { opacity: 1, y: 0, transition: { type: "spring", stiffness: 50 } }
  };

  return (
    <motion.div
      variants={containerVariants}
      initial="hidden"
      animate="show"
      className="space-y-6 p-2 md:p-6"
    >
      {/* Activity Cards Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        <KPICard
          title="Total de Leads"
          value={stats.leads}
          index={0}
        />
        <KPICard
          title="Visualizações"
          value={stats.views.toLocaleString('pt-BR')}
          index={1}
        />
        <KPICard
          title="Visitas Realizadas"
          value={stats.visits}
          index={2}
        />
      </div>

      {/* General Data Section */}
      <motion.div variants={itemVariants} className="space-y-4">
        <h2 className="text-xl font-bold tracking-tight px-1">Dados gerais</h2>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <motion.div whileHover={{ scale: 1.02 }} className="bg-white/40 dark:bg-black/20 backdrop-blur-md p-6 rounded-2xl border border-white/20 shadow-sm flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-muted-foreground mb-1">Total de Imóveis</p>
              <p className="text-3xl font-bold">{totalStats.totalImoveis}</p>
            </div>
            <div className="p-3 bg-primary/10 rounded-xl">
              <Building2 className="h-6 w-6 text-primary" />
            </div>
          </motion.div>

          <motion.div whileHover={{ scale: 1.02 }} className="bg-white/40 dark:bg-black/20 backdrop-blur-md p-6 rounded-2xl border border-white/20 shadow-sm flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-muted-foreground mb-1">Visualizações Totais</p>
              <p className="text-3xl font-bold">{totalStats.views.toLocaleString('pt-BR')}</p>
            </div>
            <div className="p-3 bg-primary/10 rounded-xl">
              <Eye className="h-6 w-6 text-primary" />
            </div>
          </motion.div>

          <motion.div whileHover={{ scale: 1.02 }} className="bg-white/40 dark:bg-black/20 backdrop-blur-md p-6 rounded-2xl border border-white/20 shadow-sm flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-muted-foreground mb-1">Visitas Totais</p>
              <p className="text-3xl font-bold">{totalStats.visits}</p>
            </div>
            <div className="p-3 bg-primary/10 rounded-xl">
              <Calendar className="h-6 w-6 text-primary" />
            </div>
          </motion.div>
        </div>
      </motion.div>

      {/* Charts Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Gráfico de Leads e Visitas */}
        <motion.div
          variants={itemVariants}
          className="bg-white/60 dark:bg-black/30 backdrop-blur-xl rounded-3xl p-6 border border-white/20 shadow-sm"
        >
          <div className="mb-6">
            <h2 className="text-lg font-bold">Leads e Visitas</h2>
            <p className="text-sm text-muted-foreground">Últimos 6 meses</p>
          </div>
          <LeadsVisitsChart data={chartData} />
        </motion.div>

        {/* Gráfico de Visualizações */}
        <motion.div
          variants={itemVariants}
          className="bg-white/60 dark:bg-black/30 backdrop-blur-xl rounded-3xl p-6 border border-white/20 shadow-sm"
        >
          <div className="mb-6">
            <h2 className="text-lg font-bold">Visualizações</h2>
            <p className="text-sm text-muted-foreground">Desempenho nos portais</p>
          </div>
          <ViewsChart data={chartData} />
        </motion.div>
      </div>
    </motion.div>
  );
};
