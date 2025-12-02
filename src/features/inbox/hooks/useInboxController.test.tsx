import { describe, it, expect, vi, beforeEach } from 'vitest';
import { renderHook, act, waitFor } from '@testing-library/react';
import { useInboxController, AISuggestion } from './useInboxController';
import { DealStatus, Activity, Contact, DealView } from '@/types';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import React from 'react';

// Mock TanStack Query hooks
vi.mock('@/lib/query/hooks/useActivitiesQuery', () => ({
  useActivities: () => ({ data: mockActivities, isLoading: false }),
  useCreateActivity: () => ({ mutate: mockAddActivity, mutateAsync: mockAddActivity }),
  useUpdateActivity: () => ({ mutate: mockUpdateActivity, mutateAsync: mockUpdateActivity }),
  useDeleteActivity: () => ({ mutate: mockDeleteActivity, mutateAsync: mockDeleteActivity }),
}));

vi.mock('@/lib/query/hooks/useContactsQuery', () => ({
  useContacts: () => ({ data: mockContacts, isLoading: false }),
}));

vi.mock('@/lib/query/hooks/useDealsQuery', () => ({
  useDealsView: () => ({ data: mockDeals, isLoading: false }),
  useCreateDeal: () => ({ mutate: mockAddDeal, mutateAsync: mockAddDeal }),
  useUpdateDeal: () => ({ mutate: mockUpdateDeal, mutateAsync: mockUpdateDeal }),
}));

vi.mock('@/lib/query/hooks/useBoardsQuery', () => ({
  useDefaultBoard: () => ({
    data: { id: 'board-1', stages: [{ id: 'stage-1', name: 'Lead' }] },
  }),
}));

vi.mock('@/lib/realtime', () => ({
  useRealtimeSync: vi.fn(),
}));

// Mock functions
const mockAddActivity = vi.fn();
const mockUpdateActivity = vi.fn();
const mockDeleteActivity = vi.fn();
const mockUpdateDeal = vi.fn();
const mockAddDeal = vi.fn();
const mockShowToast = vi.fn();

vi.mock('@/context/ToastContext', () => ({
  useToast: () => ({
    showToast: mockShowToast,
  }),
}));

vi.mock('@/hooks/usePersistedState', () => ({
  usePersistedState: <T,>(_key: string, defaultValue: T): [T, (value: T) => void] => {
    const React = require('react');
    return React.useState(defaultValue);
  },
}));

vi.mock('@/services/geminiService', () => ({
  generateDailyBriefing: vi.fn().mockResolvedValue('Bom dia! Você tem 3 atividades para hoje.'),
}));

// Mock data
let mockActivities: Activity[] = [];
let mockContacts: Contact[] = [];
let mockDeals: DealView[] = [];

// Create test QueryClient wrapper
const createWrapper = () => {
  const queryClient = new QueryClient({
    defaultOptions: {
      queries: { retry: false },
      mutations: { retry: false },
    },
  });
  return ({ children }: { children: React.ReactNode }) => (
    <QueryClientProvider client={queryClient}>{children}</QueryClientProvider>
  );
};

const createMockActivity = (overrides: Partial<Activity> = {}): Activity => ({
  id: crypto.randomUUID(),
  dealId: 'deal-1',
  dealTitle: 'Test Deal',
  type: 'CALL',
  title: 'Call client',
  description: '',
  date: new Date().toISOString(),
  user: { name: 'Me', avatar: '' },
  completed: false,
  ...overrides,
});

const createMockContact = (overrides: Partial<Contact> = {}): Contact => ({
  id: crypto.randomUUID(),
  name: 'John Doe',
  email: 'john@example.com',
  phone: '11999999999',
  companyId: 'company-1',
  stage: 'CUSTOMER',
  status: 'ACTIVE',
  createdAt: new Date().toISOString(),
  ...overrides,
});

const createMockDeal = (overrides: Partial<DealView> = {}): DealView => ({
  id: crypto.randomUUID(),
  title: 'Test Deal',
  companyId: 'company-1',
  companyName: 'Test Corp',
  contactId: 'contact-1',
  contactName: 'John Doe',
  contactEmail: 'john@example.com',
  value: 10000,
  items: [],
  status: DealStatus.NEGOTIATION,
  probability: 50,
  priority: 'medium',
  boardId: 'board-1',
  tags: [],
  customFields: {},
  owner: { name: 'Me', avatar: '' },
  createdAt: new Date().toISOString(),
  updatedAt: new Date().toISOString(),
  isWon: false,
  isLost: false,
  ...overrides,
});

describe('useInboxController', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mockActivities = [];
    mockContacts = [];
    mockDeals = [];
  });

  describe('Initialization', () => {
    it('should initialize with default values', () => {
      const { result } = renderHook(() => useInboxController(), { wrapper: createWrapper() });

      expect(result.current.viewMode).toBe('list');
      expect(result.current.focusIndex).toBe(0);
      expect(result.current.isInboxZero).toBe(true);
    });

    it('should start with empty activity lists', () => {
      const { result } = renderHook(() => useInboxController(), { wrapper: createWrapper() });

      expect(result.current.overdueActivities).toHaveLength(0);
      expect(result.current.todayActivities).toHaveLength(0);
      expect(result.current.upcomingActivities).toHaveLength(0);
    });
  });

  describe('Activity Filtering', () => {
    it('should filter overdue activities correctly', () => {
      const yesterday = new Date();
      yesterday.setDate(yesterday.getDate() - 1);

      mockActivities = [
        createMockActivity({ id: 'overdue-1', date: yesterday.toISOString(), completed: false }),
        createMockActivity({ id: 'today-1', date: new Date().toISOString(), completed: false }),
      ];

      const { result } = renderHook(() => useInboxController(), { wrapper: createWrapper() });

      expect(result.current.overdueActivities).toHaveLength(1);
      expect(result.current.overdueActivities[0].id).toBe('overdue-1');
    });

    it('should filter today activities', () => {
      const todayMorning = new Date();
      todayMorning.setHours(10, 0, 0, 0);

      mockActivities = [
        createMockActivity({
          id: 'today-meeting',
          date: todayMorning.toISOString(),
          type: 'MEETING',
        }),
        createMockActivity({ id: 'today-call', date: todayMorning.toISOString(), type: 'CALL' }),
      ];

      const { result } = renderHook(() => useInboxController(), { wrapper: createWrapper() });

      expect(result.current.todayActivities).toHaveLength(2);
      expect(result.current.todayMeetings).toHaveLength(2);
    });

    it('should separate meetings from tasks', () => {
      const todayMorning = new Date();
      todayMorning.setHours(10, 0, 0, 0);

      mockActivities = [
        createMockActivity({ id: 'meeting-1', date: todayMorning.toISOString(), type: 'MEETING' }),
        createMockActivity({ id: 'task-1', date: todayMorning.toISOString(), type: 'TASK' }),
        createMockActivity({ id: 'email-1', date: todayMorning.toISOString(), type: 'EMAIL' }),
      ];

      const { result } = renderHook(() => useInboxController(), { wrapper: createWrapper() });

      expect(result.current.todayMeetings).toHaveLength(1);
      expect(result.current.todayTasks).toHaveLength(2);
    });

    it('should filter upcoming activities', () => {
      const nextWeek = new Date();
      nextWeek.setDate(nextWeek.getDate() + 7);

      mockActivities = [createMockActivity({ id: 'upcoming-1', date: nextWeek.toISOString() })];

      const { result } = renderHook(() => useInboxController(), { wrapper: createWrapper() });

      expect(result.current.upcomingActivities).toHaveLength(1);
    });

    it('should not include completed activities', () => {
      const yesterday = new Date();
      yesterday.setDate(yesterday.getDate() - 1);

      mockActivities = [
        createMockActivity({ id: 'completed-1', date: yesterday.toISOString(), completed: true }),
        createMockActivity({ id: 'incomplete-1', date: yesterday.toISOString(), completed: false }),
      ];

      const { result } = renderHook(() => useInboxController(), { wrapper: createWrapper() });

      expect(result.current.overdueActivities).toHaveLength(1);
      expect(result.current.overdueActivities[0].id).toBe('incomplete-1');
    });
  });

  describe('AI Suggestions', () => {
    it('should generate birthday suggestions', () => {
      const currentMonth = (new Date().getMonth() + 1).toString().padStart(2, '0');

      mockContacts = [
        createMockContact({
          id: 'birthday-contact',
          name: 'Birthday Person',
          birthDate: `1990-${currentMonth}-15`,
        }),
      ];

      const { result } = renderHook(() => useInboxController(), { wrapper: createWrapper() });

      expect(result.current.aiSuggestions.some(s => s.type === 'BIRTHDAY')).toBe(true);
    });

    it('should generate stalled deal suggestions', () => {
      const tenDaysAgo = new Date();
      tenDaysAgo.setDate(tenDaysAgo.getDate() - 10);

      mockDeals = [
        createMockDeal({
          id: 'stalled-deal',
          status: DealStatus.NEGOTIATION,
          updatedAt: tenDaysAgo.toISOString(),
        }),
      ];

      const { result } = renderHook(() => useInboxController(), { wrapper: createWrapper() });

      expect(result.current.aiSuggestions.some(s => s.type === 'STALLED')).toBe(true);
    });

    it('should generate upsell suggestions for old won deals', () => {
      const sixtyDaysAgo = new Date();
      sixtyDaysAgo.setDate(sixtyDaysAgo.getDate() - 60);

      mockDeals = [
        createMockDeal({
          id: 'upsell-deal',
          status: DealStatus.CLOSED_WON,
          updatedAt: sixtyDaysAgo.toISOString(),
        }),
      ];

      const { result } = renderHook(() => useInboxController(), { wrapper: createWrapper() });

      expect(result.current.aiSuggestions.some(s => s.type === 'UPSELL')).toBe(true);
    });

    it('should sort suggestions by priority', () => {
      const tenDaysAgo = new Date();
      tenDaysAgo.setDate(tenDaysAgo.getDate() - 10);
      const sixtyDaysAgo = new Date();
      sixtyDaysAgo.setDate(sixtyDaysAgo.getDate() - 60);
      const currentMonth = (new Date().getMonth() + 1).toString().padStart(2, '0');

      mockDeals = [
        createMockDeal({
          id: 'stalled-deal',
          status: DealStatus.NEGOTIATION,
          updatedAt: tenDaysAgo.toISOString(),
        }),
        createMockDeal({
          id: 'upsell-deal',
          status: DealStatus.CLOSED_WON,
          updatedAt: sixtyDaysAgo.toISOString(),
        }),
      ];
      mockContacts = [
        createMockContact({
          id: 'birthday-contact',
          birthDate: `1990-${currentMonth}-15`,
        }),
      ];

      const { result } = renderHook(() => useInboxController(), { wrapper: createWrapper() });

      // High priority (STALLED) should come first
      const priorities = result.current.aiSuggestions.map(s => s.priority);
      expect(priorities[0]).toBe('high');
    });
  });

  describe('Activity Handlers', () => {
    it('should complete an activity', () => {
      mockActivities = [createMockActivity({ id: 'activity-1', completed: false })];

      const { result } = renderHook(() => useInboxController(), { wrapper: createWrapper() });

      act(() => {
        result.current.handleCompleteActivity('activity-1');
      });

      expect(mockUpdateActivity).toHaveBeenCalledWith(
        expect.objectContaining({
          id: 'activity-1',
          updates: { completed: true },
        }),
        expect.any(Object)
      );
    });

    it('should reopen a completed activity', () => {
      mockActivities = [createMockActivity({ id: 'activity-1', completed: true })];

      const { result } = renderHook(() => useInboxController(), { wrapper: createWrapper() });

      act(() => {
        result.current.handleCompleteActivity('activity-1');
      });

      expect(mockUpdateActivity).toHaveBeenCalledWith(
        expect.objectContaining({
          id: 'activity-1',
          updates: { completed: false },
        }),
        expect.any(Object)
      );
    });

    it('should snooze an activity', () => {
      const today = new Date();
      today.setHours(10, 0, 0, 0);

      mockActivities = [createMockActivity({ id: 'activity-1', date: today.toISOString() })];

      const { result } = renderHook(() => useInboxController(), { wrapper: createWrapper() });

      act(() => {
        result.current.handleSnoozeActivity('activity-1', 2);
      });

      expect(mockUpdateActivity).toHaveBeenCalled();
      const call = mockUpdateActivity.mock.calls[0];
      const { id, updates } = call[0]; // Now format is { id, updates }
      expect(id).toBe('activity-1');
      const newDate = new Date(updates.date);
      // Verifica que a nova data é 2 dias após a original
      const expectedDate = new Date(today);
      expectedDate.setDate(expectedDate.getDate() + 2);
      expect(newDate.getDate()).toBe(expectedDate.getDate());
    });

    it('should discard an activity', () => {
      mockActivities = [createMockActivity({ id: 'activity-1' })];

      const { result } = renderHook(() => useInboxController(), { wrapper: createWrapper() });

      act(() => {
        result.current.handleDiscardActivity('activity-1');
      });

      expect(mockDeleteActivity).toHaveBeenCalledWith('activity-1', expect.any(Object));
    });
  });

  describe('Suggestion Handlers', () => {
    it('should accept an upsell suggestion and create a deal', () => {
      const { result } = renderHook(() => useInboxController(), { wrapper: createWrapper() });

      const suggestion: AISuggestion = {
        id: 'upsell-1',
        type: 'UPSELL',
        title: 'Upsell Opportunity',
        description: 'Test description',
        priority: 'medium',
        data: { deal: createMockDeal({ title: 'Original Deal', value: 10000 }) },
        createdAt: new Date().toISOString(),
      };

      act(() => {
        result.current.handleAcceptSuggestion(suggestion);
      });

      expect(mockAddDeal).toHaveBeenCalled();
      const newDeal = mockAddDeal.mock.calls[0][0];
      expect(newDeal.title).toContain('Upsell');
      expect(newDeal.value).toBe(12000); // 1.2x original value
    });

    it('should accept a stalled suggestion and reactivate deal', () => {
      const { result } = renderHook(() => useInboxController(), { wrapper: createWrapper() });

      const suggestion: AISuggestion = {
        id: 'stalled-1',
        type: 'STALLED',
        title: 'Stalled Deal',
        description: 'Deal is stalled',
        priority: 'high',
        data: { deal: createMockDeal({ id: 'deal-1' }) },
        createdAt: new Date().toISOString(),
      };

      act(() => {
        result.current.handleAcceptSuggestion(suggestion);
      });

      expect(mockUpdateDeal).toHaveBeenCalledWith(
        expect.objectContaining({
          id: 'deal-1',
          updates: expect.any(Object),
        })
      );
    });

    it('should accept a birthday suggestion and create a task', () => {
      const { result } = renderHook(() => useInboxController(), { wrapper: createWrapper() });

      const suggestion: AISuggestion = {
        id: 'birthday-1',
        type: 'BIRTHDAY',
        title: 'Birthday',
        description: 'John has a birthday',
        priority: 'low',
        data: { contact: createMockContact({ name: 'John Doe' }) },
        createdAt: new Date().toISOString(),
      };

      act(() => {
        result.current.handleAcceptSuggestion(suggestion);
      });

      expect(mockAddActivity).toHaveBeenCalled();
      const newActivity = mockAddActivity.mock.calls[0][0];
      expect(newActivity.title).toContain('parabéns');
      expect(newActivity.type).toBe('TASK');
    });

    it('should dismiss a suggestion', () => {
      const tenDaysAgo = new Date();
      tenDaysAgo.setDate(tenDaysAgo.getDate() - 10);

      mockDeals = [
        createMockDeal({
          id: 'stalled-deal',
          status: DealStatus.NEGOTIATION,
          updatedAt: tenDaysAgo.toISOString(),
        }),
      ];

      const { result } = renderHook(() => useInboxController(), { wrapper: createWrapper() });

      const suggestionCount = result.current.aiSuggestions.length;

      act(() => {
        result.current.handleDismissSuggestion('stalled-stalled-deal');
      });

      expect(mockShowToast).toHaveBeenCalledWith('Sugestão descartada', 'info');
    });

    it('should snooze a suggestion', () => {
      const { result } = renderHook(() => useInboxController(), { wrapper: createWrapper() });

      act(() => {
        result.current.handleSnoozeSuggestion('suggestion-1');
      });

      expect(mockShowToast).toHaveBeenCalledWith('Sugestão adiada para amanhã', 'info');
    });
  });

  describe('Focus Mode', () => {
    it('should build focus queue with correct priority order', () => {
      const yesterday = new Date();
      yesterday.setDate(yesterday.getDate() - 1);
      const todayMorning = new Date();
      todayMorning.setHours(10, 0, 0, 0);
      const tenDaysAgo = new Date();
      tenDaysAgo.setDate(tenDaysAgo.getDate() - 10);

      mockActivities = [
        createMockActivity({
          id: 'today-meeting',
          date: todayMorning.toISOString(),
          type: 'MEETING',
        }),
        createMockActivity({ id: 'overdue-1', date: yesterday.toISOString() }),
        createMockActivity({ id: 'today-task', date: todayMorning.toISOString(), type: 'TASK' }),
      ];
      mockDeals = [
        createMockDeal({
          id: 'stalled-deal',
          status: DealStatus.NEGOTIATION,
          updatedAt: tenDaysAgo.toISOString(),
        }),
      ];

      const { result } = renderHook(() => useInboxController(), { wrapper: createWrapper() });

      // Overdue first (priority 0-99)
      expect(result.current.focusQueue[0].id).toBe('overdue-1');
      expect(result.current.focusQueue[0].type).toBe('activity');

      // High priority suggestions next (priority 100-199)
      expect(result.current.focusQueue[1].type).toBe('suggestion');

      // Today meetings (priority 200-299)
      expect(result.current.focusQueue[2].id).toBe('today-meeting');

      // Today tasks (priority 300-399)
      expect(result.current.focusQueue[3].id).toBe('today-task');
    });

    it('should navigate focus queue with next/prev', () => {
      const yesterday = new Date();
      yesterday.setDate(yesterday.getDate() - 1);

      mockActivities = [
        createMockActivity({ id: 'item-1', date: yesterday.toISOString() }),
        createMockActivity({ id: 'item-2', date: yesterday.toISOString() }),
        createMockActivity({ id: 'item-3', date: yesterday.toISOString() }),
      ];

      const { result } = renderHook(() => useInboxController(), { wrapper: createWrapper() });

      expect(result.current.focusIndex).toBe(0);
      expect(result.current.currentFocusItem?.id).toBe('item-1');

      act(() => {
        result.current.handleFocusNext();
      });
      expect(result.current.focusIndex).toBe(1);

      act(() => {
        result.current.handleFocusNext();
      });
      expect(result.current.focusIndex).toBe(2);

      act(() => {
        result.current.handleFocusPrev();
      });
      expect(result.current.focusIndex).toBe(1);
    });

    it('should not go beyond queue bounds', () => {
      const yesterday = new Date();
      yesterday.setDate(yesterday.getDate() - 1);

      mockActivities = [createMockActivity({ id: 'item-1', date: yesterday.toISOString() })];

      const { result } = renderHook(() => useInboxController(), { wrapper: createWrapper() });

      act(() => {
        result.current.handleFocusPrev();
      });
      expect(result.current.focusIndex).toBe(0);

      act(() => {
        result.current.handleFocusNext();
      });
      expect(result.current.focusIndex).toBe(0); // Can't go beyond single item
    });

    it('should skip focus item', () => {
      const yesterday = new Date();
      yesterday.setDate(yesterday.getDate() - 1);

      mockActivities = [
        createMockActivity({ id: 'item-1', date: yesterday.toISOString() }),
        createMockActivity({ id: 'item-2', date: yesterday.toISOString() }),
      ];

      const { result } = renderHook(() => useInboxController(), { wrapper: createWrapper() });

      act(() => {
        result.current.handleFocusSkip();
      });

      expect(result.current.focusIndex).toBe(1);
      expect(mockShowToast).toHaveBeenCalledWith('Pulado para o próximo', 'info');
    });
  });

  describe('Stats', () => {
    it('should calculate stats correctly', () => {
      const yesterday = new Date();
      yesterday.setDate(yesterday.getDate() - 1);
      const todayMorning = new Date();
      todayMorning.setHours(10, 0, 0, 0);
      const tenDaysAgo = new Date();
      tenDaysAgo.setDate(tenDaysAgo.getDate() - 10);

      mockActivities = [
        createMockActivity({ id: 'overdue-1', date: yesterday.toISOString() }),
        createMockActivity({ id: 'overdue-2', date: yesterday.toISOString() }),
        createMockActivity({ id: 'today-1', date: todayMorning.toISOString() }),
      ];
      mockDeals = [
        createMockDeal({
          status: DealStatus.NEGOTIATION,
          updatedAt: tenDaysAgo.toISOString(),
        }),
      ];

      const { result } = renderHook(() => useInboxController(), { wrapper: createWrapper() });

      expect(result.current.stats.overdueCount).toBe(2);
      expect(result.current.stats.todayCount).toBe(1);
      expect(result.current.stats.suggestionsCount).toBe(1);
      expect(result.current.stats.totalPending).toBe(4);
    });

    it('should detect inbox zero', () => {
      const { result } = renderHook(() => useInboxController(), { wrapper: createWrapper() });

      expect(result.current.isInboxZero).toBe(true);
    });

    it('should not be inbox zero when there are items', () => {
      const yesterday = new Date();
      yesterday.setDate(yesterday.getDate() - 1);

      mockActivities = [createMockActivity({ id: 'item-1', date: yesterday.toISOString() })];

      const { result } = renderHook(() => useInboxController(), { wrapper: createWrapper() });

      expect(result.current.isInboxZero).toBe(false);
    });
  });

  describe('View Mode', () => {
    it('should toggle view mode', () => {
      const { result } = renderHook(() => useInboxController(), { wrapper: createWrapper() });

      expect(result.current.viewMode).toBe('list');

      act(() => {
        result.current.setViewMode('focus');
      });

      expect(result.current.viewMode).toBe('focus');
    });
  });
});
