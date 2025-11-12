import { useEffect, useState } from 'react';
import { cn } from '@/lib/utils';

export interface ToastProps {
  message: string;
  type: 'success' | 'error';
  duration?: number;
  onClose: () => void;
}

export const Toast = ({ message, type, duration = 3000, onClose }: ToastProps) => {
  const [isVisible, setIsVisible] = useState(true);

  useEffect(() => {
    const timer = setTimeout(() => {
      setIsVisible(false);
      setTimeout(onClose, 300);
    }, duration);

    return () => clearTimeout(timer);
  }, [duration, onClose]);

  return (
    <div
      className={cn(
        'fixed top-4 right-4 z-50 p-4 rounded-lg shadow-lg transition-all duration-300',
        'min-w-[300px] max-w-md',
        isVisible ? 'opacity-100 translate-y-0' : 'opacity-0 -translate-y-2',
        type === 'success' ? 'bg-success text-success-foreground' : 'bg-destructive text-destructive-foreground'
      )}
    >
      <div className="flex items-start gap-3">
        <span className="text-xl">{type === 'success' ? '✓' : '✕'}</span>
        <p className="flex-1 text-sm font-medium">{message}</p>
      </div>
    </div>
  );
};

export const useToastManager = () => {
  const [toasts, setToasts] = useState<Array<{ id: string; message: string; type: 'success' | 'error' }>>([]);

  const showToast = (message: string, type: 'success' | 'error') => {
    const id = Math.random().toString(36).substring(7);
    setToasts((prev) => [...prev, { id, message, type }]);
  };

  const removeToast = (id: string) => {
    setToasts((prev) => prev.filter((t) => t.id !== id));
  };

  const ToastContainer = () => (
    <>
      {toasts.map((toast) => (
        <Toast key={toast.id} message={toast.message} type={toast.type} onClose={() => removeToast(toast.id)} />
      ))}
    </>
  );

  return { showToast, ToastContainer };
};
