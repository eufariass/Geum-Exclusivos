import { useState, useCallback, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import SpeechRecognition, { useSpeechRecognition } from 'react-speech-recognition';
import { toast } from 'sonner';

export type AssistantMessage = {
    id: string;
    role: 'user' | 'assistant';
    content: string;
    timestamp: Date;
};

export function useAssistant() {
    const [isOpen, setIsOpen] = useState(false);
    const [messages, setMessages] = useState<AssistantMessage[]>([]);
    const [isProcessing, setIsProcessing] = useState(false);
    const [isListening, setIsListening] = useState(false);

    // Speech Recognition
    const {
        transcript,
        listening,
        resetTranscript,
        browserSupportsSpeechRecognition
    } = useSpeechRecognition();

    // Sync listening state
    useEffect(() => {
        setIsListening(listening);
    }, [listening]);

    const toggleOpen = () => setIsOpen(prev => !prev);

    const sendMessage = async (content: string) => {
        if (!content.trim()) return;

        console.log('[Assistant] Sending message:', content);

        // Add User Message
        const userMsg: AssistantMessage = {
            id: crypto.randomUUID(),
            role: 'user',
            content: content,
            timestamp: new Date()
        };
        setMessages(prev => [...prev, userMsg]);
        setIsProcessing(true);

        try {
            // Prepare history for API
            const apiMessages = [
                ...messages.map(m => ({ role: m.role, content: m.content })),
                { role: 'user', content }
            ].slice(-10); // Lookback window

            console.log('[Assistant] Calling Edge Function ai-assistant with:', apiMessages);

            const { data, error } = await supabase.functions.invoke('ai-assistant', {
                body: { messages: apiMessages }
            });

            if (error) {
                console.error('[Assistant] Supabase Function Error:', error);

                // Handle specific startup errors (like missing keys)
                if (error instanceof Error && error.message.includes('OPENAI_API_KEY_MISSING')) {
                    toast.error('Chave da OpenAI não configurada!', {
                        description: 'Peça para um administrador configurar o segredo OPENAI_API_KEY no Supabase.'
                    });
                    // Add system message
                    setMessages(prev => [...prev, {
                        id: crypto.randomUUID(),
                        role: 'assistant',
                        content: '🚫 **Erro de Configuração:** Não encontrei a chave da OpenAI. Por favor, configure-a nas "Edge Function Secrets" do Supabase.',
                        timestamp: new Date()
                    }]);
                    return;
                }
                throw error;
            }

            console.log('[Assistant] API Response:', data);

            // If the function returned a specific error payload (captured in catch block inside function)
            if (data && data.error === 'OPENAI_API_KEY_MISSING') {
                toast.error('Chave da OpenAI ausente!');
                setMessages(prev => [...prev, {
                    id: crypto.randomUUID(),
                    role: 'assistant',
                    content: '🚫 **Erro:** Chave da OpenAI não configurada no servidor.',
                    timestamp: new Date()
                }]);
                return;
            }

            if (data && data.error) {
                console.error('[Assistant] API Business Error:', data.error);
                throw new Error(data.error);
            }

            const aiResponse = data?.choices?.[0]?.message?.content;

            if (aiResponse) {
                setMessages(prev => [...prev, {
                    id: crypto.randomUUID(),
                    role: 'assistant',
                    content: aiResponse,
                    timestamp: new Date()
                }]);
            } else {
                console.error('[Assistant] No AI response content found in data', data);
                throw new Error('No response from AI');
            }

        } catch (error) {
            console.error('[Assistant] Final Catch Error:', error);
            toast.error('Erro ao processar sua solicitação: ' + (error instanceof Error ? error.message : String(error)));
            setMessages(prev => [...prev, {
                id: crypto.randomUUID(),
                role: 'assistant',
                content: 'Desculpe, tive um problema ao processar seu pedido. Tente novamente.',
                timestamp: new Date()
            }]);
        } finally {
            setIsProcessing(false);
        }
    };

    const startListening = () => {
        console.log('[Assistant] Starting listening...');
        if (!browserSupportsSpeechRecognition) {
            console.error('[Assistant] Browser does NOT support speech recognition');
            toast.error('Seu navegador não suporta reconhecimento de voz.');
            return;
        }
        resetTranscript();
        SpeechRecognition.startListening({ continuous: false, language: 'pt-BR' })
            .catch(err => {
                console.error('[Assistant] Failed to start listening:', err);
                toast.error('Erro ao iniciar microfone: ' + err.message);
            });
    };

    const stopListening = () => {
        SpeechRecognition.stopListening();
    };

    // Auto-send when silence/stop (optional, maybe manual send is better for now to edit)
    // For now, let's keep it manual send or we can implement a "send on stop" logic if user prefers.

    return {
        isOpen,
        toggleOpen,
        messages,
        sendMessage,
        isProcessing,
        isListening,
        startListening,
        stopListening,
        transcript,
        browserSupportsSpeechRecognition,
        resetTranscript
    };
}
