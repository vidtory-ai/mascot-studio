import React, { useEffect } from 'react';
import { CheckCircle2, AlertCircle, Info, X } from 'lucide-react';
import { ToastMessage } from '../types';

interface ToastProps {
  toasts: ToastMessage[];
  removeToast: (id: string) => void;
}

export const ToastContainer: React.FC<ToastProps> = ({ toasts, removeToast }) => {
  return (
    <div className="fixed bottom-6 right-6 z-50 flex flex-col gap-3">
      {toasts.map((toast) => (
        <ToastItem key={toast.id} toast={toast} onRemove={() => removeToast(toast.id)} />
      ))}
    </div>
  );
};

const ToastItem: React.FC<{ toast: ToastMessage; onRemove: () => void }> = ({ toast, onRemove }) => {
  useEffect(() => {
    const timer = setTimeout(() => {
      onRemove();
    }, 4000);
    return () => clearTimeout(timer);
  }, [onRemove]);

  const styles = {
    success: 'bg-nexus-800 border-green-500/50 text-green-200',
    error: 'bg-nexus-800 border-red-500/50 text-red-200',
    info: 'bg-nexus-800 border-blue-500/50 text-blue-200',
  };

  const icons = {
    success: <CheckCircle2 size={18} className="text-green-500" />,
    error: <AlertCircle size={18} className="text-red-500" />,
    info: <Info size={18} className="text-blue-500" />,
  };

  return (
    <div className={`flex items-center gap-3 px-4 py-3 rounded-lg border shadow-xl backdrop-blur-md min-w-[300px] animate-slide-up ${styles[toast.type]}`}>
      {icons[toast.type]}
      <p className="text-sm font-medium flex-1">{toast.message}</p>
      <button onClick={onRemove} className="opacity-50 hover:opacity-100 transition-opacity">
        <X size={14} />
      </button>
    </div>
  );
};