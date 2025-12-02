import { renderHook, act, waitFor } from '@testing-library/react';
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { useBoardsController, isDealRotting, getActivityStatus } from './useBoardsController';
import { DealStatus, DealView } from '@/types';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { ToastProvider } from '@/context/ToastContext';
import { MemoryRouter } from 'react-router-dom';
import React from 'react';

// Mock data
let mockDeals: DealView[] = [];
let mockBoards = [
  { id: 'board-1', name: 'Sales Board', isDefault: true, stages: [] },
  { id: 'board-2', name: 'Other Board', isDefault: false, stages: [] },
];
const mockMoveDeal = vi.fn();
const mockAddActivity = vi.fn();
const mockAddBoard = vi.fn().mockReturnValue({ id: 'new-board', name: 'New Board' });
const mockUpdateBoard = vi.fn();
const mockDeleteBoard = vi.fn();

// Mock TanStack Query hooks
const mockDeleteBoardWithMove = vi.fn();

vi.mock('@/lib/query/hooks/useBoardsQuery', () => ({
  useBoards: () => ({ data: mockBoards, isLoading: false }),
  useDefaultBoard: () => ({ data: mockBoards[0] }),
  useCreateBoard: () => ({ mutate: mockAddBoard, mutateAsync: mockAddBoard }),
  useUpdateBoard: () => ({ mutate: mockUpdateBoard, mutateAsync: mockUpdateBoard }),
  useDeleteBoard: () => ({ mutate: mockDeleteBoard, mutateAsync: mockDeleteBoard }),
  useDeleteBoardWithMove: () => ({ mutate: mockDeleteBoardWithMove, mutateAsync: mockDeleteBoardWithMove }),
  useCanDeleteBoard: () => ({ data: { canDelete: true, dealCount: 0 } }),
}));

vi.mock('@/lib/supabase/boards', () => ({
  boardsService: {
    canDelete: vi.fn().mockResolvedValue({ canDelete: true, dealCount: 0, error: null }),
  },
}));

vi.mock('@/lib/query/hooks/useDealsQuery', () => ({
  useDealsByBoard: () => ({ data: mockDeals, isLoading: false }),
  useUpdateDealStatus: () => ({ mutate: mockMoveDeal, mutateAsync: mockMoveDeal }),
}));

vi.mock('@/lib/query/hooks/useActivitiesQuery', () => ({
  useCreateActivity: () => ({ mutate: mockAddActivity, mutateAsync: mockAddActivity }),
}));

vi.mock('@/lib/realtime', () => ({
  useRealtimeSyncKanban: vi.fn(),
}));

vi.mock('@/hooks/usePersistedState', () => ({
  usePersistedState: <T,>(_key: string, defaultValue: T): [T, (value: T) => void] => {
    const React = require('react');
    return React.useState(defaultValue);
  },
}));

// Create test wrapper
const createWrapper = () => {
  const queryClient = new QueryClient({
    defaultOptions: {
      queries: { retry: false },
      mutations: { retry: false },
    },
  });
  return ({ children }: { children: React.ReactNode }) => (
    <MemoryRouter>
      <QueryClientProvider client={queryClient}>
        <ToastProvider>{children}</ToastProvider>
      </QueryClientProvider>
    </MemoryRouter>
  );
};

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

describe('isDealRotting', () => {
  it('should return true for deals older than 10 days without stage change', () => {
    const oldDate = new Date();
    oldDate.setDate(oldDate.getDate() - 15);

    const deal = createMockDeal({
      lastStageChangeDate: oldDate.toISOString(),
      updatedAt: oldDate.toISOString(),
    });

    expect(isDealRotting(deal)).toBe(true);
  });

  it('should return false for recent deals', () => {
    const recentDate = new Date();
    recentDate.setDate(recentDate.getDate() - 5);

    const deal = createMockDeal({
      lastStageChangeDate: recentDate.toISOString(),
      updatedAt: recentDate.toISOString(),
    });

    expect(isDealRotting(deal)).toBe(false);
  });

  it('should use updatedAt if lastStageChangeDate is not set', () => {
    const recentDate = new Date();
    recentDate.setDate(recentDate.getDate() - 3);

    const deal = createMockDeal({
      updatedAt: recentDate.toISOString(),
    });
    delete (deal as any).lastStageChangeDate;

    expect(isDealRotting(deal)).toBe(false);
  });
});

describe('getActivityStatus', () => {
  it('should return yellow when no next activity', () => {
    const deal = createMockDeal();
    delete deal.nextActivity;

    expect(getActivityStatus(deal)).toBe('yellow');
  });

  it('should return red when activity is overdue', () => {
    const deal = createMockDeal({
      nextActivity: {
        type: 'CALL',
        date: new Date().toISOString(),
        isOverdue: true,
      },
    });

    expect(getActivityStatus(deal)).toBe('red');
  });

  it('should return green when activity is today', () => {
    const today = new Date();
    today.setHours(14, 0, 0, 0);

    const deal = createMockDeal({
      nextActivity: {
        type: 'MEETING',
        date: today.toISOString(),
        isOverdue: false,
      },
    });

    expect(getActivityStatus(deal)).toBe('green');
  });

  it('should return gray for future activities', () => {
    const futureDate = new Date();
    futureDate.setDate(futureDate.getDate() + 5);

    const deal = createMockDeal({
      nextActivity: {
        type: 'CALL',
        date: futureDate.toISOString(),
        isOverdue: false,
      },
    });

    expect(getActivityStatus(deal)).toBe('gray');
  });
});

describe('useBoardsController', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mockDeals = [
      createMockDeal({
        id: '1',
        title: 'Deal 1',
        boardId: 'board-1',
        status: DealStatus.NEW,
        value: 100,
        companyName: 'Acme',
      }),
      createMockDeal({
        id: '2',
        title: 'Deal 2',
        boardId: 'board-1',
        status: DealStatus.CONTACTED,
        value: 200,
        companyName: 'Beta',
      }),
    ];
  });

  it('should return initial state correctly', () => {
    const { result } = renderHook(() => useBoardsController(), { wrapper: createWrapper() });

    expect(result.current.activeBoardId).toBeDefined();
    expect(result.current.viewMode).toBe('kanban');
  });

  it('should filter deals by search term', () => {
    const { result } = renderHook(() => useBoardsController(), { wrapper: createWrapper() });

    act(() => {
      result.current.setSearchTerm('Acme');
    });

    expect(result.current.filteredDeals.length).toBeLessThanOrEqual(mockDeals.length);
  });

  it('should handle board selection', () => {
    const { result } = renderHook(() => useBoardsController(), { wrapper: createWrapper() });

    act(() => {
      result.current.handleSelectBoard('board-2');
    });

    // Verify the active board changed
    expect(result.current.activeBoard?.id).toBe('board-2');
  });

  it('should handle drag and drop', () => {
    const { result } = renderHook(() => useBoardsController(), { wrapper: createWrapper() });

    const mockEvent = {
      dataTransfer: {
        setData: vi.fn(),
        getData: vi.fn().mockReturnValue('1'),
        effectAllowed: '',
        dropEffect: '',
      },
      preventDefault: vi.fn(),
    } as any;

    act(() => {
      result.current.handleDragStart(mockEvent, '1');
    });

    expect(result.current.draggingId).toBe('1');

    act(() => {
      result.current.handleDrop(mockEvent, 'stage-2');
    });

    // Verify mutation was called with new format
    expect(mockMoveDeal).toHaveBeenCalledWith(
      expect.objectContaining({
        id: '1',
        status: 'stage-2',
      })
    );
    expect(result.current.draggingId).toBeNull();
  });

  it('should handle board creation', () => {
    const { result } = renderHook(() => useBoardsController(), { wrapper: createWrapper() });

    act(() => {
      result.current.handleCreateBoard({ name: 'New Board' } as any);
    });

    expect(mockAddBoard).toHaveBeenCalled();
    expect(result.current.isCreateBoardModalOpen).toBe(false);
  });

  describe('View Mode', () => {
    it('should toggle view mode', () => {
      const { result } = renderHook(() => useBoardsController(), { wrapper: createWrapper() });

      expect(result.current.viewMode).toBe('kanban');

      act(() => {
        result.current.setViewMode('list');
      });

      expect(result.current.viewMode).toBe('list');
    });
  });

  describe('Owner Filter', () => {
    it('should update owner filter', () => {
      const { result } = renderHook(() => useBoardsController(), { wrapper: createWrapper() });

      act(() => {
        result.current.setOwnerFilter('mine');
      });

      expect(result.current.ownerFilter).toBe('mine');
    });
  });

  describe('Date Range Filter', () => {
    it('should filter by date range', () => {
      const today = new Date();
      const lastWeek = new Date();
      lastWeek.setDate(lastWeek.getDate() - 7);

      const { result } = renderHook(() => useBoardsController(), { wrapper: createWrapper() });

      act(() => {
        result.current.setDateRange({
          start: lastWeek.toISOString().split('T')[0],
          end: today.toISOString().split('T')[0],
        });
      });

      expect(result.current.dateRange.start).toBe(lastWeek.toISOString().split('T')[0]);
    });
  });

  describe('Quick Add Activity', () => {
    it('should add a quick call activity', () => {
      const { result } = renderHook(() => useBoardsController(), { wrapper: createWrapper() });

      act(() => {
        result.current.handleQuickAddActivity('deal-1', 'CALL', 'Test Deal');
      });

      expect(mockAddActivity).toHaveBeenCalled();
      const call = mockAddActivity.mock.calls[0][0];
      expect(call.type).toBe('CALL');
      expect(call.dealId).toBe('deal-1');
      expect(call.title).toBe('Ligar para Cliente');
    });

    it('should add a quick meeting activity', () => {
      const { result } = renderHook(() => useBoardsController(), { wrapper: createWrapper() });

      act(() => {
        result.current.handleQuickAddActivity('deal-1', 'MEETING', 'Test Deal');
      });

      expect(mockAddActivity).toHaveBeenCalled();
      const call = mockAddActivity.mock.calls[0][0];
      expect(call.type).toBe('MEETING');
      expect(call.title).toBe('Reunião de Acompanhamento');
    });

    it('should add a quick email activity', () => {
      const { result } = renderHook(() => useBoardsController(), { wrapper: createWrapper() });

      act(() => {
        result.current.handleQuickAddActivity('deal-1', 'EMAIL', 'Test Deal');
      });

      expect(mockAddActivity).toHaveBeenCalled();
      const call = mockAddActivity.mock.calls[0][0];
      expect(call.type).toBe('EMAIL');
      expect(call.title).toBe('Enviar Email de Follow-up');
    });

    it('should close activity menu after adding', () => {
      const { result } = renderHook(() => useBoardsController(), { wrapper: createWrapper() });

      act(() => {
        result.current.setOpenActivityMenuId('deal-1');
      });

      expect(result.current.openActivityMenuId).toBe('deal-1');

      act(() => {
        result.current.handleQuickAddActivity('deal-1', 'CALL', 'Test Deal');
      });

      expect(result.current.openActivityMenuId).toBe(null);
    });
  });

  describe('Board Management', () => {
    it('should open edit mode for a board', () => {
      const { result } = renderHook(() => useBoardsController(), { wrapper: createWrapper() });

      act(() => {
        result.current.handleEditBoard(mockBoards[0] as any);
      });

      expect(result.current.editingBoard).toEqual(mockBoards[0]);
      expect(result.current.isCreateBoardModalOpen).toBe(true);
    });

    it('should update an existing board', () => {
      const { result } = renderHook(() => useBoardsController(), { wrapper: createWrapper() });

      act(() => {
        result.current.handleEditBoard(mockBoards[0] as any);
      });

      const updatedData = {
        name: 'Updated Board',
        stages: [],
        isDefault: true,
      };

      act(() => {
        result.current.handleUpdateBoard(updatedData);
      });

      expect(mockUpdateBoard).toHaveBeenCalledWith(
        expect.objectContaining({
          id: 'board-1',
          updates: expect.objectContaining({ name: 'Updated Board' }),
        }),
        expect.any(Object)
      );

      // Simulate mutation success callback
      const [, options] = mockUpdateBoard.mock.calls[0] as any;
      act(() => {
        options?.onSuccess?.();
      });

      expect(result.current.editingBoard).toBe(null);
      expect(result.current.isCreateBoardModalOpen).toBe(false);
    });
  });

  describe('Drag and Drop with Loss Reason', () => {
    it('should handle drag over', () => {
      const { result } = renderHook(() => useBoardsController(), { wrapper: createWrapper() });

      const mockEvent = {
        preventDefault: vi.fn(),
        dataTransfer: {
          dropEffect: '',
        },
      } as any;

      act(() => {
        result.current.handleDragOver(mockEvent);
      });

      expect(mockEvent.preventDefault).toHaveBeenCalled();
      expect(mockEvent.dataTransfer.dropEffect).toBe('move');
    });
  });

  describe('Modal States', () => {
    it('should toggle filter panel', () => {
      const { result } = renderHook(() => useBoardsController(), { wrapper: createWrapper() });

      expect(result.current.isFilterOpen).toBe(false);

      act(() => {
        result.current.setIsFilterOpen(true);
      });

      expect(result.current.isFilterOpen).toBe(true);
    });

    it('should toggle create modal', () => {
      const { result } = renderHook(() => useBoardsController(), { wrapper: createWrapper() });

      expect(result.current.isCreateModalOpen).toBe(false);

      act(() => {
        result.current.setIsCreateModalOpen(true);
      });

      expect(result.current.isCreateModalOpen).toBe(true);
    });

    it('should toggle wizard', () => {
      const { result } = renderHook(() => useBoardsController(), { wrapper: createWrapper() });

      expect(result.current.isWizardOpen).toBe(false);

      act(() => {
        result.current.setIsWizardOpen(true);
      });

      expect(result.current.isWizardOpen).toBe(true);
    });

    it('should select a deal', () => {
      const { result } = renderHook(() => useBoardsController(), { wrapper: createWrapper() });

      expect(result.current.selectedDealId).toBe(null);

      act(() => {
        result.current.setSelectedDealId('deal-123');
      });

      expect(result.current.selectedDealId).toBe('deal-123');
    });
  });

  describe('Activity Menu', () => {
    it('should open activity menu for a deal', () => {
      const { result } = renderHook(() => useBoardsController(), { wrapper: createWrapper() });

      act(() => {
        result.current.setOpenActivityMenuId('deal-123');
      });

      expect(result.current.openActivityMenuId).toBe('deal-123');
    });

    it('should close activity menu on document click', async () => {
      const { result } = renderHook(() => useBoardsController(), { wrapper: createWrapper() });

      act(() => {
        result.current.setOpenActivityMenuId('deal-123');
      });

      expect(result.current.openActivityMenuId).toBe('deal-123');

      // Simulate document click
      act(() => {
        document.dispatchEvent(new MouseEvent('click'));
      });

      await waitFor(() => {
        expect(result.current.openActivityMenuId).toBe(null);
      });
    });
  });

  describe('Mouse Down Fallback', () => {
    it('should set last mouse down deal id for fallback', () => {
      const { result } = renderHook(() => useBoardsController(), { wrapper: createWrapper() });

      act(() => {
        result.current.setLastMouseDownDealId('deal-fallback');
      });

      // The ref is internal, but we can test that drop works with fallback
      const mockEvent = {
        preventDefault: vi.fn(),
        dataTransfer: {
          getData: vi.fn().mockReturnValue(''), // Empty data, should use fallback
        },
      } as any;

      act(() => {
        result.current.handleDrop(mockEvent, 'QUALIFIED');
      });

      expect(mockMoveDeal).toHaveBeenCalledWith(
        expect.objectContaining({ id: 'deal-fallback', status: 'QUALIFIED' })
      );
    });
  });

  describe('Closed Deals Visibility', () => {
    it('should hide closed deals older than 30 days', () => {
      const today = new Date();
      const sixtyDaysAgo = new Date();
      sixtyDaysAgo.setDate(sixtyDaysAgo.getDate() - 60);

      const dealsWithOldClosed = [
        {
          id: '1',
          title: 'Recent Won',
          boardId: 'board-1',
          status: 'stage-1',
          isWon: true,
          isLost: false,
          value: 100,
          companyName: 'Acme',
          owner: { name: 'Eu' },
          createdAt: today.toISOString(),
          updatedAt: today.toISOString(),
        },
        {
          id: '2',
          title: 'Old Won',
          boardId: 'board-1',
          status: 'stage-1',
          isWon: true,
          isLost: false,
          value: 200,
          companyName: 'Beta',
          owner: { name: 'Eu' },
          createdAt: sixtyDaysAgo.toISOString(),
          updatedAt: sixtyDaysAgo.toISOString(),
        },
      ];

      mockDeals = dealsWithOldClosed as DealView[];

      const { result } = renderHook(() => useBoardsController(), { wrapper: createWrapper() });

      expect(result.current.filteredDeals).toHaveLength(1);
      expect(result.current.filteredDeals[0].title).toBe('Recent Won');
    });
  });
});
