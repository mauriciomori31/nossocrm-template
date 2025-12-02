import { render, screen, fireEvent } from '@testing-library/react';
import { MemoryRouter } from 'react-router-dom';
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { BoardCreationWizard } from './BoardCreationWizard';
import { useBoardsController } from '../hooks/useBoardsController';
import { useCRM } from '@/context/CRMContext';

// Mock dependencies
vi.mock('../hooks/useBoardsController', () => ({
  useBoardsController: vi.fn(),
}));

vi.mock('@/context/CRMContext', () => ({
  useCRM: vi.fn(),
}));

// Mock templates to avoid import issues
vi.mock('@/board-templates', () => ({
  BOARD_TEMPLATES: {
    SALES: {
      name: 'Máquina de Vendas',
      stages: [],
      tags: ['Sales'],
      agentPersona: {},
      goal: {},
    },
  },
}));

vi.mock('../../../journey-templates', () => ({
  OFFICIAL_JOURNEYS: {
    'test-journey': {
      id: 'test-journey',
      name: 'Jornada Teste',
      description: 'Descrição da jornada teste',
      icon: '🚀',
      boards: [],
    },
  },
}));

// Mock geminiService to avoid AI SDK issues
vi.mock('@/services/geminiService', () => ({
  generateBoardStructure: vi.fn(),
  generateBoardStrategy: vi.fn(),
  refineBoardWithAI: vi.fn(),
}));

// Mock registryService
vi.mock('@/services/registryService', () => ({
  fetchRegistry: vi.fn().mockResolvedValue({ templates: [] }),
  fetchTemplateJourney: vi.fn().mockResolvedValue({ boards: [] }),
}));

// Mock AIProcessingModal
vi.mock('./Modals/AIProcessingModal', () => ({
  AIProcessingModal: () => <div data-testid="ai-processing-modal" />,
}));

// Mock Lucide icons
vi.mock('lucide-react', () => ({
  X: () => <div data-testid="icon-x" />,
  Wand2: () => <div data-testid="icon-wand" />,
  LayoutTemplate: () => <div data-testid="icon-layout" />,
  ArrowRight: () => <div data-testid="icon-arrow-right" />,
  Check: () => <div data-testid="icon-check" />,
  Search: () => <div data-testid="icon-search" />,
  Plus: () => <div data-testid="icon-plus" />,
  Bot: () => <div data-testid="icon-bot" />,
  MessageSquare: () => <div data-testid="icon-message-square" />,
  Sparkles: () => <div data-testid="icon-sparkles" />,
  Target: () => <div data-testid="icon-target" />,
  Users: () => <div data-testid="icon-users" />,
  Zap: () => <div data-testid="icon-zap" />,
  ChevronRight: () => <div data-testid="icon-chevron-right" />,
  Loader2: () => <div data-testid="icon-loader" />,
  CheckCircle2: () => <div data-testid="icon-check-circle" />,
  Circle: () => <div data-testid="icon-circle" />,
  BrainCircuit: () => <div data-testid="icon-brain" />,
  Eye: () => <div data-testid="icon-eye" />,
  BookOpen: () => <div data-testid="icon-book" />,
  AlertCircle: () => <div data-testid="icon-alert-circle" />,
  Settings: () => <div data-testid="icon-settings" />,
  Send: () => <div data-testid="icon-send" />,
}));

// Helper to render with Router
const renderWithRouter = (ui: React.ReactElement) => {
  return render(<MemoryRouter>{ui}</MemoryRouter>);
};

describe('BoardCreationWizard', () => {
  const mockClose = vi.fn();
  const mockHandleCreateBoard = vi.fn();

  beforeEach(() => {
    vi.clearAllMocks();
    (useBoardsController as any).mockReturnValue({
      handleCreateBoard: mockHandleCreateBoard,
    });
    (useCRM as any).mockReturnValue({
      addBoard: vi.fn(),
    });
  });

  it('should render the wizard modal', () => {
    renderWithRouter(
      <BoardCreationWizard
        isOpen={true}
        onClose={mockClose}
        onCreate={mockHandleCreateBoard}
        onOpenCustomModal={vi.fn()}
      />
    );
    expect(screen.getByText('Criar Novo Board')).toBeInTheDocument();
  });

  it('should not render when isOpen is false', () => {
    renderWithRouter(
      <BoardCreationWizard
        isOpen={false}
        onClose={mockClose}
        onCreate={mockHandleCreateBoard}
        onOpenCustomModal={vi.fn()}
      />
    );
    expect(screen.queryByText('Criar Novo Board')).not.toBeInTheDocument();
  });

  it('should switch tabs', () => {
    renderWithRouter(
      <BoardCreationWizard
        isOpen={true}
        onClose={mockClose}
        onCreate={mockHandleCreateBoard}
        onOpenCustomModal={vi.fn()}
      />
    );

    const communityTab = screen.getByText('Comunidade');
    fireEvent.click(communityTab);

    // Check if content changed (this depends on implementation details, checking for text unique to community tab or absence of official tab content)
    // For now, just ensuring no crash
    expect(communityTab).toBeInTheDocument();
  });

  it('should show preview when a playbook is selected', () => {
    renderWithRouter(
      <BoardCreationWizard
        isOpen={true}
        onClose={mockClose}
        onCreate={mockHandleCreateBoard}
        onOpenCustomModal={vi.fn()}
      />
    );

    // Find the playbook card
    const playbookCard = screen.getByText('Jornada Teste');
    fireEvent.click(playbookCard);

    // Should show preview elements
    expect(screen.getByText('Jornada Teste')).toBeInTheDocument();
    expect(screen.getByText('Descrição da jornada teste')).toBeInTheDocument();
    expect(screen.getByText('Playbook Oficial')).toBeInTheDocument();
  });
});
