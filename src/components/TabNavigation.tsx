import type { TabType } from '@/types';
import { cn } from '@/lib/utils';

interface TabNavigationProps {
  activeTab: TabType;
  onTabChange: (tab: TabType) => void;
}

const tabs: { id: TabType; label: string; icon: string }[] = [
  { id: 'dashboard', label: 'Dashboard', icon: '📊' },
  { id: 'imoveis', label: 'Imóveis', icon: '🏠' },
  { id: 'metricas', label: 'Métricas', icon: '📈' },
  { id: 'relatorios', label: 'Relatórios', icon: '📄' },
];

export const TabNavigation = ({ activeTab, onTabChange }: TabNavigationProps) => {
  return (
    <nav className="bg-card border-b border-border px-6 py-3 sticky top-[72px] z-30 no-print">
      <div className="container mx-auto">
        <div className="flex gap-2 overflow-x-auto pb-1">
          {tabs.map((tab) => (
            <button
              key={tab.id}
              onClick={() => onTabChange(tab.id)}
              className={cn(
                'px-4 py-2 rounded-full text-sm font-medium transition-all duration-200 whitespace-nowrap',
                'flex items-center gap-2',
                activeTab === tab.id ? 'tab-active' : 'tab-inactive'
              )}
            >
              <span>{tab.icon}</span>
              <span>{tab.label}</span>
            </button>
          ))}
        </div>
      </div>
    </nav>
  );
};
