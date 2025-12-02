import { render, screen } from '@testing-library/react';
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { KanbanBoard } from './KanbanBoard';
import { useBoardsController } from '@/features/boards/hooks/useBoardsController';
import { useCRM } from '@/context/CRMContext';
import { DealView } from '@/types';

// Mock dependencies
vi.mock('../../hooks/useBoardsController', () => ({
  useBoardsController: vi.fn(),
  isDealRotting: vi.fn().mockReturnValue(false),
  getActivityStatus: vi.fn().mockReturnValue('gray'),
}));

vi.mock('@/context/CRMContext', () => ({
  useCRM: vi.fn(),
}));

// Mock child components to isolate KanbanBoard
vi.mock('./DealCard', () => ({
  DealCard: ({ deal }: { deal: DealView }) => <div data-testid="deal-card">{deal.title}</div>,
}));

// Mock DndContext (dnd-kit) if used, or just the wrapper
// KanbanBoard likely uses DndContext. If it's from @dnd-kit/core, we might need to mock it or wrap the test.
// But if we mock KanbanList, we might avoid some DnD issues if they are inside the list.
// However, the board usually holds the context.
// Let's see if it renders without mocking DnD first.

describe('KanbanBoard', () => {
  const mockController = {
    activeBoard: {
      id: 'board-1',
      name: 'Test Board',
      stages: [
        { id: 'stage-1', label: 'To Do', color: 'bg-blue-500' },
        { id: 'stage-2', label: 'Doing', color: 'bg-yellow-500' },
      ],
    },
    filteredDeals: [{ id: '1', title: 'Deal 1', status: 'stage-1', value: 100 }],
    handleDragStart: vi.fn(),
    handleDragOver: vi.fn(),
    handleDrop: vi.fn(),
    setLastMouseDownDealId: vi.fn(),
    isWizardOpen: false,
    isCreateBoardModalOpen: false,
    editingBoard: null,
  };

  beforeEach(() => {
    vi.clearAllMocks();
    (useBoardsController as any).mockReturnValue(mockController);
    (useCRM as any).mockReturnValue({
      activeBoard: mockController.activeBoard,
      lifecycleStages: [],
    });
  });

  it('should render the board with stages and deals', () => {
    const mockProps = {
      stages: mockController.activeBoard.stages,
      filteredDeals: mockController.filteredDeals as any,
      draggingId: null,
      handleDragStart: vi.fn(),
      handleDragOver: vi.fn(),
      handleDrop: vi.fn(),
      setSelectedDealId: vi.fn(),
      openActivityMenuId: null,
      setOpenActivityMenuId: vi.fn(),
      handleQuickAddActivity: vi.fn(),
      setLastMouseDownDealId: vi.fn(),
    };

    render(<KanbanBoard {...mockProps} />);

    // Check if stages are rendered
    expect(screen.getByText('To Do')).toBeInTheDocument();
    expect(screen.getByText('Doing')).toBeInTheDocument();

    // Check if deal is rendered
    expect(screen.getByTestId('deal-card')).toHaveTextContent('Deal 1');
  });
});
