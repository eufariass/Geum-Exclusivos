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
        relative group overflow-hidden border-border/40 bg-background/60 backdrop-blur-sm hover:bg-background/80 hover:border-primary/20
        transition-all duration-200 cursor-grab active:cursor-grabbing
        ${isDragging ? 'shadow-2xl scale-105 rotate-2 ring-2 ring-primary z-50 opacity-90' : 'shadow-sm hover:shadow-md'}
      `}
    >
      <div className="p-3 space-y-2">
        {/* Header: Nome & Badge */}
        <div className="flex justify-between items-start gap-2">
          <h4 className="font-medium text-sm text-foreground leading-tight line-clamp-2">
            {lead.nome}
          </h4>
          <Badge
            variant="outline"
            className={`text-[10px] px-1.5 h-5 border-0 ${lead.tipo_interesse === 'Venda' ? 'bg-pink-500/10 text-pink-500' : 'bg-blue-500/10 text-blue-500'}`}
          >
            {lead.tipo_interesse}
          </Badge>
        </div>

        {/* Contact info (Icon only usually, expanding on hover could be cool but let's keep it simple) */}
        <div className="flex flex-col gap-1">
          {(lead as any).imovel && (
            <div className="flex items-center gap-1.5 text-xs text-muted-foreground bg-muted/30 p-1.5 rounded-md">
              <Home className="h-3 w-3 opacity-70" />
              <span className="truncate font-mono">{(lead as any).imovel.codigo}</span>
            </div>
          )}

          <div className="flex items-center gap-3 mt-1">
            {lead.telefone && (
              <div className="flex items-center gap-1 text-[10px] text-muted-foreground">
                <Phone className="h-3 w-3 opacity-50" />
                <span className="truncate max-w-[80px]">{lead.telefone}</span>
              </div>
            )}
            <div className="flex items-center gap-1 text-[10px] text-muted-foreground ml-auto">
              <Calendar className="h-3 w-3 opacity-50" />
              <span>
                {lead.created_at
                  ? formatDistanceToNow(new Date(lead.created_at), {
                    addSuffix: true,
                    locale: ptBR,
                  }).replace('passado', '')
                  : ''}
              </span>
            </div>
          </div>
        </div>
      </div>

      {/* Decorative side bar */}
      <div className={`absolute left-0 top-0 bottom-0 w-0.5 ${lead.tipo_interesse === 'Venda' ? 'bg-pink-500' : 'bg-blue-500'} opacity-50`} />
    </Card>
  );
};
