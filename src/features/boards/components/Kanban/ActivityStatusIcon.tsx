import React from 'react';
import { Phone, Mail, Calendar, ChevronRight, AlertTriangle } from 'lucide-react';

interface ActivityStatusIconProps {
    status: string;
    type?: string;
    dealId?: string;
    dealTitle?: string;
    isOpen: boolean;
    onToggle: (e: React.MouseEvent) => void;
    onQuickAdd: (type: 'CALL' | 'MEETING' | 'EMAIL') => void;
}

export const ActivityStatusIcon: React.FC<ActivityStatusIconProps> = ({
    status,
    type,
    dealId,
    dealTitle,
    isOpen,
    onToggle,
    onQuickAdd
}) => {
    const Icon = type === 'CALL' ? Phone : type === 'EMAIL' ? Mail : type === 'MEETING' ? Calendar : ChevronRight;

    let content;
    switch (status) {
        case 'yellow':
            content = (
                <div title="Atenção: Sem atividade agendada" className="text-yellow-500">
                    <AlertTriangle size={18} fill="currentColor" className="text-yellow-500/20" />
                </div>
            );
            break;
        case 'red':
            content = (
                <div title="Atividade Atrasada" className="w-5 h-5 rounded-full bg-red-500 flex items-center justify-center text-white shadow-sm ring-1 ring-white dark:ring-dark-card">
                    <Icon size={10} strokeWidth={3} />
                </div>
            );
            break;
        case 'green':
            content = (
                <div title="Para Hoje" className="w-5 h-5 rounded-full bg-green-500 flex items-center justify-center text-white shadow-sm ring-1 ring-white dark:ring-dark-card">
                    <Icon size={10} strokeWidth={3} />
                </div>
            );
            break;
        default:
            content = (
                <div title="Futuro" className="w-5 h-5 rounded-full bg-slate-300 dark:bg-slate-600 flex items-center justify-center text-white ring-1 ring-white dark:ring-dark-card">
                    <Icon size={10} strokeWidth={3} />
                </div>
            );
    }

    return (
        <div className="relative">
            <button onClick={onToggle} className="hover:scale-110 transition-transform cursor-pointer p-1 -m-1">
                {content}
            </button>

            {isOpen && dealId && (
                <div
                    className="absolute bottom-full right-0 mb-2 w-48 bg-white dark:bg-slate-800 rounded-lg shadow-xl border border-slate-200 dark:border-white/10 z-50 overflow-hidden animate-in zoom-in-95 duration-100"
                    onClick={(e) => e.stopPropagation()}
                >
                    <div className="p-2 border-b border-slate-100 dark:border-white/5">
                        <p className="text-xs font-bold text-slate-500 uppercase px-2">Agendar Rápido</p>
                    </div>
                    <div className="p-1">
                        <button onClick={() => onQuickAdd('CALL')} className="w-full text-left px-3 py-2 text-sm text-slate-700 dark:text-slate-200 hover:bg-slate-100 dark:hover:bg-white/5 rounded flex items-center gap-2">
                            <Phone size={14} className="text-blue-500" /> Ligar amanhã
                        </button>
                        <button onClick={() => onQuickAdd('EMAIL')} className="w-full text-left px-3 py-2 text-sm text-slate-700 dark:text-slate-200 hover:bg-slate-100 dark:hover:bg-white/5 rounded flex items-center gap-2">
                            <Mail size={14} className="text-purple-500" /> Email amanhã
                        </button>
                        <button onClick={() => onQuickAdd('MEETING')} className="w-full text-left px-3 py-2 text-sm text-slate-700 dark:text-slate-200 hover:bg-slate-100 dark:hover:bg-white/5 rounded flex items-center gap-2">
                            <Calendar size={14} className="text-orange-500" /> Reunião amanhã
                        </button>
                    </div>
                </div>
            )}
        </div>
    );
};
