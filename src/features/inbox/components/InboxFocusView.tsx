import React from 'react';
import { 
  ChevronLeft, 
  ChevronRight, 
  Check, 
  Clock, 
  SkipForward,
  Phone,
  Calendar,
  Mail,
  CheckCircle2,
  FileText,
  AlertTriangle,
  Gift,
  TrendingUp,
  Building2
} from 'lucide-react';
import { FocusItem, AISuggestion } from '../hooks/useInboxController';
import { Activity } from '@/types';

interface InboxFocusViewProps {
  currentItem: FocusItem | null;
  currentIndex: number;
  totalItems: number;
  onDone: () => void;
  onSnooze: () => void;
  onSkip: () => void;
  onPrev: () => void;
  onNext: () => void;
}

export const InboxFocusView: React.FC<InboxFocusViewProps> = ({
  currentItem,
  currentIndex,
  totalItems,
  onDone,
  onSnooze,
  onSkip,
  onPrev,
  onNext,
}) => {
  if (!currentItem) {
    return (
      <div className="flex flex-col items-center justify-center py-20 animate-fade-in">
        <div className="w-24 h-24 bg-gradient-to-br from-green-400 to-emerald-500 rounded-full flex items-center justify-center mb-6 shadow-xl shadow-green-500/30">
          <Check size={48} className="text-white" />
        </div>
        <h2 className="text-3xl font-bold text-slate-900 dark:text-white mb-2">
          Inbox Zero! 🎉
        </h2>
        <p className="text-slate-500 dark:text-slate-400 text-center max-w-md">
          Você zerou tudo. Aproveite o momento ou planeje o futuro.
        </p>
      </div>
    );
  }

  const isActivity = currentItem.type === 'activity';
  const activity = isActivity ? (currentItem.data as Activity) : null;
  const suggestion = !isActivity ? (currentItem.data as AISuggestion) : null;

  // Determinar se é atrasado
  const isOverdue = activity && new Date(activity.date) < new Date(new Date().setHours(0, 0, 0, 0));

  // Ícone baseado no tipo
  const getIcon = () => {
    if (activity) {
      switch (activity.type) {
        case 'CALL': return <Phone size={24} />;
        case 'MEETING': return <Calendar size={24} />;
        case 'EMAIL': return <Mail size={24} />;
        case 'TASK': return <CheckCircle2 size={24} />;
        default: return <FileText size={24} />;
      }
    }
    if (suggestion) {
      switch (suggestion.type) {
        case 'STALLED': return <AlertTriangle size={24} />;
        case 'BIRTHDAY': return <Gift size={24} />;
        case 'UPSELL': return <TrendingUp size={24} />;
        default: return <AlertTriangle size={24} />;
      }
    }
    return <FileText size={24} />;
  };

  // Cor do ícone
  const getIconColor = () => {
    if (isOverdue) return 'text-red-500';
    if (activity) {
      switch (activity.type) {
        case 'CALL': return 'text-blue-500';
        case 'MEETING': return 'text-purple-500';
        default: return 'text-slate-500';
      }
    }
    if (suggestion) {
      switch (suggestion.type) {
        case 'STALLED': return 'text-orange-500';
        case 'BIRTHDAY': return 'text-pink-500';
        case 'UPSELL': return 'text-green-500';
        default: return 'text-slate-500';
      }
    }
    return 'text-slate-500';
  };

  // Título e descrição
  const title = activity?.title || suggestion?.title || '';
  const description = activity?.description || suggestion?.description || '';
  const context = activity?.dealTitle || suggestion?.data.deal?.companyName || suggestion?.data.contact?.name || '';
  const value = suggestion?.data.deal?.value;

  // Horário (se for reunião/call)
  const isMeeting = activity?.type === 'MEETING' || activity?.type === 'CALL';
  const timeString = activity ? new Date(activity.date).toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' }) : '';

  return (
    <div className="flex flex-col items-center justify-center min-h-[60vh] py-8 animate-fade-in">
      {/* Badge de status */}
      {isOverdue && (
        <div className="mb-4 px-4 py-1.5 bg-red-100 dark:bg-red-500/20 text-red-600 dark:text-red-400 rounded-full text-sm font-bold uppercase tracking-wider">
          ⚠️ Atrasado
        </div>
      )}
      {suggestion?.priority === 'high' && (
        <div className="mb-4 px-4 py-1.5 bg-orange-100 dark:bg-orange-500/20 text-orange-600 dark:text-orange-400 rounded-full text-sm font-bold uppercase tracking-wider">
          🔥 Urgente
        </div>
      )}

      {/* Horário grande (se for reunião) */}
      {isMeeting && (
        <div className="text-6xl font-bold text-slate-900 dark:text-white mb-4 font-display">
          {timeString}
        </div>
      )}

      {/* Ícone (se não for reunião) */}
      {!isMeeting && (
        <div className={`mb-6 p-4 rounded-2xl bg-slate-100 dark:bg-white/5 ${getIconColor()}`}>
          {getIcon()}
        </div>
      )}

      {/* Título */}
      <h1 className="text-2xl md:text-3xl font-bold text-slate-900 dark:text-white text-center mb-3 max-w-lg">
        {title}
      </h1>

      {/* Descrição */}
      {description && (
        <p className="text-slate-500 dark:text-slate-400 text-center mb-4 max-w-md">
          "{description}"
        </p>
      )}

      {/* Contexto (Deal/Empresa) */}
      {context && (
        <div className="flex items-center gap-2 text-slate-600 dark:text-slate-300 mb-2">
          <Building2 size={16} className="text-slate-400" />
          <span>{context}</span>
        </div>
      )}

      {/* Valor (se for deal) */}
      {value && (
        <div className="text-lg font-bold text-green-600 dark:text-green-400 mb-6">
          R$ {value.toLocaleString('pt-BR')}
        </div>
      )}

      {/* Ações */}
      <div className="flex items-center gap-4 mt-8">
        <button
          onClick={onSnooze}
          className="flex items-center gap-2 px-6 py-3 rounded-xl bg-slate-100 dark:bg-white/5 text-slate-700 dark:text-slate-300 hover:bg-slate-200 dark:hover:bg-white/10 transition-all font-medium"
        >
          <Clock size={20} />
          Adiar
        </button>
        <button
          onClick={onDone}
          className="flex items-center gap-2 px-8 py-4 rounded-xl bg-green-500 hover:bg-green-600 text-white transition-all font-bold text-lg shadow-lg shadow-green-500/30 hover:scale-105"
        >
          <Check size={24} />
          Feito
        </button>
        <button
          onClick={onSkip}
          className="flex items-center gap-2 px-6 py-3 rounded-xl bg-slate-100 dark:bg-white/5 text-slate-700 dark:text-slate-300 hover:bg-slate-200 dark:hover:bg-white/10 transition-all font-medium"
        >
          Pular
          <SkipForward size={20} />
        </button>
      </div>

      {/* Navegação */}
      <div className="flex items-center gap-6 mt-12">
        <button
          onClick={onPrev}
          disabled={currentIndex === 0}
          className="p-2 text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 disabled:opacity-30 disabled:cursor-not-allowed transition-colors"
        >
          <ChevronLeft size={24} />
        </button>
        
        {/* Progress dots */}
        <div className="flex items-center gap-1.5">
          {Array.from({ length: Math.min(totalItems, 10) }).map((_, i) => (
            <div
              key={i}
              className={`w-2 h-2 rounded-full transition-all ${
                i === currentIndex
                  ? 'w-6 bg-primary-500'
                  : 'bg-slate-300 dark:bg-slate-600'
              }`}
            />
          ))}
          {totalItems > 10 && (
            <span className="text-xs text-slate-400 ml-2">+{totalItems - 10}</span>
          )}
        </div>

        <button
          onClick={onNext}
          disabled={currentIndex >= totalItems - 1}
          className="p-2 text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 disabled:opacity-30 disabled:cursor-not-allowed transition-colors"
        >
          <ChevronRight size={24} />
        </button>
      </div>

      {/* Contador */}
      <p className="text-sm text-slate-400 mt-4">
        {currentIndex + 1} de {totalItems} pendências
      </p>
    </div>
  );
};
