import { Home, Building2, Users, CheckSquare, BarChart3, FileText, UserCog, Sparkles, Globe } from 'lucide-react';
import type { TabType } from '@/types';
import { usePermissions } from '@/hooks/usePermissions';
import { useAssistantContext } from '@/contexts/AssistantContext';
import logoGeum from '@/assets/logo-geum-black.png';
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
      { id: 'imoveis' as TabType, label: 'Exclusivos', icon: Building2 },
      { id: 'imoveis-arbo' as TabType, label: 'Vitrine Pública', icon: Globe },
      { id: 'cms' as TabType, label: 'Editor de Site', icon: Sparkles },
      { id: 'metricas' as TabType, label: 'Métricas', icon: BarChart3 },
      { id: 'chat-ia' as TabType, label: 'Chat com IA', icon: Sparkles },
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
        {/* Header com Logo */}
        <div className="p-4 border-b border-border">
          <img
            src={logoGeum}
            alt="Geum Imobiliária"
            className={`${isCollapsed ? 'w-8 h-8 object-contain mx-auto' : 'h-8 w-auto'} transition-all`}
          />
        </div>

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
                    <div className="flex items-center gap-3 px-2 mb-2 mt-4 first:mt-0">
                      <span className="text-[10px] font-bold text-muted-foreground/70 uppercase tracking-widest whitespace-nowrap">
                        {group.label}
                      </span>
                      <div className="h-px bg-border/50 flex-1" />
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
                    <div className="flex items-center gap-3 px-2 mb-2 mt-4">
                      <span className="text-[10px] font-bold text-muted-foreground/70 uppercase tracking-widest whitespace-nowrap">
                        Configurações
                      </span>
                      <div className="h-px bg-border/50 flex-1" />
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