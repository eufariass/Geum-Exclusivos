import { Bot, MessageSquare } from 'lucide-react';
import { cn } from '@/lib/utils'; // Assuming standard shadcn utils path

interface AssistantFabProps {
    onClick: () => void;
    isOpen: boolean;
}

export function AssistantFab({ onClick, isOpen }: AssistantFabProps) {
    return (
        <button
            onClick={onClick}
            className={cn(
                "fixed bottom-6 right-6 z-50 h-14 w-14 rounded-full shadow-2xl flex items-center justify-center transition-all duration-300 hover:scale-110 active:scale-95 group",
                isOpen
                    ? "bg-destructive text-white rotate-90"
                    : "bg-gradient-to-br from-indigo-500 to-purple-600 text-white"
            )}
            aria-label="Geum Assistant"
        >
            {isOpen ? (
                <MessageSquare className="h-6 w-6" /> // Or 'X' to close
            ) : (
                <Bot className="h-7 w-7 animate-pulse group-hover:animate-none" />
            )}

            {/* Ping effect when closed */}
            {!isOpen && (
                <span className="absolute -top-1 -right-1 flex h-3 w-3">
                    <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-sky-400 opacity-75"></span>
                    <span className="relative inline-flex rounded-full h-3 w-3 bg-sky-500"></span>
                </span>
            )}
        </button>
    );
}
