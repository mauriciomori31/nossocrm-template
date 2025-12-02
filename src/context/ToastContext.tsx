import React, { createContext, useContext, useState, useCallback, ReactNode } from 'react';
import { X, CheckCircle, AlertCircle, Info } from 'lucide-react';

export type ToastType = 'success' | 'error' | 'info' | 'warning';

export interface Toast {
    id: string;
    message: string;
    type: ToastType;
}

interface ToastContextType {
    addToast: (message: string, type?: ToastType) => void;
    removeToast: (id: string) => void;
}

const ToastContext = createContext<ToastContextType | undefined>(undefined);

export const ToastProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
    const [toasts, setToasts] = useState<Toast[]>([]);

    const addToast = useCallback((message: string, type: ToastType = 'info') => {
        const id = Math.random().toString(36).substr(2, 9);
        setToasts((prev) => [...prev, { id, message, type }]);

        // Auto remove after 3 seconds
        setTimeout(() => {
            removeToast(id);
        }, 3000);
    }, []);

    const removeToast = useCallback((id: string) => {
        setToasts((prev) => prev.filter((toast) => toast.id !== id));
    }, []);

    return (
        <ToastContext.Provider value={{ addToast, removeToast }}>
            {children}
            <div className="fixed bottom-4 right-4 z-50 flex flex-col gap-2">
                {toasts.map((toast) => (
                    <div
                        key={toast.id}
                        className={`flex items-center gap-3 px-4 py-3 rounded-lg shadow-lg border transition-all animate-in slide-in-from-right-full duration-300 ${toast.type === 'success' ? 'bg-white dark:bg-slate-800 border-green-500 text-green-600 dark:text-green-400' :
                                toast.type === 'error' ? 'bg-white dark:bg-slate-800 border-red-500 text-red-600 dark:text-red-400' :
                                    toast.type === 'warning' ? 'bg-white dark:bg-slate-800 border-yellow-500 text-yellow-600 dark:text-yellow-400' :
                                        'bg-white dark:bg-slate-800 border-blue-500 text-blue-600 dark:text-blue-400'
                            }`}
                    >
                        {toast.type === 'success' && <CheckCircle size={18} />}
                        {toast.type === 'error' && <AlertCircle size={18} />}
                        {toast.type === 'warning' && <AlertCircle size={18} />}
                        {toast.type === 'info' && <Info size={18} />}
                        <span className="text-sm font-medium text-slate-900 dark:text-white">{toast.message}</span>
                        <button onClick={() => removeToast(toast.id)} className="text-slate-400 hover:text-slate-600 dark:hover:text-slate-200">
                            <X size={14} />
                        </button>
                    </div>
                ))}
            </div>
        </ToastContext.Provider>
    );
};

export const useToast = () => {
    const context = useContext(ToastContext);
    if (context === undefined) {
        throw new Error('useToast must be used within a ToastProvider');
    }
    // Alias for compatibility
    return {
        ...context,
        showToast: context.addToast
    };
};
