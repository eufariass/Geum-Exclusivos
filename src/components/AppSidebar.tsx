import { Home, Building2, Users, CheckSquare, BarChart3, FileText } from 'lucide-react';
import logoWhite from '@/assets/logo-geum-white.png';
import type { TabType } from '@/types';
import {
  Sidebar,
  SidebarContent,
  SidebarGroup,
  SidebarGroupContent,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
  useSidebar,
} from '@/components/ui/sidebar';

interface AppSidebarProps {
  activeTab: string;
  onTabChange: (tab: TabType) => void;
}

const menuItems = [
  { id: 'dashboard' as TabType, label: 'Dashboard', icon: Home },
  { id: 'imoveis' as TabType, label: 'Imóveis', icon: Building2 },
  { id: 'leads' as TabType, label: 'Leads', icon: Users },
  { id: 'tasks' as TabType, label: 'Tarefas', icon: CheckSquare },
  { id: 'metricas' as TabType, label: 'Métricas', icon: BarChart3 },
  { id: 'relatorios' as TabType, label: 'Relatórios', icon: FileText },
];

export function AppSidebar({ activeTab, onTabChange }: AppSidebarProps) {
  const { state } = useSidebar();
  const isCollapsed = state === 'collapsed';

  return (
    <Sidebar className={`border-r z-50 ${isCollapsed ? 'w-16' : 'w-64'}`}>
      <div className="h-full bg-primary flex flex-col">
        {/* Logo */}
        <div className={`p-4 border-b border-primary-foreground/10 ${isCollapsed ? 'px-2' : ''}`}>
        {isCollapsed ? (
          <div className="flex justify-center">
            <img src={logoWhite} alt="Geum" className="h-6 w-auto object-contain" />
          </div>
        ) : (
          <div className="flex flex-col gap-1">
            <img src={logoWhite} alt="Geum" className="h-6 w-auto object-contain mb-2" />
            <h2 className="text-primary-foreground font-bold text-xs leading-tight tracking-wide">
              CRM GEUM
            </h2>
            <p className="text-primary-foreground/70 text-[10px] tracking-wider">
              INTELLIGENCE
            </p>
          </div>
        )}
        </div>

        {/* Menu */}
        <SidebarContent>
          <SidebarGroup>
            <SidebarGroupContent>
              <SidebarMenu>
                {menuItems.map((item) => (
                  <SidebarMenuItem key={item.id}>
                    <SidebarMenuButton
                      onClick={() => onTabChange(item.id)}
                      className={`
                        hover:bg-primary-foreground/10 
                        ${activeTab === item.id 
                          ? 'bg-primary-foreground/20 text-primary-foreground font-semibold border-l-4 border-accent' 
                          : 'text-primary-foreground/80'
                        }
                        ${isCollapsed ? 'justify-center' : ''}
                      `}
                    >
                      <item.icon className={`h-5 w-5 ${isCollapsed ? '' : 'mr-3'}`} />
                      {!isCollapsed && <span>{item.label}</span>}
                    </SidebarMenuButton>
                  </SidebarMenuItem>
                ))}
              </SidebarMenu>
            </SidebarGroupContent>
          </SidebarGroup>
        </SidebarContent>

        {/* Footer */}
        {!isCollapsed && (
          <div className="mt-auto p-4 border-t border-primary-foreground/10">
            <p className="text-xs text-primary-foreground/50 text-center">
              © {new Date().getFullYear()} Geum
            </p>
          </div>
        )}
      </div>
    </Sidebar>
  );
}
