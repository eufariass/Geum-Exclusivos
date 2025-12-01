import { cn } from '@/lib/utils';
import { ArrowRight } from 'lucide-react';

interface KPICardProps {
  title: string;
  value: string | number;
  icon?: React.ReactNode;
  badge?: string;
  onClick?: () => void;
  className?: string;
}

export const KPICard = ({ title, value, icon, badge, onClick, className }: KPICardProps) => {
  return (
    <div 
      className={cn(
        "bg-card rounded-xl p-6 border border-border hover:shadow-md transition-all cursor-pointer group",
        className
      )}
      onClick={onClick}
    >
      <div className="flex items-start justify-between mb-3">
        <div className="flex-1">
          <div className="text-4xl font-bold text-foreground mb-2">{value}</div>
          {badge && (
            <span className="inline-block px-2.5 py-1 rounded-full bg-muted text-muted-foreground text-xs font-medium mb-2">
              {badge}
            </span>
          )}
          <p className="text-sm text-muted-foreground">{title}</p>
        </div>
        {icon ? (
          <div className="text-primary">{icon}</div>
        ) : (
          <ArrowRight className="h-5 w-5 text-muted-foreground group-hover:text-primary transition-colors" />
        )}
      </div>
    </div>
  );
};
