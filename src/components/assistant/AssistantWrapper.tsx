import { useAssistantContext } from '@/contexts/AssistantContext';
import { AssistantFab } from './AssistantFab';
import { AssistantDialog } from './AssistantDialog';

export function AssistantWrapper() {
    const assistant = useAssistantContext();

    // Conditionally render only if browser supports speech or just always render (text fallback)
    // Fab handles opening

    return (
        <>
            <AssistantFab onClick={assistant.toggleOpen} isOpen={assistant.isOpen} />
            <AssistantDialog assistant={assistant} />
        </>
    );
}
