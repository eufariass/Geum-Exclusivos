import { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import type { PipelineMetrics } from '@/types';
import { pipelineService } from '@/services/pipeline.service';
import { TrendingUp, TrendingDown, Clock, Users, Target, Award } from 'lucide-react';
import { Skeleton } from '@/components/ui/skeleton';

interface PipelineMetricsProps {
  startDate?: Date;
  endDate?: Date;
}

export const PipelineMetricsComponent = ({ startDate, endDate }: PipelineMetricsProps) => {
  const [metrics, setMetrics] = useState<PipelineMetrics[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadMetrics();
  }, [startDate, endDate]);

  const loadMetrics = async () => {
    try {
      setLoading(true);
      const data = await pipelineService.getMetrics(startDate, endDate);
      setMetrics(data);
    } catch (error) {
      console.error('Error loading metrics:', error);
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        {[1, 2, 3, 4].map((i) => (
          <Card key={i}>
            <CardHeader>
              <Skeleton className="h-4 w-24" />
            </CardHeader>
            <CardContent>
              <Skeleton className="h-8 w-16" />
            </CardContent>
          </Card>
        ))}
      </div>
    );
  }

  // Calcular estatísticas gerais
  const totalLeads = metrics.reduce((sum, m) => sum + m.lead_count, 0);
  const wonStage = metrics.find((m) => m.stage_name === 'Fechado/Ganho');
  const lostStage = metrics.find((m) => m.stage_name === 'Perdido');
  const wonCount = wonStage?.lead_count || 0;
  const lostCount = lostStage?.lead_count || 0;
  const inProgressCount = totalLeads - wonCount - lostCount;

  // Taxa de conversão geral
  const overallConversionRate =
    totalLeads > 0 ? ((wonCount / totalLeads) * 100).toFixed(1) : '0.0';

  // Tempo médio geral
  const avgDuration =
    metrics.reduce((sum, m) => sum + (m.avg_duration_days || 0), 0) / metrics.length || 0;

  return (
    <div className="space-y-6">
      {/* Cards de KPI */}
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        {/* Total de Leads */}
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total de Leads</CardTitle>
            <Users className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{totalLeads}</div>
            <p className="text-xs text-muted-foreground">no funil atual</p>
          </CardContent>
        </Card>

        {/* Em Andamento */}
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Em Andamento</CardTitle>
            <Target className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{inProgressCount}</div>
            <p className="text-xs text-muted-foreground">
              {totalLeads > 0 ? ((inProgressCount / totalLeads) * 100).toFixed(0) : 0}% do total
            </p>
          </CardContent>
        </Card>

        {/* Ganhos */}
        <Card className="border-green-500/20">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Fechados</CardTitle>
            <Award className="h-4 w-4 text-green-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-green-600">{wonCount}</div>
            <div className="flex items-center gap-1 text-xs">
              <TrendingUp className="h-3 w-3 text-green-500" />
              <span className="text-green-600 font-medium">{overallConversionRate}%</span>
              <span className="text-muted-foreground">taxa de conversão</span>
            </div>
          </CardContent>
        </Card>

        {/* Tempo Médio */}
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Tempo Médio</CardTitle>
            <Clock className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{avgDuration.toFixed(1)} dias</div>
            <p className="text-xs text-muted-foreground">por etapa</p>
          </CardContent>
        </Card>
      </div>

      {/* Tabela de Métricas por Etapa */}
      <Card>
        <CardHeader>
          <CardTitle>Funil de Conversão</CardTitle>
          <CardDescription>Métricas detalhadas por etapa do pipeline</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            {metrics
              .filter((m) => !m.stage_name.includes('Perdido'))
              .map((metric) => {
                const isWon = metric.stage_name === 'Fechado/Ganho';
                const conversionColor = metric.conversion_rate >= 80 ? 'text-green-600' : metric.conversion_rate >= 50 ? 'text-yellow-600' : 'text-red-600';

                return (
                  <div
                    key={metric.stage_id}
                    className="flex items-center justify-between p-3 rounded-lg bg-muted/30 hover:bg-muted/50 transition-colors"
                  >
                    <div className="flex-1">
                      <div className="flex items-center gap-2">
                        <h4 className="font-semibold text-sm">{metric.stage_name}</h4>
                        {isWon && <Badge variant="default" className="text-xs">Final</Badge>}
                      </div>
                      <div className="flex items-center gap-4 mt-1 text-xs text-muted-foreground">
                        <span className="flex items-center gap-1">
                          <Users className="h-3 w-3" />
                          {metric.lead_count} leads
                        </span>
                        <span className="flex items-center gap-1">
                          <Clock className="h-3 w-3" />
                          {metric.avg_duration_days.toFixed(1)} dias
                        </span>
                      </div>
                    </div>

                    <div className="text-right">
                      <div className={`text-xl font-bold ${conversionColor}`}>
                        {metric.conversion_rate.toFixed(0)}%
                      </div>
                      <div className="flex items-center gap-1 text-xs text-muted-foreground">
                        {metric.conversion_rate >= 70 ? (
                          <TrendingUp className="h-3 w-3 text-green-500" />
                        ) : (
                          <TrendingDown className="h-3 w-3 text-red-500" />
                        )}
                        <span>conversão</span>
                      </div>
                    </div>
                  </div>
                );
              })}
          </div>

          {/* Leads Perdidos */}
          {lostStage && lostCount > 0 && (
            <div className="mt-4 p-3 rounded-lg bg-red-50 dark:bg-red-950/20 border border-red-200 dark:border-red-900">
              <div className="flex items-center justify-between">
                <div>
                  <h4 className="font-semibold text-sm text-red-700 dark:text-red-400">
                    Perdidos
                  </h4>
                  <p className="text-xs text-red-600 dark:text-red-500">
                    {lostCount} leads ({((lostCount / totalLeads) * 100).toFixed(0)}% do total)
                  </p>
                </div>
                <div className="text-2xl font-bold text-red-600 dark:text-red-400">
                  {lostCount}
                </div>
              </div>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
};
