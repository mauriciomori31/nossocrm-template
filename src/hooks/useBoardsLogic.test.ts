import { describe, it, expect, vi, beforeEach } from 'vitest';
import { renderHook, act } from '@testing-library/react';
import { useBoardsLogic } from '@/hooks/useBoardsLogic';
import { Board, DEFAULT_BOARD_STAGES } from '@/types';

// Mock usePersistedState with proper state handling
let mockBoardsState: Board[] = [];

vi.mock('@/hooks/usePersistedState', () => ({
  usePersistedState: vi.fn(() => {
    const setState = (updater: Board[] | ((prev: Board[]) => Board[])) => {
      mockBoardsState = typeof updater === 'function' ? updater(mockBoardsState) : updater;
    };
    return [mockBoardsState, setState];
  }),
}));

// Mock crypto.randomUUID
const mockUUID = 'mock-uuid-12345';
vi.stubGlobal('crypto', {
  randomUUID: () => mockUUID,
});

const createMockBoard = (overrides?: Partial<Board>): Board => ({
  id: 'board-1',
  name: 'Test Board',
  description: 'Test description',
  stages: DEFAULT_BOARD_STAGES,
  isDefault: false,
  createdAt: new Date().toISOString(),
  ...overrides,
});

describe('useBoardsLogic', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mockBoardsState = [];
  });

  it('should initialize with boards array', () => {
    const { result } = renderHook(() => useBoardsLogic());
    expect(result.current.boards).toBeDefined();
    expect(Array.isArray(result.current.boards)).toBe(true);
  });

  it('should expose all required functions', () => {
    const { result } = renderHook(() => useBoardsLogic());
    expect(typeof result.current.addBoard).toBe('function');
    expect(typeof result.current.updateBoard).toBe('function');
    expect(typeof result.current.deleteBoard).toBe('function');
    expect(typeof result.current.getDefaultBoard).toBe('function');
    expect(typeof result.current.getBoardById).toBe('function');
    expect(typeof result.current.setBoards).toBe('function');
  });

  it('should add a new board with generated id and createdAt', () => {
    const { result } = renderHook(() => useBoardsLogic());

    const newBoardData = {
      name: 'New Board',
      description: 'A new board',
      stages: DEFAULT_BOARD_STAGES,
      isDefault: false,
    };

    let addedBoard: Board | undefined;
    act(() => {
      addedBoard = result.current.addBoard(newBoardData);
    });

    expect(mockBoardsState).toHaveLength(1);
    expect(mockBoardsState[0].id).toBe(mockUUID);
    expect(mockBoardsState[0].name).toBe('New Board');
    expect(mockBoardsState[0].createdAt).toBeDefined();
    expect(addedBoard?.id).toBe(mockUUID);
  });

  it('should update an existing board', () => {
    const existingBoard = createMockBoard({ id: 'board-1', name: 'Original Name' });
    mockBoardsState = [existingBoard];

    const { result } = renderHook(() => useBoardsLogic());

    act(() => {
      result.current.updateBoard('board-1', {
        name: 'Updated Name',
        description: 'New description',
      });
    });

    expect(mockBoardsState[0].name).toBe('Updated Name');
    expect(mockBoardsState[0].description).toBe('New description');
  });

  it('should not update board if id does not exist', () => {
    const existingBoard = createMockBoard({ id: 'board-1', name: 'Original Name' });
    mockBoardsState = [existingBoard];

    const { result } = renderHook(() => useBoardsLogic());

    act(() => {
      result.current.updateBoard('non-existent', { name: 'Updated Name' });
    });

    expect(mockBoardsState[0].name).toBe('Original Name');
  });

  it('should delete a non-default board', () => {
    const board1 = createMockBoard({ id: 'board-1', isDefault: false });
    const board2 = createMockBoard({ id: 'board-2', isDefault: false });
    mockBoardsState = [board1, board2];

    const { result } = renderHook(() => useBoardsLogic());

    act(() => {
      result.current.deleteBoard('board-1');
    });

    expect(mockBoardsState).toHaveLength(1);
    expect(mockBoardsState[0].id).toBe('board-2');
  });

  it('should NOT delete the default board', () => {
    const defaultBoard = createMockBoard({ id: 'default-sales', isDefault: true });
    const regularBoard = createMockBoard({ id: 'board-2', isDefault: false });
    mockBoardsState = [defaultBoard, regularBoard];

    const { result } = renderHook(() => useBoardsLogic());

    act(() => {
      result.current.deleteBoard('default-sales');
    });

    expect(mockBoardsState).toHaveLength(2);
    expect(mockBoardsState.find(b => b.id === 'default-sales')).toBeDefined();
  });

  it('should get default board', () => {
    const defaultBoard = createMockBoard({
      id: 'default-sales',
      isDefault: true,
      name: 'Default Board',
    });
    const regularBoard = createMockBoard({
      id: 'board-2',
      isDefault: false,
      name: 'Regular Board',
    });
    mockBoardsState = [regularBoard, defaultBoard];

    const { result } = renderHook(() => useBoardsLogic());

    const foundDefault = result.current.getDefaultBoard();
    expect(foundDefault?.name).toBe('Default Board');
  });

  it('should return first board if no default exists', () => {
    const board1 = createMockBoard({ id: 'board-1', isDefault: false, name: 'First Board' });
    const board2 = createMockBoard({ id: 'board-2', isDefault: false, name: 'Second Board' });
    mockBoardsState = [board1, board2];

    const { result } = renderHook(() => useBoardsLogic());

    const foundDefault = result.current.getDefaultBoard();
    expect(foundDefault?.name).toBe('First Board');
  });

  it('should get board by id', () => {
    const board1 = createMockBoard({ id: 'board-1', name: 'First' });
    const board2 = createMockBoard({ id: 'board-2', name: 'Second' });
    mockBoardsState = [board1, board2];

    const { result } = renderHook(() => useBoardsLogic());

    const found = result.current.getBoardById('board-2');
    expect(found?.name).toBe('Second');
  });

  it('should return undefined for non-existent board id', () => {
    const board1 = createMockBoard({ id: 'board-1' });
    mockBoardsState = [board1];

    const { result } = renderHook(() => useBoardsLogic());

    const found = result.current.getBoardById('non-existent');
    expect(found).toBeUndefined();
  });

  it('should preserve strategy fields when adding board', () => {
    const { result } = renderHook(() => useBoardsLogic());

    const newBoardData = {
      name: 'Strategy Board',
      stages: DEFAULT_BOARD_STAGES,
      goal: { description: 'Convert 20% of leads', kpi: 'Conversion Rate', targetValue: '20%' },
      agentPersona: { name: 'Sales Agent', role: 'SDR', behavior: 'Proactive' },
      entryTrigger: 'New lead from website',
    };

    act(() => {
      result.current.addBoard(newBoardData);
    });

    expect(mockBoardsState[0].goal?.description).toBe('Convert 20% of leads');
    expect(mockBoardsState[0].agentPersona?.name).toBe('Sales Agent');
    expect(mockBoardsState[0].entryTrigger).toBe('New lead from website');
  });

  it('should handle board with nextBoardId', () => {
    const { result } = renderHook(() => useBoardsLogic());

    const newBoardData = {
      name: 'Pre-Sales Board',
      stages: DEFAULT_BOARD_STAGES,
      nextBoardId: 'sales-board',
    };

    act(() => {
      result.current.addBoard(newBoardData);
    });

    expect(mockBoardsState[0].nextBoardId).toBe('sales-board');
  });

  it('should handle board with automationSuggestions', () => {
    const { result } = renderHook(() => useBoardsLogic());

    const newBoardData = {
      name: 'Automated Board',
      stages: DEFAULT_BOARD_STAGES,
      automationSuggestions: ['Send welcome email on entry', 'Notify manager after 3 days idle'],
    };

    act(() => {
      result.current.addBoard(newBoardData);
    });

    expect(mockBoardsState[0].automationSuggestions).toHaveLength(2);
  });
});
