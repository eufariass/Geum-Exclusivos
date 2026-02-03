import { useRef, useEffect } from 'react';
import { useAssistant } from './useAssistant';
import { X, Send, Mic, MicOff, Bot, User, Loader2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { ScrollArea } from '@/components/ui/scroll-area';
import { cn } from '@/lib/utils';
import ReactMarkdown from 'react-markdown'; // Optional: for rich formatting

interface AssistantDialogProps {
    assistant: ReturnType<typeof useAssistant>;
}

export function AssistantDialog({ assistant }: AssistantDialogProps) {
    const {
        isOpen,
        toggleOpen,
        messages,
        sendMessage,
        isProcessing,
        isListening,
        startListening,
        stopListening,
        transcript,
        resetTranscript
    } = assistant;

    const scrollRef = useRef<HTMLDivElement>(null);
    const inputRef = useRef<HTMLInputElement>(null);

    // Auto-scroll to bottom
    useEffect(() => {
        if (scrollRef.current) {
            scrollRef.current.scrollIntoView({ behavior: 'smooth' });
        }
    }, [messages, isProcessing]);

    // Update input with transcript
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

    if (!isOpen) return null;

    return (
        <div className="fixed bottom-24 right-6 z-50 w-[90vw] md:w-[400px] h-[600px] max-h-[80vh] bg-background border border-border rounded-2xl shadow-2xl flex flex-col overflow-hidden animate-in slide-in-from-bottom-10 fade-in duration-300">
            {/* Header */}
            <div className="p-4 border-b border-border bg-muted/40 flex items-center justify-between">
                <div className="flex items-center gap-3">
                    <div className="h-10 w-10 rounded-full bg-gradient-to-tr from-indigo-500 to-purple-500 flex items-center justify-center text-white shadow-md">
                        <Bot className="h-6 w-6" />
                    </div>
                    <div>
                        <h3 className="font-bold text-foreground">Assistente Geum</h3>
                        <p className="text-xs text-muted-foreground flex items-center gap-1">
                            <span className="h-2 w-2 rounded-full bg-emerald-500 animate-pulse" />
                            Online
                        </p>
                    </div>
                </div>
                <Button variant="ghost" size="icon" onClick={toggleOpen} className="rounded-full hover:bg-destructive/10 hover:text-destructive">
                    <X className="h-5 w-5" />
                </Button>
            </div>

            {/* Messages */}
            <ScrollArea className="flex-grow p-4 bg-slate-50/50 dark:bg-slate-900/20">
                <div className="space-y-4 flex flex-col pb-4">
                    {/* Welcome Message */}
                    {messages.length === 0 && (
                        <div className="bg-muted/50 rounded-xl p-4 text-sm text-muted-foreground text-center my-8">
                            <Bot className="h-8 w-8 mx-auto mb-2 opacity-50" />
                            <p>Olá! Sou sua inteligência artificial. Como posso ajudar com os leads hoje?</p>
                        </div>
                    )}

                    {messages.map((msg) => (
                        <div
                            key={msg.id}
                            className={cn(
                                "flex gap-3 max-w-[85%]",
                                msg.role === 'user' ? "self-end flex-row-reverse" : "self-start"
                            )}
                        >
                            <div className={cn(
                                "h-8 w-8 rounded-full flex-shrink-0 flex items-center justify-center text-xs text-white shadow-sm mt-1",
                                msg.role === 'user' ? "bg-slate-700" : "bg-indigo-500"
                            )}>
                                {msg.role === 'user' ? <User className="h-4 w-4" /> : <Bot className="h-4 w-4" />}
                            </div>

                            <div className={cn(
                                "rounded-2xl px-4 py-2.5 text-sm shadow-sm",
                                msg.role === 'user'
                                    ? "bg-primary text-primary-foreground rounded-tr-sm"
                                    : "bg-white dark:bg-slate-800 border border-border rounded-tl-sm text-foreground"
                            )}>
                                {/* Simple rendering for now, could enable markdown */}
                                <p className="whitespace-pre-wrap leading-relaxed">{msg.content}</p>
                            </div>
                        </div>
                    ))}

                    {isProcessing && (
                        <div className="flex gap-3 self-start max-w-[85%]">
                            <div className="h-8 w-8 rounded-full bg-indigo-500 flex-shrink-0 flex items-center justify-center text-white mt-1">
                                <Bot className="h-4 w-4" />
                            </div>
                            <div className="bg-white dark:bg-slate-800 border border-border rounded-2xl rounded-tl-sm px-4 py-3 shadow-sm flex items-center gap-2">
                                <Loader2 className="h-4 w-4 animate-spin text-muted-foreground" />
                                <span className="text-xs text-muted-foreground font-medium animate-pulse">Pensando...</span>
                            </div>
                        </div>
                    )}

                    <div ref={scrollRef} />
                </div>
            </ScrollArea>

            {/* Input Area */}
            <div className="p-4 border-t border-border bg-background">
                <form onSubmit={handleSubmit} className="flex items-end gap-2">
                    <div className="relative flex-grow">
                        <Input
                            ref={inputRef}
                            placeholder={isListening ? "Ouvindo..." : "Escreva sua mensagem..."}
                            className={cn(
                                "pr-10 transition-all duration-300",
                                isListening && "border-red-500 ring-1 ring-red-500 bg-red-50/50"
                            )}
                            disabled={isProcessing}
                        />
                        <Button
                            type="button"
                            size="icon"
                            variant="ghost"
                            className={cn(
                                "absolute right-1 top-1/2 -translate-y-1/2 h-8 w-8 text-muted-foreground hover:text-foreground transition-all",
                                isListening && "text-red-500 hover:text-red-600 scale-110 animate-pulse bg-red-100 dark:bg-red-900/30"
                            )}
                            onClick={isListening ? stopListening : startListening}
                        >
                            {isListening ? <MicOff className="h-4 w-4" /> : <Mic className="h-4 w-4" />}
                        </Button>
                    </div>

                    <Button
                        type="submit"
                        size="icon"
                        disabled={isProcessing || (!inputRef.current?.value && !transcript)}
                        className="flex-shrink-0 h-10 w-10 rounded-full shadow-md"
                    >
                        <Send className="h-4 w-4" />
                    </Button>
                </form>
                {isListening && (
                    <p className="text-center text-xs text-red-500 mt-2 font-medium animate-pulse">
                        • Gravando... Fale agora.
                    </p>
                )}
            </div>
        </div>
    );
}
