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

export const LeadCard = ({ lead, imovel, onStatusChange, onDelete, onDragStart }: LeadCardProps) => {
  const [showModal, setShowModal] = useState(false);

  const getInterestBadgeColor = (tipo: string) => {
    return tipo === 'Venda' ? 'bg-pink-500 text-white' : 'bg-blue-500 text-white';
  };

  return (
    <>
      <Card 
        className="group hover:shadow-lg transition-all duration-200 cursor-move border-l-4 border-l-primary/20 hover:border-l-primary hover:scale-[1.02]"
        draggable
        onDragStart={() => onDragStart(lead)}
      >
        <CardContent className="p-4 space-y-3">
          <div className="flex items-start justify-between gap-2">
            <div className="flex-1 min-w-0">
              <div className="flex items-center gap-2 mb-2">
                <Badge className={`${getInterestBadgeColor(lead.tipo_interesse)} text-xs font-medium`}>
                  {lead.tipo_interesse}
                </Badge>
                {lead.created_at && (
                  <span className="text-xs text-muted-foreground">
                    {format(new Date(lead.created_at), "dd/MM", { locale: ptBR })}
                  </span>
                )}
              </div>
              <h4 className="font-semibold text-base text-foreground truncate">
                {lead.nome}
              </h4>
              {imovel && (
                <p className="text-xs text-muted-foreground truncate mt-1">
                  📍 {imovel.codigo}
                </p>
              )}
            </div>
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button 
                  variant="ghost" 
                  size="sm" 
                  className="h-8 w-8 p-0 opacity-0 group-hover:opacity-100 transition-opacity"
                >
                  <MoreVertical className="h-4 w-4" />
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end">
                <DropdownMenuItem onClick={() => setShowModal(true)}>
                  <Edit className="h-4 w-4 mr-2" />
                  Editar lead
                </DropdownMenuItem>
                <DropdownMenuItem onClick={() => onDelete(lead.id)} className="text-destructive">
                  <Trash2 className="h-4 w-4 mr-2" />
                  Excluir
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          </div>

          <div className="space-y-2">
            <a 
              href={`tel:${lead.telefone}`} 
              className="flex items-center gap-2 text-sm text-foreground hover:text-primary transition-colors group/link"
            >
              <Phone className="h-3.5 w-3.5 text-muted-foreground group-hover/link:text-primary" />
              <span className="truncate">{lead.telefone}</span>
            </a>
            <a 
              href={`mailto:${lead.email}`} 
              className="flex items-center gap-2 text-sm text-foreground hover:text-primary transition-colors group/link"
            >
              <Mail className="h-3.5 w-3.5 text-muted-foreground group-hover/link:text-primary" />
              <span className="truncate">{lead.email}</span>
            </a>
          </div>

          {lead.observacoes && (
            <div className="bg-muted/30 rounded-md p-2 text-xs text-muted-foreground line-clamp-2">
              💬 {lead.observacoes}
            </div>
          )}

          <Button 
            variant="outline" 
            size="sm" 
            className="w-full text-xs font-medium hover:bg-primary/10"
            onClick={() => setShowModal(true)}
          >
            <Edit className="h-3 w-3 mr-1" />
            Abrir lead
          </Button>
        </CardContent>
      </Card>

      <LeadModal
        lead={lead}
        imovel={imovel}
        isOpen={showModal}
        onClose={() => setShowModal(false)}
        onStatusChange={onStatusChange}
      />
    </>
  );
};
