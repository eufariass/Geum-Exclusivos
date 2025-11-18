import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import type { Lead, Imovel } from '@/types';
import { LeadCard } from './LeadCard';
import { Loader2 } from 'lucide-react';

interface LeadsTabProps {
  onToast: (message: string, type: 'success' | 'error') => void;
}

const statusColumns = [
  { id: 'Aguardando', label: 'Aguardando', color: 'bg-gray-100' },
  { id: 'Em Atendimento', label: 'Em Atendimento', color: 'bg-blue-50' },
  { id: 'Visita', label: 'Visita', color: 'bg-purple-50' },
  { id: 'Proposta', label: 'Proposta', color: 'bg-orange-50' },
  { id: 'Fechado', label: 'Fechado', color: 'bg-green-50' },
  { id: 'Inativo', label: 'Inativo', color: 'bg-red-50' },
] as const;

export const LeadsTab = ({ onToast }: LeadsTabProps) => {
  const [leads, setLeads] = useState<Lead[]>([]);
  const [imoveis, setImoveis] = useState<Imovel[]>([]);
  const [loading, setLoading] = useState(true);

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
        <h1 className="text-3xl font-bold text-foreground">Gestão de Leads</h1>
        <div className="text-sm text-muted-foreground">
          Total: {leads.length} leads
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 xl:grid-cols-6 gap-4">
        {statusColumns.map((column) => {
          const columnLeads = getLeadsByStatus(column.id as Lead['status']);
          return (
            <div key={column.id} className="flex flex-col">
              <div className={`${column.color} rounded-t-lg p-3 border-b-2 border-border`}>
                <h3 className="font-semibold text-sm text-foreground">
                  {column.label}
                </h3>
                <p className="text-xs text-muted-foreground mt-1">
                  {columnLeads.length}/{leads.length}
                </p>
              </div>
              <div className="bg-card border border-t-0 rounded-b-lg p-2 space-y-2 min-h-[200px]">
                {columnLeads.map((lead) => (
                  <LeadCard
                    key={lead.id}
                    lead={lead}
                    imovel={getImovelByCodigo(lead.imovel_id)}
                    onStatusChange={handleStatusChange}
                    onDelete={handleDelete}
                  />
                ))}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
};