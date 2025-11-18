import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import type { Lead, Imovel } from '@/types';
import { LeadCard } from './LeadCard';
import { Loader2 } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';

interface LeadsTabProps {
  onToast: (message: string, type: 'success' | 'error') => void;
}

const statusColumns = [
  { 
    id: 'Aguardando', 
    label: 'Aguardando', 
    color: 'bg-amber-50 dark:bg-amber-950/20',
    icon: '⏳',
    description: 'Novos leads'
  },
  { 
    id: 'Enviado ao corretor', 
    label: 'Enviado ao corretor', 
    color: 'bg-blue-50 dark:bg-blue-950/20',
    icon: '📤',
    description: 'Em atendimento'
  },
  { 
    id: 'Follow up', 
    label: 'Follow up', 
    color: 'bg-purple-50 dark:bg-purple-950/20',
    icon: '🔄',
    description: 'Acompanhamento'
  },
] as const;

export const LeadsTab = ({ onToast }: LeadsTabProps) => {
  const [leads, setLeads] = useState<Lead[]>([]);
  const [imoveis, setImoveis] = useState<Imovel[]>([]);
  const [loading, setLoading] = useState(true);
  const [draggedLead, setDraggedLead] = useState<Lead | null>(null);

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    try {
      setLoading(true);
      
      const [leadsResult, imoveisResult] = await Promise.all([
        supabase.from('leads').select('*').order('created_at', { ascending: false }),
        supabase.from('imoveis').select('*')
      ]);

      if (leadsResult.error) throw leadsResult.error;
      if (imoveisResult.error) throw imoveisResult.error;

      setLeads(leadsResult.data as Lead[] || []);
      setImoveis(imoveisResult.data as Imovel[] || []);
    } catch (error: any) {
      onToast(error.message || 'Erro ao carregar leads', 'error');
    } finally {
      setLoading(false);
    }
  };

  const handleStatusChange = async (leadId: string, newStatus: Lead['status']) => {
    try {
      const { error } = await supabase
        .from('leads')
        .update({ status: newStatus })
        .eq('id', leadId);

      if (error) throw error;

      setLeads(leads.map(lead => 
        lead.id === leadId ? { ...lead, status: newStatus } : lead
      ));
      onToast('Status atualizado com sucesso', 'success');
    } catch (error: any) {
      onToast(error.message || 'Erro ao atualizar status', 'error');
    }
  };

  const handleDelete = async (leadId: string) => {
    if (!confirm('Tem certeza que deseja excluir este lead?')) return;

    try {
      const { error } = await supabase
        .from('leads')
        .delete()
        .eq('id', leadId);

      if (error) throw error;

      setLeads(leads.filter(lead => lead.id !== leadId));
      onToast('Lead excluído com sucesso', 'success');
    } catch (error: any) {
      onToast(error.message || 'Erro ao excluir lead', 'error');
    }
  };

  const getLeadsByStatus = (status: Lead['status']) => {
    return leads.filter(lead => lead.status === status);
  };

  const getImovelByCodigo = (imovelId: string) => {
    return imoveis.find(i => i.id === imovelId);
  };

  const handleDragStart = (lead: Lead) => {
    setDraggedLead(lead);
  };

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
  };

  const handleDrop = async (e: React.DragEvent, newStatus: Lead['status']) => {
    e.preventDefault();
    
    if (!draggedLead || draggedLead.status === newStatus) {
      setDraggedLead(null);
      return;
    }

    await handleStatusChange(draggedLead.id, newStatus);
    setDraggedLead(null);
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <Loader2 className="w-8 h-8 animate-spin text-primary" />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-foreground">Gestão de Leads</h1>
          <p className="text-muted-foreground mt-1">Acompanhe seus leads do primeiro contato ao fechamento</p>
        </div>
        <div className="text-right">
          <p className="text-2xl font-bold text-foreground">{leads.length}</p>
          <p className="text-sm text-muted-foreground">Leads totais</p>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {statusColumns.map((column) => {
          const columnLeads = getLeadsByStatus(column.id as Lead['status']);
          return (
            <div key={column.id} className="flex flex-col">
              <div className={`${column.color} rounded-t-xl p-4 border-b-2 border-primary/10`}>
                <div className="flex items-center gap-3 mb-2">
                  <span className="text-2xl">{column.icon}</span>
                  <div className="flex-1">
                    <h3 className="font-semibold text-base text-foreground">
                      {column.label}
                    </h3>
                    <p className="text-xs text-muted-foreground">
                      {column.description}
                    </p>
                  </div>
                </div>
                <div className="flex items-center justify-between mt-3">
                  <span className="text-2xl font-bold text-foreground">{columnLeads.length}</span>
                  <span className="text-xs text-muted-foreground">
                    {columnLeads.length === 0 ? 'Nenhum lead' : columnLeads.length === 1 ? '1 lead' : `${columnLeads.length} leads`}
                  </span>
                </div>
              </div>
              <div 
                className="bg-card/50 border border-t-0 rounded-b-xl p-3 space-y-3 min-h-[400px] transition-all hover:bg-card/80"
                onDragOver={handleDragOver}
                onDrop={(e) => handleDrop(e, column.id as Lead['status'])}
              >
                {columnLeads.length === 0 ? (
                  <div className="flex items-center justify-center h-32 text-muted-foreground text-sm">
                    Arraste leads para cá
                  </div>
                ) : (
                  columnLeads.map((lead) => (
                    <LeadCard
                      key={lead.id}
                      lead={lead}
                      imovel={getImovelByCodigo(lead.imovel_id)}
                      onStatusChange={handleStatusChange}
                      onDelete={handleDelete}
                      onDragStart={handleDragStart}
                    />
                  ))
                )}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
};