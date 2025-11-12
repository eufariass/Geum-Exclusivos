import { cn } from '@/lib/utils';

interface KPICardProps {
  title: string;
  value: string | number;
  icon: string;
  trend?: {
    value: number;
    direction: 'up' | 'down' | 'neutral' | 'new';
  };
}

export const KPICard = ({ title, value, icon, trend }: KPICardProps) => {
  return (
    <div className="bg-card rounded-xl p-6 shadow-sm border border-border card-hover">
      <div className="flex items-start justify-between mb-4">
        <span className="text-3xl">{icon}</span>
        {trend && (
          <div
            className={cn(
              'text-xs font-semibold px-2 py-1 rounded-full flex items-center gap-1',
              trend.direction === 'up' && 'bg-success/10 text-success',
              trend.direction === 'down' && 'bg-destructive/10 text-destructive',
              trend.direction === 'neutral' && 'bg-muted text-muted-foreground',
              trend.direction === 'new' && 'bg-accent/10 text-accent'
            )}
          >
            {trend.direction === 'up' && '↑'}
            {trend.direction === 'down' && '↓'}
            {trend.direction === 'neutral' && '→'}
            {trend.direction === 'new' && '↑'}
            <span>{trend.direction === 'new' ? 'Novo' : `${Math.abs(trend.value)}%`}</span>
          </div>
        )}
      </div>
      <h3 className="text-sm font-medium text-muted-foreground mb-1">{title}</h3>
      <p className="text-3xl font-bold text-foreground">{value}</p>
    </div>
  );
};
