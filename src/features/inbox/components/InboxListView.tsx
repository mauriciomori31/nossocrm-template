import React, { useState } from 'react';
import { Activity } from '@/types';
import { AISuggestion } from '../hooks/useInboxController';
import { InboxSection } from './InboxSection';
import {
  ChevronDown,
  ChevronRight,
  Sparkles,
  AlertTriangle,
  Gift,
  TrendingUp,
  Check,
  X,
  Clock,
} from 'lucide-react';

interface InboxListViewProps {
  // Atividades
  overdueActivities: Activity[];
  todayMeetings: Activity[];
  todayTasks: Activity[];
  upcomingActivities: Activity[];

  // Sugestões
  aiSuggestions: AISuggestion[];

  // Handlers Atividades
  onCompleteActivity: (id: string) => void;
  onSnoozeActivity: (id: string) => void;
  onDiscardActivity: (id: string) => void;

  // Handlers Sugestões
  onAcceptSuggestion: (suggestion: AISuggestion) => void;
  onDismissSuggestion: (id: string) => void;
  onSnoozeSuggestion: (id: string) => void;
}

// Componente de Sugestão Simplificado (linha única)
const SuggestionRow: React.FC<{
  suggestion: AISuggestion;
  onAccept: () => void;
  onDismiss: () => void;
  onSnooze: () => void;
}> = ({ suggestion, onAccept, onDismiss, onSnooze }) => {
  const getIcon = () => {
    switch (suggestion.type) {
      case 'STALLED':
        return <AlertTriangle size={16} className="text-orange-500" />;
      case 'BIRTHDAY':
        return <Gift size={16} className="text-pink-500" />;
      case 'UPSELL':
        return <TrendingUp size={16} className="text-green-500" />;
      default:
        return <AlertTriangle size={16} className="text-slate-500" />;
    }
  };

  const value = suggestion.data.deal?.value;

  return (
    <div className="group flex items-center gap-3 py-3 px-4 hover:bg-slate-50 dark:hover:bg-white/5 rounded-lg transition-colors">
      <div className="shrink-0">{getIcon()}</div>

      <div className="flex-1 min-w-0">
        <p className="text-sm text-slate-700 dark:text-slate-200 truncate">
          {suggestion.description}
        </p>
      </div>

      {value && (
        <span className="shrink-0 text-sm font-medium text-green-600 dark:text-green-400">
          R$ {(value / 1000).toFixed(0)}k
        </span>
      )}

      {/* Actions */}
      <div className="shrink-0 flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
        <button
          onClick={onSnooze}
          className="p-1.5 text-slate-400 hover:text-orange-500 hover:bg-orange-50 dark:hover:bg-orange-500/10 rounded-md transition-colors"
          title="Adiar"
        >
          <Clock size={14} />
        </button>
        <button
          onClick={onDismiss}
          className="p-1.5 text-slate-400 hover:text-red-500 hover:bg-red-50 dark:hover:bg-red-500/10 rounded-md transition-colors"
          title="Descartar"
        >
          <X size={14} />
        </button>
        <button
          onClick={onAccept}
          className="p-1.5 text-slate-400 hover:text-green-500 hover:bg-green-50 dark:hover:bg-green-500/10 rounded-md transition-colors"
          title="Aceitar"
        >
          <Check size={14} />
        </button>
      </div>
    </div>
  );
};

// Card de Sugestões IA Colapsável
const AISuggestionsCard: React.FC<{
  suggestions: AISuggestion[];
  onAccept: (suggestion: AISuggestion) => void;
  onDismiss: (id: string) => void;
  onSnooze: (id: string) => void;
}> = ({ suggestions, onAccept, onDismiss, onSnooze }) => {
  const [isOpen, setIsOpen] = useState(true);

  if (suggestions.length === 0) return null;

  return (
    <div className="mb-6 border border-primary-200 dark:border-primary-500/20 rounded-xl overflow-hidden bg-primary-50/50 dark:bg-primary-500/5">
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="w-full flex items-center gap-3 p-4 hover:bg-primary-100/50 dark:hover:bg-primary-500/10 transition-colors"
      >
        <div className="p-1.5 rounded-lg bg-primary-100 dark:bg-primary-500/20">
          <Sparkles size={16} className="text-primary-600 dark:text-primary-400" />
        </div>
        <span className="font-semibold text-slate-900 dark:text-white">Sugestões da IA</span>
        <span className="text-xs px-2 py-0.5 rounded-full bg-primary-200 dark:bg-primary-500/30 text-primary-700 dark:text-primary-300">
          {suggestions.length}
        </span>
        <div className="flex-1" />
        {isOpen ? (
          <ChevronDown size={18} className="text-slate-400" />
        ) : (
          <ChevronRight size={18} className="text-slate-400" />
        )}
      </button>

      {isOpen && (
        <div className="border-t border-primary-200 dark:border-primary-500/20 divide-y divide-primary-100 dark:divide-primary-500/10">
          {suggestions.map(suggestion => (
            <SuggestionRow
              key={suggestion.id}
              suggestion={suggestion}
              onAccept={() => onAccept(suggestion)}
              onDismiss={() => onDismiss(suggestion.id)}
              onSnooze={() => onSnooze(suggestion.id)}
            />
          ))}
        </div>
      )}
    </div>
  );
};

export const InboxListView: React.FC<InboxListViewProps> = ({
  overdueActivities,
  todayMeetings,
  todayTasks,
  upcomingActivities,
  aiSuggestions,
  onCompleteActivity,
  onSnoozeActivity,
  onDiscardActivity,
  onAcceptSuggestion,
  onDismissSuggestion,
  onSnoozeSuggestion,
}) => {
  return (
    <div className="space-y-6">
      {/* AI Suggestions (Card único colapsável) */}
      <AISuggestionsCard
        suggestions={aiSuggestions}
        onAccept={onAcceptSuggestion}
        onDismiss={onDismissSuggestion}
        onSnooze={onSnoozeSuggestion}
      />

      {/* Activities */}
      <div className="space-y-2">
        <InboxSection
          title="Atrasados"
          activities={overdueActivities}
          color="red"
          onToggleComplete={onCompleteActivity}
          onSnooze={onSnoozeActivity}
          onDiscard={onDiscardActivity}
        />

        {/* Hoje separado: Reuniões vs Tarefas */}
        <InboxSection
          title="Reuniões Hoje"
          activities={todayMeetings}
          color="green"
          onToggleComplete={onCompleteActivity}
          onSnooze={onSnoozeActivity}
          onDiscard={onDiscardActivity}
        />

        <InboxSection
          title="Tarefas Hoje"
          activities={todayTasks}
          color="green"
          onToggleComplete={onCompleteActivity}
          onSnooze={onSnoozeActivity}
          onDiscard={onDiscardActivity}
        />

        <InboxSection
          title="Próximos"
          activities={upcomingActivities}
          color="slate"
          defaultOpen={false}
          onToggleComplete={onCompleteActivity}
          onSnooze={onSnoozeActivity}
          onDiscard={onDiscardActivity}
        />
      </div>
    </div>
  );
};
