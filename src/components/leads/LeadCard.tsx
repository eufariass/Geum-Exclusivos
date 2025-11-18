import { useState } from 'react';
import type { Lead, Imovel } from '@/types';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { MoreVertical, Phone, Mail, Edit, Trash2 } from 'lucide-react';
import { LeadModal } from './LeadModal';
import { format } from 'date-fns';
import { ptBR } from 'date-fns/locale';

interface LeadCardProps {
  lead: Lead;
  imovel?: Imovel;
  onStatusChange: (leadId: string, newStatus: Lead['status']) => void;
  onDelete: (leadId: string) => void;
  onDragStart: (lead: Lead) => void;
}

const statusOptions: Lead['status'][] = [
  'Aguardando',
  'Em Atendimento',
  'Visita',
  'Proposta',
  'Fechado',
  'Inativo',
];

export const LeadCard = ({ lead, imovel, onStatusChange, onDelete, onDragStart }: LeadCardProps) => {
  const [showModal, setShowModal] = useState(false);

  const getInterestBadgeColor = (tipo: string) => {
    return tipo === 'Venda' ? 'bg-pink-500 text-white' : 'bg-blue-500 text-white';
  };

  return (
    <>
      <Card 
        className="hover:shadow-md transition-shadow cursor-move"
        draggable
        onDragStart={() => onDragStart(lead)}
      >
        <CardContent className="p-3 space-y-2">
          <div className="flex items-start justify-between gap-2">
            <div className="flex-1 min-w-0">
              <Badge className={`${getInterestBadgeColor(lead.tipo_interesse)} text-xs mb-1`}>
                {lead.tipo_interesse.toUpperCase()}
              </Badge>
              <p className="font-semibold text-sm text-foreground truncate">
                {lead.nome}
              </p>
              {imovel && (
                <p className="text-xs text-muted-foreground truncate">
                  {imovel.codigo}
                </p>
              )}
            </div>
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button variant="ghost" size="sm" className="h-6 w-6 p-0">
                  <MoreVertical className="h-4 w-4" />
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end">
                <DropdownMenuItem onClick={() => setShowModal(true)}>
                  <Edit className="h-4 w-4 mr-2" />
                  Editar
                </DropdownMenuItem>
                <DropdownMenuItem onClick={() => onDelete(lead.id)} className="text-destructive">
                  <Trash2 className="h-4 w-4 mr-2" />
                  Excluir
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          </div>

          <div className="space-y-1 text-xs">
            <div className="flex items-center gap-1 text-muted-foreground">
              <Phone className="h-3 w-3" />
              <a href={`tel:${lead.telefone}`} className="hover:text-primary truncate">
                {lead.telefone}
              </a>
            </div>
            <div className="flex items-center gap-1 text-muted-foreground">
              <Mail className="h-3 w-3" />
              <a href={`mailto:${lead.email}`} className="hover:text-primary truncate">
                {lead.email}
              </a>
            </div>
          </div>

          {lead.created_at && (
            <p className="text-xs text-muted-foreground">
              {format(new Date(lead.created_at), "dd/MM/yyyy - HH:mm", { locale: ptBR })}
            </p>
          )}

          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="outline" size="sm" className="w-full text-xs">
                Alterar Status
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent className="w-48">
              {statusOptions.map((status) => (
                <DropdownMenuItem
                  key={status}
                  onClick={() => onStatusChange(lead.id, status)}
                  disabled={status === lead.status}
                >
                  {status}
                </DropdownMenuItem>
              ))}
            </DropdownMenuContent>
          </DropdownMenu>

          {lead.observacoes && (
            <div className="bg-muted/50 rounded p-2 text-xs text-muted-foreground">
              {lead.observacoes}
            </div>
          )}
        </CardContent>
      </Card>

      <LeadModal
        lead={lead}
        imovel={imovel}
        isOpen={showModal}
        onClose={() => setShowModal(false)}
      />
    </>
  );
};