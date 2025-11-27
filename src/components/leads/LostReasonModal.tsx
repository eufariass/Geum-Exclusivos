import { useState, useEffect } from 'react';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import type { Lead, LostReason } from '@/types';
import { pipelineService } from '@/services/pipeline.service';
import { Loader2, AlertCircle } from 'lucide-react';
import { toast } from 'sonner';

interface LostReasonModalProps {
  lead: Lead;
  onConfirm: (reasonId: string, notes?: string) => void;
  onCancel: () => void;
}

export const LostReasonModal = ({ lead, onConfirm, onCancel }: LostReasonModalProps) => {
  const [reasons, setReasons] = useState<LostReason[]>([]);
  const [selectedReasonId, setSelectedReasonId] = useState<string>('');
  const [notes, setNotes] = useState('');
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    loadReasons();
  }, []);

  const loadReasons = async () => {
    try {
      setLoading(true);
      const data = await pipelineService.getLostReasons();
      setReasons(data);
    } catch (error) {
      console.error('Error loading lost reasons:', error);
      toast.error('Erro ao carregar motivos');
    } finally {
      setLoading(false);
    }
  };

  const handleSubmit = async () => {
    if (!selectedReasonId) {
      toast.error('Selecione um motivo de perda');
      return;
    }

    setSubmitting(true);
    try {
      await onConfirm(selectedReasonId, notes || undefined);
    } catch (error) {
      console.error('Error confirming lost reason:', error);
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <Dialog open onOpenChange={(open) => !open && onCancel()}>
      <DialogContent className="sm:max-w-[500px]">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <AlertCircle className="h-5 w-5 text-destructive" />
            Marcar Lead como Perdido
          </DialogTitle>
          <DialogDescription>
            Lead: <span className="font-semibold">{lead.nome}</span>
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4 py-4">
          {/* Motivo */}
          <div className="space-y-2">
            <Label htmlFor="reason">
              Motivo da perda <span className="text-destructive">*</span>
            </Label>
            {loading ? (
              <div className="flex items-center justify-center py-4">
                <Loader2 className="h-6 w-6 animate-spin" />
              </div>
            ) : (
              <Select value={selectedReasonId} onValueChange={setSelectedReasonId}>
                <SelectTrigger id="reason">
                  <SelectValue placeholder="Selecione o motivo" />
                </SelectTrigger>
                <SelectContent>
                  {reasons.map((reason) => (
                    <SelectItem key={reason.id} value={reason.id}>
                      {reason.reason}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            )}
          </div>

          {/* Observações */}
          <div className="space-y-2">
            <Label htmlFor="notes">Observações (opcional)</Label>
            <Textarea
              id="notes"
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              placeholder="Adicione detalhes sobre o motivo da perda..."
              className="min-h-[100px] resize-none"
            />
          </div>
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={onCancel} disabled={submitting}>
            Cancelar
          </Button>
          <Button
            variant="destructive"
            onClick={handleSubmit}
            disabled={!selectedReasonId || submitting}
          >
            {submitting ? (
              <>
                <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                Marcando...
              </>
            ) : (
              'Confirmar Perda'
            )}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};
