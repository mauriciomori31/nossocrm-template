/**
 * Reusable Modal component with consistent styling
 */
import React from 'react';
import { X } from 'lucide-react';
import { cn } from '@/utils/cn';

interface ModalProps {
  isOpen: boolean;
  onClose: () => void;
  title: string;
  children: React.ReactNode;
  size?: 'sm' | 'md' | 'lg' | 'xl';
}

const sizeClasses = {
  sm: 'max-w-sm',
  md: 'max-w-md',
  lg: 'max-w-lg',
  xl: 'max-w-xl',
};

export const Modal: React.FC<ModalProps> = ({ isOpen, onClose, title, children, size = 'md' }) => {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/60 backdrop-blur-sm p-4">
      <div
        className={cn(
          'bg-white dark:bg-dark-card',
          'border border-slate-200 dark:border-white/10',
          'rounded-2xl shadow-2xl w-full',
          'animate-in zoom-in-95 duration-200',
          sizeClasses[size]
        )}
      >
        <div className="p-5 border-b border-slate-200 dark:border-white/10 flex justify-between items-center">
          <h2 className="text-lg font-bold text-slate-900 dark:text-white font-display">{title}</h2>
          <button
            onClick={onClose}
            className="text-slate-400 hover:text-slate-600 dark:hover:text-white transition-colors"
          >
            <X size={20} />
          </button>
        </div>
        <div className="p-5">{children}</div>
      </div>
    </div>
  );
};

// ============ MODAL FORM WRAPPER ============

interface ModalFormProps extends React.FormHTMLAttributes<HTMLFormElement> {
  children: React.ReactNode;
}

export const ModalForm: React.FC<ModalFormProps> = ({ children, className, ...props }) => (
  <form className={cn('space-y-4', className)} {...props}>
    {children}
  </form>
);
