import { cn } from '@/lib/utils';
import { ArrowRight } from 'lucide-react';
import { motion } from 'framer-motion';

interface KPICardProps {
  title: string;
  value: string | number;
  icon?: React.ReactNode;
  badge?: string;
  onClick?: () => void;
  className?: string;
  index?: number;
}

export const KPICard = ({ title, value, icon, badge, onClick, className, index = 0 }: KPICardProps) => {
  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.4, delay: index * 0.1, ease: "easeOut" }}
      className={cn(
        "bg-white/50 dark:bg-black/20 backdrop-blur-xl rounded-2xl p-6 border border-white/20 shadow-sm hover:shadow-lg transition-all duration-300 cursor-pointer group hover:-translate-y-1",
        className
      )}
      onClick={onClick}
    >
      <div className="flex items-start justify-between mb-4">
        <div className="flex-1">
          <div className="flex items-center gap-2 mb-2">
             <span className="text-sm font-medium text-muted-foreground">{title}</span>
            {badge && (
              <span className="inline-flex px-2 py-0.5 rounded-full bg-primary/5 text-primary text-[10px] font-bold uppercase tracking-wider">
                {badge}
              </span>
            )}
          </div>
          <div className="text-3xl font-bold text-foreground tracking-tight">{value}</div>
        </div>
        <div className="bg-white dark:bg-white/5 p-3 rounded-xl shadow-sm group-hover:scale-110 transition-transform duration-300">
            {icon ? (
            <div className="text-foreground">{icon}</div>
            ) : (
            <ArrowRight className="h-5 w-5 text-muted-foreground group-hover:text-primary transition-colors" />
            )}
        </div>
      </div>
    </motion.div>
  );
};
