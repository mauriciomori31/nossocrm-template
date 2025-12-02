import { useState, useEffect, useMemo, useCallback } from 'react';
import { Activity, Deal, DealStatus, DealView, Contact } from '@/types';
import { ParsedAction, generateDailyBriefing } from '@/services/geminiService';
import { useToast } from '@/context/ToastContext';
import { usePersistedState } from '@/hooks/usePersistedState';
import {
  useActivities,
  useCreateActivity,
  useUpdateActivity,
  useDeleteActivity,
} from '@/lib/query/hooks/useActivitiesQuery';
import { useContacts } from '@/lib/query/hooks/useContactsQuery';
import {
  useDealsView,
  useCreateDeal,
  useUpdateDeal,
} from '@/lib/query/hooks/useDealsQuery';
import { useDefaultBoard } from '@/lib/query/hooks/useBoardsQuery';
import { useRealtimeSync } from '@/lib/realtime';

// Tipos para sugestões de IA
export type AISuggestionType = 'UPSELL' | 'RESCUE' | 'BIRTHDAY' | 'STALLED';

export interface AISuggestion {
  id: string;
  type: AISuggestionType;
  title: string;
  description: string;
  priority: 'high' | 'medium' | 'low';
  data: {
    deal?: DealView;
    contact?: Contact;
  };
  createdAt: string;
}

export type ViewMode = 'list' | 'focus';

// Item unificado para o modo Focus (atividade ou sugestão)
export interface FocusItem {
  id: string;
  type: 'activity' | 'suggestion';
  priority: number; // 0 = mais urgente
  data: Activity | AISuggestion;
}

export const useInboxController = () => {
  // TanStack Query hooks
  const { data: activities = [], isLoading: activitiesLoading } = useActivities();
  const { data: contacts = [], isLoading: contactsLoading } = useContacts();
  const { data: deals = [], isLoading: dealsLoading } = useDealsView();
  const { data: defaultBoard } = useDefaultBoard();

  const createActivityMutation = useCreateActivity();
  const updateActivityMutation = useUpdateActivity();
  const deleteActivityMutation = useDeleteActivity();
  const createDealMutation = useCreateDeal();
  const updateDealMutation = useUpdateDeal();

  // Enable realtime sync
  useRealtimeSync('activities');
  useRealtimeSync('deals');

  // AI settings from localStorage (TODO: migrate to Supabase user_settings)
  const [aiProvider] = usePersistedState<'google' | 'openai' | 'anthropic'>('crm_ai_provider', 'google');
  const [aiApiKey] = usePersistedState<string>('crm_ai_api_key', '');
  const [aiModel] = usePersistedState<string>('crm_ai_model', 'gemini-2.0-flash');
  const [aiThinking] = usePersistedState<boolean>('crm_ai_thinking', false);
  const [aiSearch] = usePersistedState<boolean>('crm_ai_search', false);
  const [aiAnthropicCaching] = usePersistedState<boolean>('crm_ai_anthropic_caching', false);

  const activeBoardId = defaultBoard?.id || '';
  const activeBoard = defaultBoard;

  const { showToast } = useToast();

  // State para modo de visualização (persiste no localStorage)
  const [viewMode, setViewMode] = usePersistedState<ViewMode>('inbox_view_mode', 'list');
  const [focusIndex, setFocusIndex] = useState(0);

  // State para briefing e sugestões
  const [briefing, setBriefing] = useState<string | null>(null);
  const [isGeneratingBriefing, setIsGeneratingBriefing] = useState(false);
  const [dismissedSuggestions, setDismissedSuggestions] = useState<Set<string>>(new Set());

  const isLoading = activitiesLoading || contactsLoading || dealsLoading;

  // --- Datas de referência ---
  const today = useMemo(() => {
    const d = new Date();
    d.setHours(0, 0, 0, 0);
    return d;
  }, []);

  const tomorrow = useMemo(() => {
    const d = new Date(today);
    d.setDate(d.getDate() + 1);
    return d;
  }, [today]);

  const sevenDaysAgo = useMemo(() => {
    const d = new Date();
    d.setDate(d.getDate() - 7);
    return d;
  }, []);

  const thirtyDaysAgo = useMemo(() => {
    const d = new Date();
    d.setDate(d.getDate() - 30);
    return d;
  }, []);

  // --- Atividades Filtradas ---
  const overdueActivities = useMemo(() => {
    return activities
      .filter(a => {
        const date = new Date(a.date);
        return !a.completed && date < today;
      })
      .sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime());
  }, [activities, today]);

  const todayActivities = useMemo(() => {
    return activities
      .filter(a => {
        const date = new Date(a.date);
        return !a.completed && date >= today && date < tomorrow;
      })
      .sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime());
  }, [activities, today, tomorrow]);

  const upcomingActivities = useMemo(() => {
    return activities
      .filter(a => {
        const date = new Date(a.date);
        return !a.completed && date >= tomorrow;
      })
      .sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime());
  }, [activities, tomorrow]);

  // Separar Compromissos (CALL, MEETING) vs Tarefas (TASK, EMAIL, NOTE)
  const todayMeetings = useMemo(
    () => todayActivities.filter(a => a.type === 'CALL' || a.type === 'MEETING'),
    [todayActivities]
  );

  const todayTasks = useMemo(
    () => todayActivities.filter(a => a.type !== 'CALL' && a.type !== 'MEETING'),
    [todayActivities]
  );

  // --- Sugestões de IA (do Radar) ---
  const currentMonth = new Date().getMonth() + 1;

  // Aniversariantes do mês
  const birthdaysThisMonth = useMemo(
    () =>
      contacts.filter(c => {
        if (!c.birthDate) return false;
        const birthMonth = parseInt(c.birthDate.split('-')[1]);
        return birthMonth === currentMonth;
      }),
    [contacts, currentMonth]
  );

  // Negócios estagnados (> 7 dias sem update)
  const stalledDeals = useMemo(
    () =>
      deals.filter(d => {
        const isClosed = d.status === DealStatus.CLOSED_WON || d.status === DealStatus.CLOSED_LOST;
        const lastUpdate = new Date(d.updatedAt);
        return !isClosed && lastUpdate < sevenDaysAgo;
      }),
    [deals, sevenDaysAgo]
  );

  // Oportunidades de Upsell (ganhos há > 30 dias)
  const upsellDeals = useMemo(
    () =>
      deals.filter(d => {
        const isWon = d.status === DealStatus.CLOSED_WON;
        const lastUpdate = new Date(d.updatedAt);
        return isWon && lastUpdate < thirtyDaysAgo;
      }),
    [deals, thirtyDaysAgo]
  );

  // Gerar sugestões de IA como objetos
  const aiSuggestions = useMemo((): AISuggestion[] => {
    const suggestions: AISuggestion[] = [];

    // Upsell
    upsellDeals.forEach(deal => {
      const id = `upsell-${deal.id}`;
      if (!dismissedSuggestions.has(id)) {
        suggestions.push({
          id,
          type: 'UPSELL',
          title: `Oportunidade de Upsell`,
          description: `${deal.companyName} fechou há mais de 30 dias. Hora de renovar?`,
          priority: 'medium',
          data: { deal },
          createdAt: new Date().toISOString(),
        });
      }
    });

    // Stalled/Rescue
    stalledDeals.forEach(deal => {
      const id = `stalled-${deal.id}`;
      if (!dismissedSuggestions.has(id)) {
        suggestions.push({
          id,
          type: 'STALLED',
          title: `Negócio Parado`,
          description: `${deal.title} está parado há mais de 7 dias. Risco de perda!`,
          priority: 'high',
          data: { deal },
          createdAt: new Date().toISOString(),
        });
      }
    });

    // Birthdays
    birthdaysThisMonth.forEach(contact => {
      const id = `birthday-${contact.id}`;
      if (!dismissedSuggestions.has(id)) {
        const day = contact.birthDate?.split('-')[2] || '??';
        suggestions.push({
          id,
          type: 'BIRTHDAY',
          title: `Aniversário`,
          description: `${contact.name} faz aniversário dia ${day}. Envie parabéns!`,
          priority: 'low',
          data: { contact },
          createdAt: new Date().toISOString(),
        });
      }
    });

    return suggestions.sort((a, b) => {
      const priorityOrder = { high: 0, medium: 1, low: 2 };
      return priorityOrder[a.priority] - priorityOrder[b.priority];
    });
  }, [upsellDeals, stalledDeals, birthdaysThisMonth, dismissedSuggestions]);

  // --- Gerar Briefing ---
  useEffect(() => {
    let isMounted = true;
    const fetchBriefing = async () => {
      if (briefing) return;
      if (!aiApiKey?.trim()) {
        setBriefing('Configure sua chave de API em Configurações → Inteligência Artificial para ver o briefing diário.');
        return;
      }
      setIsGeneratingBriefing(true);

      const radarData = {
        birthdays: birthdaysThisMonth,
        stalledDeals: stalledDeals.length,
        overdueActivities: overdueActivities.length,
        upsellDeals: upsellDeals.length,
      };

      const text = await generateDailyBriefing(radarData, {
        provider: aiProvider,
        apiKey: aiApiKey,
        model: aiModel,
        thinking: aiThinking,
        search: aiSearch,
        anthropicCaching: aiAnthropicCaching,
      });
      if (isMounted) {
        setBriefing(text);
        setIsGeneratingBriefing(false);
      }
    };

    fetchBriefing();
    return () => {
      isMounted = false;
    };
  }, []);

  // --- Handlers para Atividades ---

  const handleCreateAction = (action: ParsedAction) => {
    let contactId = undefined;
    if (action.contactName) {
      const found = contacts.find(c =>
        c.name.toLowerCase().includes(action.contactName!.toLowerCase())
      );
      if (found) contactId = found.id;
    }

    createActivityMutation.mutate({
      title: action.title,
      type: action.type,
      description: '',
      date: action.date || new Date().toISOString(),
      dealId: '',
      dealTitle: '',
      completed: false,
      user: { name: 'Eu', avatar: '' },
    });

    showToast(`Atividade criada: ${action.title}`, 'success');
  };

  const handleCompleteActivity = (id: string) => {
    const activity = activities.find(a => a.id === id);
    if (activity) {
      updateActivityMutation.mutate(
        { id, updates: { completed: !activity.completed } },
        {
          onSuccess: () => {
            showToast(activity.completed ? 'Atividade reaberta' : 'Atividade concluída!', 'success');
          },
        }
      );
    }
  };

  const handleSnoozeActivity = (id: string, days: number = 1) => {
    const activity = activities.find(a => a.id === id);
    if (activity) {
      const newDate = new Date(activity.date);
      newDate.setDate(newDate.getDate() + days);
      updateActivityMutation.mutate(
        { id, updates: { date: newDate.toISOString() } },
        {
          onSuccess: () => {
            showToast(`Adiado para ${newDate.toLocaleDateString('pt-BR')}`, 'success');
          },
        }
      );
    }
  };

  const handleDiscardActivity = (id: string) => {
    deleteActivityMutation.mutate(id, {
      onSuccess: () => {
        showToast('Atividade removida', 'info');
      },
    });
  };

  // --- Handlers para Sugestões de IA ---

  const handleAcceptSuggestion = (suggestion: AISuggestion) => {
    switch (suggestion.type) {
      case 'UPSELL':
        if (suggestion.data.deal && activeBoard) {
          const deal = suggestion.data.deal;
          createDealMutation.mutate({
            title: `Renovação/Upsell: ${deal.title}`,
            boardId: activeBoardId,
            status: activeBoard.stages[0]?.id || 'NEW',
            value: Math.round(deal.value * 1.2),
            probability: 30,
            priority: 'medium',
            contactId: deal.contactId,
            companyId: deal.companyId,
            tags: ['Upsell'],
            items: [],
            customFields: {},
            owner: { name: 'Eu', avatar: '' },
            isWon: false,
            isLost: false,
          });
          showToast(`Oportunidade de Upsell criada!`, 'success');
        }
        break;

      case 'STALLED':
        if (suggestion.data.deal) {
          updateDealMutation.mutate({
            id: suggestion.data.deal.id,
            updates: {},
          });
          showToast('Negócio reativado!', 'success');
        }
        break;

      case 'BIRTHDAY':
        if (suggestion.data.contact) {
          createActivityMutation.mutate({
            title: `Enviar parabéns para ${suggestion.data.contact.name}`,
            type: 'TASK',
            description: 'Aniversário detectado pela IA',
            date: new Date().toISOString(),
            dealId: '',
            dealTitle: '',
            completed: false,
            user: { name: 'Eu', avatar: '' },
          });
          showToast('Tarefa criada: Enviar parabéns', 'success');
        }
        break;
    }

    setDismissedSuggestions(prev => new Set([...prev, suggestion.id]));
  };

  const handleDismissSuggestion = (suggestionId: string) => {
    setDismissedSuggestions(prev => new Set([...prev, suggestionId]));
    showToast('Sugestão descartada', 'info');
  };

  const handleSnoozeSuggestion = (suggestionId: string) => {
    setDismissedSuggestions(prev => new Set([...prev, suggestionId]));
    showToast('Sugestão adiada para amanhã', 'info');
  };

  // --- Métricas ---
  const stats = useMemo(
    () => ({
      overdueCount: overdueActivities.length,
      todayCount: todayActivities.length,
      suggestionsCount: aiSuggestions.length,
      totalPending: overdueActivities.length + todayActivities.length + aiSuggestions.length,
    }),
    [overdueActivities, todayActivities, aiSuggestions]
  );

  const isInboxZero = stats.totalPending === 0;

  // --- Focus Mode: Fila unificada ordenada por prioridade ---
  const focusQueue = useMemo((): FocusItem[] => {
    const items: FocusItem[] = [];

    // 1. Atrasados (prioridade 0-99)
    overdueActivities.forEach((activity, i) => {
      items.push({
        id: activity.id,
        type: 'activity',
        priority: i,
        data: activity,
      });
    });

    // 2. Sugestões de alta prioridade (prioridade 100-199)
    aiSuggestions
      .filter(s => s.priority === 'high')
      .forEach((suggestion, i) => {
        items.push({
          id: suggestion.id,
          type: 'suggestion',
          priority: 100 + i,
          data: suggestion,
        });
      });

    // 3. Hoje - Reuniões primeiro por horário (prioridade 200-299)
    todayMeetings.forEach((activity, i) => {
      items.push({
        id: activity.id,
        type: 'activity',
        priority: 200 + i,
        data: activity,
      });
    });

    // 4. Hoje - Tarefas (prioridade 300-399)
    todayTasks.forEach((activity, i) => {
      items.push({
        id: activity.id,
        type: 'activity',
        priority: 300 + i,
        data: activity,
      });
    });

    // 5. Sugestões de média/baixa prioridade (prioridade 400+)
    aiSuggestions
      .filter(s => s.priority !== 'high')
      .forEach((suggestion, i) => {
        items.push({
          id: suggestion.id,
          type: 'suggestion',
          priority: 400 + i,
          data: suggestion,
        });
      });

    return items.sort((a, b) => a.priority - b.priority);
  }, [overdueActivities, todayMeetings, todayTasks, aiSuggestions]);

  // Item atual no modo Focus
  const currentFocusItem = focusQueue[focusIndex] || null;

  // Navegação do Focus Mode
  const handleFocusNext = useCallback(() => {
    if (focusIndex < focusQueue.length - 1) {
      setFocusIndex(prev => prev + 1);
    }
  }, [focusIndex, focusQueue.length]);

  const handleFocusPrev = useCallback(() => {
    if (focusIndex > 0) {
      setFocusIndex(prev => prev - 1);
    }
  }, [focusIndex]);

  const handleFocusSkip = useCallback(() => {
    // Pula para o próximo (sem completar)
    handleFocusNext();
    showToast('Pulado para o próximo', 'info');
  }, [handleFocusNext, showToast]);

  const handleFocusDone = useCallback(() => {
    const item = currentFocusItem;
    if (!item) return;

    if (item.type === 'activity') {
      handleCompleteActivity(item.id);
    } else {
      handleAcceptSuggestion(item.data as AISuggestion);
    }

    // Mantém no mesmo índice (próximo item "sobe")
    // Só avança se era o último
    if (focusIndex >= focusQueue.length - 1) {
      setFocusIndex(Math.max(0, focusQueue.length - 2));
    }
  }, [
    currentFocusItem,
    focusIndex,
    focusQueue.length,
    handleCompleteActivity,
    handleAcceptSuggestion,
  ]);

  const handleFocusSnooze = useCallback(() => {
    const item = currentFocusItem;
    if (!item) return;

    if (item.type === 'activity') {
      handleSnoozeActivity(item.id, 1);
    } else {
      handleSnoozeSuggestion(item.id);
    }

    // Mantém no mesmo índice
    if (focusIndex >= focusQueue.length - 1) {
      setFocusIndex(Math.max(0, focusQueue.length - 2));
    }
  }, [
    currentFocusItem,
    focusIndex,
    focusQueue.length,
    handleSnoozeActivity,
    handleSnoozeSuggestion,
  ]);

  // Reset do índice quando a fila muda
  useEffect(() => {
    if (focusIndex >= focusQueue.length) {
      setFocusIndex(Math.max(0, focusQueue.length - 1));
    }
  }, [focusQueue.length, focusIndex]);

  return {
    // Loading
    isLoading,

    // View Mode
    viewMode,
    setViewMode,

    // Briefing
    briefing,
    isGeneratingBriefing,

    // Atividades
    overdueActivities,
    todayActivities,
    todayMeetings,
    todayTasks,
    upcomingActivities,

    // Sugestões de IA
    aiSuggestions,

    // Focus Mode
    focusQueue,
    focusIndex,
    currentFocusItem,
    handleFocusNext,
    handleFocusPrev,
    handleFocusSkip,
    handleFocusDone,
    handleFocusSnooze,

    // Stats
    stats,
    isInboxZero,

    // Handlers de Atividades
    handleCompleteActivity,
    handleSnoozeActivity,
    handleDiscardActivity,

    // Handlers de Sugestões
    handleAcceptSuggestion,
    handleDismissSuggestion,
    handleSnoozeSuggestion,
  };
};
