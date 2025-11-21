import { useState } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { Card, CardContent } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Button } from '@/components/ui/button';
import { Checkbox } from '@/components/ui/checkbox';
import { Eye, Heart, Share2 } from 'lucide-react';
import { toast } from 'sonner';

interface LeadFormProps {
  imovelId: string;
  imovelCodigo: string;
  imovelValor?: number;
  tiposDisponiveis?: ('Venda' | 'Locação')[];
}

export const LeadForm = ({ imovelId, imovelCodigo, imovelValor, tiposDisponiveis = ['Venda', 'Locação'] }: LeadFormProps) => {
  const [formData, setFormData] = useState({
    nome: '',
    telefone: '',
    email: '',
    tipo_interesse: (tiposDisponiveis.length === 1 ? tiposDisponiveis[0] : 'Venda') as 'Venda' | 'Locação',
    termos: false,
  });
  const [loading, setLoading] = useState(false);
  const [viewCount] = useState(Math.floor(Math.random() * 50) + 20); // Número aleatório entre 20-70

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!formData.termos) {
      toast.error('Você precisa aceitar os termos de uso');
      return;
    }

    if (!formData.nome.trim() || !formData.telefone.trim() || !formData.email.trim()) {
      toast.error('Preencha todos os campos');
      return;
    }

    setLoading(true);

    try {
      const { data: leadData, error } = await supabase.from('leads').insert({
        imovel_id: imovelId,
        nome: formData.nome.trim(),
        telefone: formData.telefone.trim(),
        email: formData.email.trim(),
        tipo_interesse: formData.tipo_interesse,
        status: 'Aguardando',
      }).select().single();

      if (error) throw error;

      // Enviar webhook para n8n
      try {
        await supabase.functions.invoke('send-lead-webhook', {
          body: {
            lead_id: leadData.id,
            nome: formData.nome.trim(),
            telefone: formData.telefone.trim(),
            imovel_id: imovelId,
          },
        });
      } catch (webhookError) {
        console.error('Erro ao enviar webhook:', webhookError);
        // Não interrompe o fluxo se o webhook falhar
      }

      toast.success('Sua mensagem foi enviada ao corretor!');
      setFormData({
        nome: '',
        telefone: '',
        email: '',
        tipo_interesse: 'Venda',
        termos: false,
      });
    } catch (error: any) {
      toast.error(error.message || 'Erro ao enviar mensagem');
    } finally {
      setLoading(false);
    }
  };

  const handleShare = async () => {
    const url = window.location.href;
    if (navigator.share) {
      try {
        await navigator.share({
          title: `Imóvel ${imovelCodigo}`,
          url: url,
        });
      } catch (err) {
        console.log('Erro ao compartilhar:', err);
      }
    } else {
      navigator.clipboard.writeText(url);
      toast.success('Link copiado para a área de transferência!');
    }
  };

  return (
    <Card className="w-full">
      <CardContent className="p-6 space-y-6">
        {/* Título e Valor */}
        <div className="flex items-center justify-between">
          <h3 className="text-xl font-bold text-foreground">
            {imovelValor ? 'Venda' : 'Consulte'}
          </h3>
          {imovelValor && (
            <p className="text-2xl font-bold text-foreground">
              {new Intl.NumberFormat('pt-BR', {
                style: 'currency',
                currency: 'BRL',
                minimumFractionDigits: 0,
              }).format(imovelValor)}
            </p>
          )}
        </div>

        {/* Contador de visualizações */}
        <div className="flex items-center gap-2 text-sm text-muted-foreground">
          <Eye className="h-4 w-4" />
          <span>{viewCount} pessoas estão olhando este imóvel</span>
        </div>

        {/* Botões Salvar e Compartilhar */}
        <div className="flex gap-4">
          <Button
            variant="ghost"
            className="flex-1 gap-2"
            onClick={() => toast.success('Imóvel salvo!')}
          >
            <Heart className="h-4 w-4" />
            Salvar
          </Button>
          <Button
            variant="ghost"
            className="flex-1 gap-2"
            onClick={handleShare}
          >
            <Share2 className="h-4 w-4" />
            Compartilhar
          </Button>
        </div>

        {/* Formulário */}
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="nome" className="font-semibold">Nome</Label>
            <Input
              id="nome"
              placeholder="Escreva seu nome"
              value={formData.nome}
              onChange={(e) => setFormData({ ...formData, nome: e.target.value })}
              required
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="telefone" className="font-semibold">Telefone</Label>
            <Input
              id="telefone"
              type="tel"
              placeholder="(00) 99999-9999"
              value={formData.telefone}
              onChange={(e) => setFormData({ ...formData, telefone: e.target.value })}
              required
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="email" className="font-semibold">E-mail</Label>
            <Input
              id="email"
              type="email"
              placeholder="email@dominio.com"
              value={formData.email}
              onChange={(e) => setFormData({ ...formData, email: e.target.value })}
              required
            />
          </div>

          {tiposDisponiveis.length > 1 && (
            <div className="space-y-2">
              <Label className="font-semibold">Que tipo de negócio você procura?</Label>
              <div className="flex gap-2">
                {tiposDisponiveis.includes('Venda') && (
                  <Button
                    type="button"
                    variant={formData.tipo_interesse === 'Venda' ? 'default' : 'outline'}
                    className="flex-1"
                    onClick={() => setFormData({ ...formData, tipo_interesse: 'Venda' })}
                  >
                    Venda
                  </Button>
                )}
                {tiposDisponiveis.includes('Locação') && (
                  <Button
                    type="button"
                    variant={formData.tipo_interesse === 'Locação' ? 'default' : 'outline'}
                    className="flex-1"
                    onClick={() => setFormData({ ...formData, tipo_interesse: 'Locação' })}
                  >
                    Locação
                  </Button>
                )}
              </div>
            </div>
          )}

          <div className="flex items-center gap-2">
            <Checkbox
              id="termos"
              checked={formData.termos}
              onCheckedChange={(checked) => 
                setFormData({ ...formData, termos: checked as boolean })
              }
            />
            <Label htmlFor="termos" className="text-sm cursor-pointer">
              Aceito os{' '}
              <a href="#" className="underline hover:text-primary">
                termos de uso
              </a>
              .
            </Label>
          </div>

          <Button
            type="submit"
            className="w-full text-base py-6 font-semibold"
            disabled={loading}
          >
            {loading ? 'Enviando...' : 'Enviar ao corretor'}
          </Button>

          <Button
            type="button"
            variant="outline"
            className="w-full text-base py-6 font-semibold"
            onClick={() => {
              const whatsappMessage = `Olá, gostaria de agendar uma visita ao imóvel ${imovelCodigo}`;
              const whatsappLink = `https://wa.me/554333413000?text=${encodeURIComponent(whatsappMessage)}`;
              window.open(whatsappLink, '_blank');
            }}
          >
            Agendar visita
          </Button>
        </form>
      </CardContent>
    </Card>
  );
};