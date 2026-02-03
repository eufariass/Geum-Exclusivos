import React, { createContext, useContext, ReactNode } from 'react';
import { useAssistant as useAssistantLogic } from '@/components/assistant/useAssistant';

type AssistantContextType = ReturnType<typeof useAssistantLogic>;

const AssistantContext = createContext<AssistantContextType | null>(null);

export function AssistantProvider({ children }: { children: ReactNode }) {
    const assistant = useAssistantLogic();

    return (
        <AssistantContext.Provider value={assistant}>
            {children}
        </AssistantContext.Provider>
    );
}

export function useAssistantContext() {
    const context = useContext(AssistantContext);
    if (!context) {
        throw new Error('useAssistantContext must be used within an AssistantProvider');
    }
    return context;
}
