import { useRef, useEffect } from 'react';
import { useAssistantContext } from '@/contexts/AssistantContext';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card } from '@/components/ui/card';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Bot, User, Send, Mic, MicOff, Sparkles, Loader2 } from 'lucide-react';
import { cn } from '@/lib/utils';

export function AssistantTab() {
    const {
        messages,
        sendMessage,
        isProcessing,
        isListening,
        startListening,
        stopListening,
        transcript,
        resetTranscript
    } = useAssistantContext();

    const scrollRef = useRef<HTMLDivElement>(null);
    const inputRef = useRef<HTMLInputElement>(null);

    // Auto-scroll
    useEffect(() => {
        if (scrollRef.current) {
            scrollRef.current.scrollIntoView({ behavior: 'smooth' });
        }
    }, [messages, isProcessing]);

    // Sync Input
    useEffect(() => {
        if (inputRef.current && transcript) {
            inputRef.current.value = transcript;
        }
    }, [transcript]);

    const handleSubmit = (e?: React.FormEvent) => {
        e?.preventDefault();
        const content = inputRef.current?.value;
        if (content) {
            sendMessage(content);
            if (inputRef.current) inputRef.current.value = '';
            resetTranscript();
        }
    };

    return (
        <div className="space-y-6 max-w-5xl mx-auto h-[calc(100vh-8rem)] flex flex-col">
            <div className="flex items-center gap-3 flex-shrink-0">
                <div className="p-2 rounded-lg bg-gradient-to-br from-indigo-500/20 to-purple-500/20">
                    <Sparkles className="h-6 w-6 text-indigo-500" />
                </div>
                <div>
                    <h1 className="text-3xl font-bold text-foreground">Chat com IA</h1>
                    <p className="text-muted-foreground">Seu assistente virtual inteligente</p>
                </div>
            </div>

            <Card className="flex-1 flex flex-col overflow-hidden border-border/50 shadow-lg bg-background/50 backdrop-blur-sm">
                <ScrollArea className="flex-1 p-6">
                    <div className="space-y-6 max-w-3xl mx-auto pb-4">
                        {messages.length === 0 && (
                            <div className="text-center py-20 opacity-50">
                                <Bot className="h-16 w-16 mx-auto mb-4 text-indigo-300" />
                                <h3 className="text-xl font-medium">Como posso ajudar hoje?</h3>
                                <p className="text-sm">Tente perguntar sobre seus leads ou pedir para criar uma tarefa.</p>
                            </div>
                        )}

                        {messages.map((msg) => (
                            <div
                                key={msg.id}
                                className={cn(
                                    "flex gap-4",
                                    msg.role === 'user' ? "flex-row-reverse" : "flex-row"
                                )}
                            >
                                <div className={cn(
                                    "h-10 w-10 rounded-full flex-shrink-0 flex items-center justify-center shadow-md mt-1",
                                    msg.role === 'user' ? "bg-slate-700 text-white" : "bg-gradient-to-br from-indigo-500 to-purple-600 text-white"
                                )}>
                                    {msg.role === 'user' ? <User className="h-5 w-5" /> : <Bot className="h-5 w-5" />}
                                </div>

                                <div className={cn(
                                    "rounded-2xl px-6 py-4 max-w-[80%] shadow-sm text-base leading-relaxed",
                                    msg.role === 'user'
                                        ? "bg-primary text-primary-foreground rounded-tr-sm"
                                        : "bg-white dark:bg-slate-800 border border-border/50 rounded-tl-sm"
                                )}>
                                    <p className="whitespace-pre-wrap">{msg.content}</p>
                                </div>
                            </div>
                        ))}

                        {isProcessing && (
                            <div className="flex gap-4">
                                <div className="h-10 w-10 rounded-full bg-gradient-to-br from-indigo-500 to-purple-600 flex-shrink-0 flex items-center justify-center text-white mt-1">
                                    <Bot className="h-5 w-5" />
                                </div>
                                <div className="bg-white dark:bg-slate-800 border border-border/50 rounded-2xl rounded-tl-sm px-6 py-4 shadow-sm flex items-center gap-3">
                                    <Loader2 className="h-4 w-4 animate-spin text-muted-foreground" />
                                    <span className="text-sm text-muted-foreground font-medium animate-pulse">Processando...</span>
                                </div>
                            </div>
                        )}

                        <div ref={scrollRef} />
                    </div>
                </ScrollArea>

                <div className="p-4 border-t border-border bg-background/50 backdrop-blur-md">
                    <div className="max-w-3xl mx-auto">
                        <form onSubmit={handleSubmit} className="flex items-center gap-3 bg-background border border-input rounded-full px-4 py-2 shadow-sm focus-within:ring-2 focus-within:ring-ring focus-within:border-transparent transition-all">

                            <Button
                                type="button"
                                size="icon"
                                variant="ghost"
                                className={cn(
                                    "rounded-full h-10 w-10 hover:bg-muted transition-all duration-300",
                                    isListening && "text-red-500 bg-red-50 hover:bg-red-100 animate-pulse"
                                )}
                                onClick={isListening ? stopListening : startListening}
                            >
                                {isListening ? <MicOff className="h-5 w-5" /> : <Mic className="h-5 w-5" />}
                            </Button>

                            <input
                                ref={inputRef}
                                type="text"
                                placeholder={isListening ? "Ouvindo sua voz..." : "Digite sua mensagem..."}
                                className="flex-1 bg-transparent border-none outline-none text-base placeholder:text-muted-foreground h-10"
                                disabled={isProcessing}
                            />

                            <Button
                                type="submit"
                                size="icon"
                                className="rounded-full h-10 w-10 shadow-md hover:scale-105 transition-transform"
                                disabled={isProcessing}
                            >
                                <Send className="h-4 w-4" />
                            </Button>
                        </form>
                        {isListening && (
                            <p className="text-center text-xs text-red-500 mt-2 font-medium animate-pulse">
                                Gravando... Pode falar!
                            </p>
                        )}
                    </div>
                </div>
            </Card>
        </div>
    );
}
