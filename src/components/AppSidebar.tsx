import { Home, Building2, Users, CheckSquare, BarChart3, FileText, UserCog, ChevronRight } from 'lucide-react';
import logoBlack from '@/assets/logo-geum-black.png';
import type { TabType } from '@/types';
import { usePermissions } from '@/hooks/usePermissions';
import {
  Sidebar,
  SidebarContent,
  SidebarGroup,
  SidebarGroupContent,
  SidebarGroupLabel,
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
        {/* Logo & Header */}
        <div className={`p-6 border-b border-border ${isCollapsed ? 'px-2' : ''}`}>
          {isCollapsed ? (
            <div className="flex justify-center">
              <img src={logoBlack} alt="Geum" className="h-8 w-auto object-contain" />
            </div>
          ) : (
            <div className="flex flex-col gap-1">
              <img src={logoBlack} alt="Geum" className="h-8 w-auto object-contain mb-2" />
              <h2 className="text-foreground font-bold text-sm">
                CRM Geum
              </h2>
              <p className="text-muted-foreground text-xs">
                Imobiliária Intelligence
              </p>
            </div>
          )}
        </div>

        {/* Menu */}
        <SidebarContent className="px-3 py-4">
          {loading ? (
            <div className="p-4 text-center text-muted-foreground text-sm">
              Carregando...
            </div>
          ) : (
            <>
              {menuGroups.map((group) => (
                <SidebarGroup key={group.label}>
                  {!isCollapsed && (
                    <SidebarGroupLabel className="text-xs text-muted-foreground uppercase tracking-wider px-3 mb-2">
                      {group.label}
                    </SidebarGroupLabel>
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
                                ? 'bg-primary/10 text-primary font-semibold border-l-4 border-primary hover:bg-primary/15' 
                                : 'text-muted-foreground hover:bg-muted hover:text-foreground'
                              }
                              ${isCollapsed ? 'justify-center' : ''}
                            `}
                          >
                            <item.icon className={`h-5 w-5 ${isCollapsed ? '' : 'mr-3'}`} />
                            {!isCollapsed && <span>{item.label}</span>}
                            {!isCollapsed && activeTab === item.id && (
                              <ChevronRight className="h-4 w-4 ml-auto" />
                            )}
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
                    <SidebarGroupLabel className="text-xs text-muted-foreground uppercase tracking-wider px-3 mb-2">
                      Configurações
                    </SidebarGroupLabel>
                  )}
                  <SidebarGroupContent>
                    <SidebarMenu>
                      <SidebarMenuItem>
                        <SidebarMenuButton
                          onClick={() => onTabChange('usuarios')}
                          className={`
                            rounded-lg transition-all
                            ${activeTab === 'usuarios' 
                              ? 'bg-primary/10 text-primary font-semibold border-l-4 border-primary hover:bg-primary/15' 
                              : 'text-muted-foreground hover:bg-muted hover:text-foreground'
                            }
                            ${isCollapsed ? 'justify-center' : ''}
                          `}
                        >
                          <UserCog className={`h-5 w-5 ${isCollapsed ? '' : 'mr-3'}`} />
                          {!isCollapsed && <span>Usuários</span>}
                          {!isCollapsed && activeTab === 'usuarios' && (
                            <ChevronRight className="h-4 w-4 ml-auto" />
                          )}
                        </SidebarMenuButton>
                      </SidebarMenuItem>
                    </SidebarMenu>
                  </SidebarGroupContent>
                </SidebarGroup>
              )}
            </>
          )}
        </SidebarContent>

        {/* Footer */}
        {!isCollapsed && (
          <div className="mt-auto p-4 border-t border-border">
            <p className="text-xs text-muted-foreground text-center">
              © {new Date().getFullYear()} Geum
            </p>
          </div>
        )}
      </div>
    </Sidebar>
  );
}
