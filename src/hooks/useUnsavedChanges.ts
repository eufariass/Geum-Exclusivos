import { useEffect, useRef, useState } from 'react';
import { TOAST_MESSAGES } from '@/lib/constants';

interface UseUnsavedChangesOptions {
  enabled?: boolean;
  message?: string;
}

/**
 * Hook to warn users about unsaved changes
 * @param hasUnsavedChanges - Whether there are unsaved changes
 * @param options - Configuration options
 */
export function useUnsavedChanges(
  hasUnsavedChanges: boolean,
  options: UseUnsavedChangesOptions = {}
) {
  const {
    enabled = true,
    message = TOAST_MESSAGES.WARNING.UNSAVED_CHANGES,
  } = options;

  const [showWarning, setShowWarning] = useState(false);
  const messageRef = useRef(message);

  useEffect(() => {
    messageRef.current = message;
  }, [message]);

  useEffect(() => {
    if (!enabled || !hasUnsavedChanges) {
      return;
    }

    // Warn before page unload
    const handleBeforeUnload = (e: BeforeUnloadEvent) => {
      e.preventDefault();
      e.returnValue = messageRef.current;
      return messageRef.current;
    };

    window.addEventListener('beforeunload', handleBeforeUnload);

    return () => {
      window.removeEventListener('beforeunload', handleBeforeUnload);
    };
  }, [enabled, hasUnsavedChanges]);

  const confirmNavigation = () => {
    if (hasUnsavedChanges && enabled) {
      return window.confirm(message);
    }
    return true;
  };

  return {
    showWarning,
    setShowWarning,
    confirmNavigation,
  };
}
