import { useState, useEffect, useRef } from 'react';
import { supabase } from '@/integrations/supabase/client';
import type { Tables } from '@/integrations/supabase/types';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Card } from '@/components/ui/card';
import { Sparkles, Copy, Save, Send, Loader2 } from 'lucide-react';
import { toast } from 'sonner';

type ImovelDB = Tables<'imoveis'>;

interface Message {
  role: 'user' | 'assistant';
  content: string;
}

export const ChatIATab = () => {
  const [imoveis, setImoveis] = useState<ImovelDB[]>([]);
  const [selectedImovelId, setSelectedImovelId] = useState<string>('');
  const [selectedImovel, setSelectedImovel] = useState<ImovelDB | null>(null);
  const [messages, setMessages] = useState<Message[]>([]);
  const [inputMessage, setInputMessage] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    loadImoveis();
  }, []);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  const loadImoveis = async () => {
    try {
      const { data, error } = await supabase
        .from('imoveis')
        .select('*')
        .order('created_at', { ascending: false });

      if (error) throw error;
      setImoveis(data || []);
    } catch (error) {
      console.error('Erro ao carregar imóveis:', error);
      toast.error('Erro ao carregar lista de imóveis');
    }
  };

  const handleImovelSelect = (imovelId: string) => {
    setSelectedImovelId(imovelId);
    const imovel = imoveis.find(i => i.id === imovelId);
    setSelectedImovel(imovel || null);
  };

  const buildPropertyDataMessage = () => {
    if (!selectedImovel) return '';

    const parts = [
      `Gere a descrição para este imóvel:`,
      `\nCódigo: ${selectedImovel.codigo}`,
      `Tipo: ${selectedImovel.tipo}`,
      selectedImovel.valor && `Valor: R$ ${selectedImovel.valor.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}`,
      `Tipo de negócio: ${selectedImovel.tipos_disponiveis?.join(', ') || 'Não especificado'}`,
      selectedImovel.quartos && `Quartos: ${selectedImovel.quartos}`,
      selectedImovel.banheiros && `Banheiros: ${selectedImovel.banheiros}`,
      selectedImovel.area_m2 && `Área: ${selectedImovel.area_m2}m²`,
      selectedImovel.vagas && `Vagas de garagem: ${selectedImovel.vagas}`,
      `\nEndereço: ${selectedImovel.rua}, ${selectedImovel.numero} - ${selectedImovel.bairro}, ${selectedImovel.cidade}/${selectedImovel.estado}`,
    ].filter(Boolean);

    return parts.join('\n');
  };

  const sendMessage = async (messageText?: string) => {
    const textToSend = messageText || inputMessage.trim();
    if (!textToSend || isLoading) return;

    const userMessage: Message = { role: 'user', content: textToSend };
    setMessages(prev => [...prev, userMessage]);
    setInputMessage('');
    setIsLoading(true);

    try {
      const { data: { session } } = await supabase.auth.getSession();
      
      const response = await fetch(
        `${import.meta.env.VITE_SUPABASE_URL}/functions/v1/generate-property-description`,
        {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${session?.access_token}`,
          },
          body: JSON.stringify({
            messages: [...messages, userMessage].map(m => ({ role: m.role, content: m.content })),
          }),
        }
      );

      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }

      const reader = response.body?.getReader();
      const decoder = new TextDecoder();
      let assistantMessage = '';

      // Add empty assistant message that will be updated
      setMessages(prev => [...prev, { role: 'assistant', content: '' }]);

      if (reader) {
        while (true) {
          const { done, value } = await reader.read();
          if (done) break;

          const chunk = decoder.decode(value);
          const lines = chunk.split('\n').filter(line => line.trim() !== '');

          for (const line of lines) {
            if (line.startsWith('data: ')) {
              const data = line.slice(6);
              if (data === '[DONE]') continue;

              try {
                const parsed = JSON.parse(data);
                const content = parsed.choices?.[0]?.delta?.content;
                if (content) {
                  assistantMessage += content;
                  setMessages(prev => {
                    const newMessages = [...prev];
                    newMessages[newMessages.length - 1] = {
                      role: 'assistant',
                      content: assistantMessage,
                    };
                    return newMessages;
                  });
                }
              } catch (e) {
                console.error('Error parsing chunk:', e);
              }
            }
          }
        }
      }
    } catch (error) {
      console.error('Erro ao enviar mensagem:', error);
      toast.error('Erro ao gerar descrição');
      // Remove the empty assistant message on error
      setMessages(prev => prev.slice(0, -1));
    } finally {
      setIsLoading(false);
    }
  };

  const handleGenerateDescription = () => {
    if (!selectedImovel) {
      toast.error('Selecione um imóvel primeiro');
      return;
    }
    const propertyData = buildPropertyDataMessage();
    sendMessage(propertyData);
  };

  const extractSEOVersion = (content: string) => {
    const seoMatch = content.match(/\*\*📱 VERSÃO SEO.*?\*\*([\s\S]*?)(?=\*\*📣|$)/i);
    return seoMatch ? seoMatch[1].trim() : content;
  };

  const extractSocialVersion = (content: string) => {
    const socialMatch = content.match(/\*\*📣 VERSÃO.*?\*\*([\s\S]*?)$/i);
    return socialMatch ? socialMatch[1].trim() : '';
  };

  const copyToClipboard = (text: string, label: string) => {
    navigator.clipboard.writeText(text);
    toast.success(`${label} copiada!`);
  };

  const saveDescriptionToProperty = async (description: string) => {
    if (!selectedImovel) return;

    try {
      const { error } = await supabase
        .from('imoveis')
        .update({ descricao: description })
        .eq('id', selectedImovel.id);

      if (error) throw error;
      toast.success('Descrição salva no imóvel!');
      setSelectedImovel({ ...selectedImovel, descricao: description });
    } catch (error) {
      console.error('Erro ao salvar descrição:', error);
      toast.error('Erro ao salvar descrição');
    }
  };

  return (
    <div className="space-y-6 max-w-5xl mx-auto">
      <div className="flex items-center gap-3">
        <div className="p-2 rounded-lg bg-gradient-to-br from-primary/20 to-accent/20">
          <Sparkles className="h-6 w-6 text-primary" />
        </div>
        <div>
          <h1 className="text-3xl font-bold text-foreground">Chat com IA</h1>
          <p className="text-muted-foreground">Gerador de Descrições de Imóveis</p>
        </div>
      </div>

      {/* Property Selector */}
      <Card className="p-4">
        <label className="text-sm font-medium text-foreground mb-2 block">
          Selecionar Imóvel
        </label>
        <Select value={selectedImovelId} onValueChange={handleImovelSelect}>
          <SelectTrigger>
            <SelectValue placeholder="Escolha um imóvel..." />
          </SelectTrigger>
          <SelectContent>
            {imoveis.map(imovel => (
              <SelectItem key={imovel.id} value={imovel.id}>
                {imovel.codigo} - {imovel.tipo} - {imovel.endereco}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>

        {selectedImovel && (
          <div className="mt-4 p-3 bg-muted/50 rounded-lg border border-border">
            <div className="text-sm space-y-1">
              <p className="font-semibold text-foreground">
                📍 {selectedImovel.codigo} - {selectedImovel.tipo} em {selectedImovel.cidade}
              </p>
              <p className="text-muted-foreground">
                {selectedImovel.valor && `R$ ${selectedImovel.valor.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}`}
                {selectedImovel.quartos && ` | ${selectedImovel.quartos} quartos`}
                {selectedImovel.banheiros && ` | ${selectedImovel.banheiros} banheiros`}
                {selectedImovel.area_m2 && ` | ${selectedImovel.area_m2}m²`}
              </p>
              <p className="text-muted-foreground text-xs">
                {selectedImovel.rua}, {selectedImovel.numero} - {selectedImovel.bairro}
              </p>
              {selectedImovel.tipos_disponiveis && (
                <p className="text-muted-foreground text-xs">
                  {selectedImovel.tipos_disponiveis.join(' | ')}
                </p>
              )}
            </div>
            <Button 
              onClick={handleGenerateDescription} 
              className="mt-3 w-full"
              disabled={isLoading}
            >
              {isLoading ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Gerando...
                </>
              ) : (
                <>
                  <Sparkles className="mr-2 h-4 w-4" />
                  Gerar Descrição
                </>
              )}
            </Button>
          </div>
        )}
      </Card>

      {/* Chat Messages */}
      <Card className="p-6 space-y-4 min-h-[400px] max-h-[600px] overflow-y-auto">
        {messages.length === 0 ? (
          <div className="text-center text-muted-foreground py-12">
            <Sparkles className="h-12 w-12 mx-auto mb-3 opacity-50" />
            <p>Selecione um imóvel e clique em "Gerar Descrição" para começar</p>
          </div>
        ) : (
          messages.map((message, index) => (
            <div
              key={index}
              className={`flex gap-3 ${message.role === 'user' ? 'justify-end' : 'justify-start'}`}
            >
              <div
                className={`max-w-[80%] rounded-lg p-4 ${
                  message.role === 'user'
                    ? 'bg-primary text-primary-foreground'
                    : 'bg-muted text-foreground'
                }`}
              >
                <div className="flex items-center gap-2 mb-2">
                  <span className="text-xs font-semibold">
                    {message.role === 'user' ? '👤 Você' : '🤖 IA'}
                  </span>
                </div>
                <div className="text-sm whitespace-pre-wrap">{message.content}</div>
                
                {message.role === 'assistant' && message.content && (
                  <div className="flex gap-2 mt-3 pt-3 border-t border-border">
                    <Button
                      size="sm"
                      variant="outline"
                      onClick={() => copyToClipboard(extractSEOVersion(message.content), 'Versão SEO')}
                    >
                      <Copy className="h-3 w-3 mr-1" />
                      Copiar SEO
                    </Button>
                    {extractSocialVersion(message.content) && (
                      <Button
                        size="sm"
                        variant="outline"
                        onClick={() => copyToClipboard(extractSocialVersion(message.content), 'Versão Social')}
                      >
                        <Copy className="h-3 w-3 mr-1" />
                        Copiar Social
                      </Button>
                    )}
                    {selectedImovel && (
                      <Button
                        size="sm"
                        variant="outline"
                        onClick={() => saveDescriptionToProperty(extractSEOVersion(message.content))}
                      >
                        <Save className="h-3 w-3 mr-1" />
                        Salvar
                      </Button>
                    )}
                  </div>
                )}
              </div>
            </div>
          ))
        )}
        <div ref={messagesEndRef} />
      </Card>

      {/* Input Area */}
      <Card className="p-4">
        <div className="flex gap-2">
          <Textarea
            placeholder="Adicione instruções adicionais ou peça ajustes..."
            value={inputMessage}
            onChange={(e) => setInputMessage(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === 'Enter' && !e.shiftKey) {
                e.preventDefault();
                sendMessage();
              }
            }}
            className="min-h-[60px]"
            disabled={isLoading}
          />
          <Button
            onClick={() => sendMessage()}
            disabled={!inputMessage.trim() || isLoading}
            size="lg"
          >
            <Send className="h-4 w-4" />
          </Button>
        </div>
      </Card>
    </div>
  );
};
