import { useAssistant } from './useAssistant';
import { AssistantFab } from './AssistantFab';
import { AssistantDialog } from './AssistantDialog';

export function AssistantWrapper() {
    const assistant = useAssistant();

    // Conditionally render only if browser supports speech or just always render (text fallback)
    // Fab handles opening

    return (
        <>
            <AssistantFab onClick={assistant.toggleOpen} isOpen={assistant.isOpen} />
            <AssistantDialog assistant={assistant} />
        </>
    );
}
