import React from 'react';
import { AlertTriangle, X } from 'lucide-react';

interface ConfirmModalProps {
    isOpen: boolean;
    onClose: () => void;
    onConfirm: () => void;
    title: string;
    message: React.ReactNode;
    confirmText?: string;
    cancelText?: string;
    variant?: 'danger' | 'primary';
}

const ConfirmModal: React.FC<ConfirmModalProps> = ({
    isOpen,
    onClose,
    onConfirm,
    title,
    message,
    confirmText = 'Confirmar',
    cancelText = 'Cancelar',
    variant = 'danger'
}) => {
    if (!isOpen) return null;

    return (
        <div className="fixed inset-0 z-[60] flex items-center justify-center bg-slate-900/60 backdrop-blur-sm p-4 animate-in fade-in duration-200">
            <div className="bg-white dark:bg-dark-card border border-slate-200 dark:border-white/10 rounded-2xl shadow-2xl w-full max-w-sm overflow-hidden animate-in zoom-in-95 duration-200">
                <div className="p-6 text-center">
                    <div className={`w-12 h-12 rounded-full flex items-center justify-center mx-auto mb-4 ${variant === 'danger'
                            ? 'bg-red-100 text-red-600 dark:bg-red-900/20 dark:text-red-400'
                            : 'bg-primary-100 text-primary-600 dark:bg-primary-900/20 dark:text-primary-400'
                        }`}>
                        <AlertTriangle size={24} />
                    </div>

                    <h3 className="text-lg font-bold text-slate-900 dark:text-white mb-2 font-display">
                        {title}
                    </h3>

                    <div className="text-sm text-slate-500 dark:text-slate-400 mb-6">
                        {message}
                    </div>

                    <div className="flex gap-3 justify-center">
                        <button
                            onClick={onClose}
                            className="px-4 py-2 rounded-lg text-sm font-medium text-slate-700 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-white/5 transition-colors"
                        >
                            {cancelText}
                        </button>
                        <button
                            onClick={() => {
                                onConfirm();
                                onClose();
                            }}
                            className={`px-4 py-2 rounded-lg text-sm font-bold text-white shadow-lg transition-all ${variant === 'danger'
                                    ? 'bg-red-600 hover:bg-red-500 shadow-red-600/20'
                                    : 'bg-primary-600 hover:bg-primary-500 shadow-primary-600/20'
                                }`}
                        >
                            {confirmText}
                        </button>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default ConfirmModal;
