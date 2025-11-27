import type { Lead } from '@/types';
import { Card } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Mail, Phone, Home, Calendar, GripVertical } from 'lucide-react';
import { formatDistanceToNow } from 'date-fns';
import { ptBR } from 'date-fns/locale';

interface PipelineLeadCardProps {
  lead: Lead;
  isDragging?: boolean;
}

export const PipelineLeadCard = ({ lead, isDragging }: PipelineLeadCardProps) => {
  return (
    <Card
      className={`
        p-3 cursor-grab active:cursor-grabbing hover:shadow-md transition-shadow
        ${isDragging ? 'shadow-xl ring-2 ring-primary' : ''}
      `}
    >
      {/* Nome e Tipo de Interesse */}
      <div className="flex items-start justify-between gap-2 mb-2">
        <div className="flex items-center gap-2 flex-1 min-w-0">
          <GripVertical className="h-4 w-4 text-muted-foreground flex-shrink-0" />
          <h4 className="font-semibold text-sm truncate">{lead.nome}</h4>
        </div>
        <Badge variant={lead.tipo_interesse === 'Venda' ? 'default' : 'secondary'} className="text-xs flex-shrink-0">
          {lead.tipo_interesse}
        </Badge>
      </div>

      {/* Informações de Contato */}
      <div className="space-y-1.5 mb-3">
        {lead.telefone && (
          <div className="flex items-center gap-2 text-xs text-muted-foreground">
            <Phone className="h-3 w-3 flex-shrink-0" />
            <span className="truncate">{lead.telefone}</span>
          </div>
        )}
        {lead.email && (
          <div className="flex items-center gap-2 text-xs text-muted-foreground">
            <Mail className="h-3 w-3 flex-shrink-0" />
            <span className="truncate">{lead.email}</span>
          </div>
        )}
      </div>

      {/* Imóvel (se tiver imovel vinculado) */}
      {(lead as any).imovel && (
        <div className="flex items-start gap-2 text-xs text-muted-foreground mb-2 p-2 bg-muted/50 rounded">
          <Home className="h-3 w-3 flex-shrink-0 mt-0.5" />
          <div className="flex-1 min-w-0">
            <p className="font-medium truncate">{(lead as any).imovel.codigo}</p>
            <p className="truncate text-[10px]">{(lead as any).imovel.endereco}</p>
          </div>
        </div>
      )}

      {/* Data de Criação */}
      <div className="flex items-center gap-2 text-[10px] text-muted-foreground pt-2 border-t">
        <Calendar className="h-3 w-3" />
        <span>
          {lead.created_at
            ? formatDistanceToNow(new Date(lead.created_at), {
                addSuffix: true,
                locale: ptBR,
              })
            : 'Data desconhecida'}
        </span>
      </div>
    </Card>
  );
};
