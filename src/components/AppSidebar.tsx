import { Home, Building2, Users, CheckSquare, BarChart3, FileText, UserCog } from 'lucide-react';
import type { TabType } from '@/types';
import { usePermissions } from '@/hooks/usePermissions';
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

// Menu agrupado por categoria
const menuGroups = [
  {
    label: 'Principal',
    items: [
      { id: 'dashboard' as TabType, label: 'Início', icon: Home },
    ]
  },
  {
    label: 'Atendimento Comercial',
    items: [
      { id: 'leads' as TabType, label: 'Leads', icon: Users },
      { id: 'relatorios' as TabType, label: 'Relatórios', icon: FileText },
    ]
  },
  {
    label: 'Gestão de Imóveis',
    items: [
      { id: 'imoveis' as TabType, label: 'Imóveis', icon: Building2 },
      { id: 'metricas' as TabType, label: 'Métricas', icon: BarChart3 },
    ]
  },
  {
    label: 'Atividades',
    items: [
      { id: 'tasks' as TabType, label: 'Tarefas', icon: CheckSquare },
    ]
  }
];

export function AppSidebar({ activeTab, onTabChange }: AppSidebarProps) {
  const { state } = useSidebar();
  const isCollapsed = state === 'collapsed';
  const { isAdmin, loading } = usePermissions();

  return (
    <Sidebar className="border-r border-border z-50">
      <div className="h-full bg-card flex flex-col">
        {/* Menu */}
        <SidebarContent className="px-3 py-6">
          {loading ? (
            <div className="p-4 text-center text-muted-foreground text-sm">
              Carregando...
            </div>
          ) : (
            <>
              {menuGroups.map((group) => (
                <SidebarGroup key={group.label}>
                  {!isCollapsed && (
                    <div className="flex items-center gap-2 px-3 mb-2">
                      <span className="text-xs text-muted-foreground uppercase tracking-wider whitespace-nowrap">
                        {group.label}
                      </span>
                      <div className="h-px bg-border flex-1" />
                    </div>
                  )}
                  <SidebarGroupContent>
                    <SidebarMenu>
                      {group.items.map((item) => (
                        <SidebarMenuItem key={item.id}>
                          <SidebarMenuButton
                            onClick={() => onTabChange(item.id)}
                            className={`
                              rounded-lg transition-all
                              ${activeTab === item.id 
                                ? 'bg-accent text-foreground font-medium' 
                                : 'text-muted-foreground hover:bg-muted hover:text-foreground'
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
              ))}

              {/* Admin section */}
              {isAdmin && (
                <SidebarGroup>
                  {!isCollapsed && (
                    <div className="flex items-center gap-2 px-3 mb-2">
                      <span className="text-xs text-muted-foreground uppercase tracking-wider whitespace-nowrap">
                        Configurações
                      </span>
                      <div className="h-px bg-border flex-1" />
                    </div>
                  )}
                  <SidebarGroupContent>
                    <SidebarMenu>
                      <SidebarMenuItem>
                        <SidebarMenuButton
                          onClick={() => onTabChange('usuarios')}
                          className={`
                            rounded-lg transition-all
                            ${activeTab === 'usuarios' 
                              ? 'bg-accent text-foreground font-medium' 
                              : 'text-muted-foreground hover:bg-muted hover:text-foreground'
                            }
                            ${isCollapsed ? 'justify-center' : ''}
                          `}
                        >
                          <UserCog className={`h-5 w-5 ${isCollapsed ? '' : 'mr-3'}`} />
                          {!isCollapsed && <span>Usuários</span>}
                        </SidebarMenuButton>
                      </SidebarMenuItem>
                    </SidebarMenu>
                  </SidebarGroupContent>
                </SidebarGroup>
              )}
            </>
          )}
        </SidebarContent>
      </div>
    </Sidebar>
  );
}