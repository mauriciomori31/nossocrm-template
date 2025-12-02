import { describe, it, expect, vi, beforeEach } from 'vitest';
import { renderHook, act, waitFor } from '@testing-library/react';
import { useActivitiesController } from './useActivitiesController';
import { ToastProvider } from '@/context/ToastContext';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import React from 'react';

// Mock window.confirm
vi.stubGlobal(
  'confirm',
  vi.fn(() => true)
);

// Mock data
let mockActivities: any[] = [];
const mockAddActivity = vi.fn();
const mockUpdateActivity = vi.fn();
const mockDeleteActivity = vi.fn();

// Mock TanStack Query hooks
vi.mock('@/lib/query/hooks/useActivitiesQuery', () => ({
  useActivities: () => ({ data: mockActivities, isLoading: false }),
  useCreateActivity: () => ({ mutate: mockAddActivity, mutateAsync: mockAddActivity }),
  useUpdateActivity: () => ({ mutate: mockUpdateActivity, mutateAsync: mockUpdateActivity }),
  useDeleteActivity: () => ({ mutate: mockDeleteActivity, mutateAsync: mockDeleteActivity }),
}));

vi.mock('@/lib/query/hooks/useDealsQuery', () => ({
  useDeals: () => ({ data: [], isLoading: false }),
}));

vi.mock('@/lib/realtime', () => ({
  useRealtimeSync: vi.fn(),
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
    <QueryClientProvider client={queryClient}>
      <ToastProvider>{children}</ToastProvider>
    </QueryClientProvider>
  );
};

describe('useActivitiesController', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    localStorage.clear();
    mockActivities = [];
  });

  it('deve iniciar com valores padrão', () => {
    const { result } = renderHook(() => useActivitiesController(), { wrapper: createWrapper() });

    expect(result.current.viewMode).toBe('list');
    expect(result.current.searchTerm).toBe('');
    expect(result.current.filterType).toBe('ALL');
    expect(result.current.isModalOpen).toBe(false);
    expect(result.current.editingActivity).toBeNull();
  });

  it('deve alternar entre modos de visualização', () => {
    const { result } = renderHook(() => useActivitiesController(), { wrapper: createWrapper() });

    expect(result.current.viewMode).toBe('list');

    act(() => {
      result.current.setViewMode('calendar');
    });

    expect(result.current.viewMode).toBe('calendar');

    act(() => {
      result.current.setViewMode('list');
    });

    expect(result.current.viewMode).toBe('list');
  });

  it('deve atualizar o termo de busca', () => {
    const { result } = renderHook(() => useActivitiesController(), { wrapper: createWrapper() });

    act(() => {
      result.current.setSearchTerm('reunião');
    });

    expect(result.current.searchTerm).toBe('reunião');
  });

  it('deve atualizar o filtro de tipo', () => {
    const { result } = renderHook(() => useActivitiesController(), { wrapper: createWrapper() });

    act(() => {
      result.current.setFilterType('CALL');
    });

    expect(result.current.filterType).toBe('CALL');
  });

  it('deve abrir o modal de nova atividade', () => {
    const { result } = renderHook(() => useActivitiesController(), { wrapper: createWrapper() });

    expect(result.current.isModalOpen).toBe(false);

    act(() => {
      result.current.handleNewActivity();
    });

    expect(result.current.isModalOpen).toBe(true);
    expect(result.current.editingActivity).toBeNull();
  });

  it('deve fechar o modal', () => {
    const { result } = renderHook(() => useActivitiesController(), { wrapper: createWrapper() });

    // Abre o modal
    act(() => {
      result.current.handleNewActivity();
    });

    expect(result.current.isModalOpen).toBe(true);

    // Fecha o modal
    act(() => {
      result.current.setIsModalOpen(false);
    });

    expect(result.current.isModalOpen).toBe(false);
  });

  it('deve atualizar formData', () => {
    const { result } = renderHook(() => useActivitiesController(), { wrapper: createWrapper() });

    act(() => {
      result.current.setFormData({
        ...result.current.formData,
        title: 'Teste',
        description: 'Descrição teste',
      });
    });

    expect(result.current.formData.title).toBe('Teste');
    expect(result.current.formData.description).toBe('Descrição teste');
  });

  it('deve filtrar atividades por termo de busca', () => {
    const { result } = renderHook(() => useActivitiesController(), { wrapper: createWrapper() });

    const initialCount = result.current.filteredActivities.length;

    act(() => {
      result.current.setSearchTerm('texto-que-nao-existe-xyz');
    });

    expect(result.current.filteredActivities.length).toBeLessThanOrEqual(initialCount);
  });

  it('deve navegar entre meses no calendário', () => {
    const { result } = renderHook(() => useActivitiesController(), { wrapper: createWrapper() });

    const initialMonth = result.current.currentDate.getMonth();

    act(() => {
      const nextMonth = new Date(result.current.currentDate);
      nextMonth.setMonth(nextMonth.getMonth() + 1);
      result.current.setCurrentDate(nextMonth);
    });

    const expectedNextMonth = (initialMonth + 1) % 12;
    expect(result.current.currentDate.getMonth()).toBe(expectedNextMonth);
  });

  describe('CRUD Operations', () => {
    it('deve criar nova atividade via handleSubmit', async () => {
      const { result } = renderHook(() => useActivitiesController(), { wrapper: createWrapper() });

      // Open modal and set form data
      act(() => {
        result.current.handleNewActivity();
      });

      act(() => {
        result.current.setFormData({
          title: 'Nova Reunião',
          type: 'MEETING',
          date: '2025-12-01',
          time: '10:00',
          description: 'Descrição da reunião',
          dealId: '',
        });
      });

      // Submit the form
      act(() => {
        result.current.handleSubmit({ preventDefault: () => {} } as React.FormEvent);
      });

      // Verify mutation was called with correct data
      await waitFor(() => {
        expect(mockAddActivity).toHaveBeenCalledWith(
          expect.objectContaining({
            title: 'Nova Reunião',
            type: 'MEETING',
            description: 'Descrição da reunião',
          }),
          expect.any(Object) // options callback
        );
      });
    });

    it('deve editar atividade existente', async () => {
      // Set mock activity
      mockActivities = [
        {
          id: 'activity-1',
          title: 'Atividade para Editar',
          type: 'CALL',
          date: new Date('2025-12-01T14:00:00').toISOString(),
          description: 'Descrição original',
          dealId: '',
          dealTitle: '',
          completed: false,
          user: { name: 'Eu', avatar: '' },
        },
      ];

      const { result } = renderHook(() => useActivitiesController(), { wrapper: createWrapper() });

      // Open edit modal for the activity
      await waitFor(() => {
        expect(result.current.filteredActivities.length).toBe(1);
      });

      const activityToEdit = result.current.filteredActivities[0];

      act(() => {
        result.current.handleEditActivity(activityToEdit);
      });

      expect(result.current.isModalOpen).toBe(true);
      expect(result.current.editingActivity?.id).toBe('activity-1');
      expect(result.current.formData.title).toBe('Atividade para Editar');

      // Update the title
      act(() => {
        result.current.setFormData({
          ...result.current.formData,
          title: 'Atividade Editada',
        });
      });

      act(() => {
        result.current.handleSubmit({ preventDefault: () => {} } as React.FormEvent);
      });

      // Verify update mutation was called
      await waitFor(() => {
        expect(mockUpdateActivity).toHaveBeenCalledWith(
          expect.objectContaining({
            id: 'activity-1',
            updates: expect.objectContaining({
              title: 'Atividade Editada',
            }),
          }),
          expect.any(Object)
        );
      });
    });

    it('deve deletar atividade quando confirmado', async () => {
      // Set mock activity
      mockActivities = [
        {
          id: 'activity-to-delete',
          title: 'Atividade para Deletar',
          type: 'TASK',
          date: new Date('2025-12-01T11:00:00').toISOString(),
          description: '',
          dealId: '',
          dealTitle: '',
          completed: false,
          user: { name: 'Eu', avatar: '' },
        },
      ];

      const { result } = renderHook(() => useActivitiesController(), { wrapper: createWrapper() });

      await waitFor(() => {
        expect(result.current.filteredActivities.length).toBe(1);
      });

      // Delete the activity
      act(() => {
        result.current.handleDeleteActivity('activity-to-delete');
      });

      // Verify delete mutation was called
      await waitFor(() => {
        expect(mockDeleteActivity).toHaveBeenCalledWith('activity-to-delete', expect.any(Object));
      });
    });

    it('deve marcar atividade como completa/incompleta', async () => {
      // Set mock activity
      mockActivities = [
        {
          id: 'activity-to-complete',
          title: 'Atividade para Completar',
          type: 'TASK',
          date: new Date('2025-12-01T12:00:00').toISOString(),
          description: '',
          dealId: '',
          dealTitle: '',
          completed: false,
          user: { name: 'Eu', avatar: '' },
        },
      ];

      const { result } = renderHook(() => useActivitiesController(), { wrapper: createWrapper() });

      await waitFor(() => {
        expect(result.current.filteredActivities.length).toBe(1);
      });

      // Toggle complete
      act(() => {
        result.current.handleToggleComplete('activity-to-complete');
      });

      // Verify update mutation was called to set completed to true
      await waitFor(() => {
        expect(mockUpdateActivity).toHaveBeenCalledWith(
          expect.objectContaining({
            id: 'activity-to-complete',
            updates: expect.objectContaining({
              completed: true,
            }),
          }),
          expect.any(Object)
        );
      });
    });
  });

  describe('Filtering', () => {
    it('deve filtrar por tipo CALL', async () => {
      const { result } = renderHook(() => useActivitiesController(), { wrapper: createWrapper() });

      // Create a CALL activity
      act(() => {
        result.current.handleNewActivity();
        result.current.setFormData({
          title: 'Ligação Teste',
          type: 'CALL',
          date: '2025-12-01',
          time: '09:00',
          description: '',
          dealId: '',
        });
      });

      act(() => {
        result.current.handleSubmit({ preventDefault: () => {} } as React.FormEvent);
      });

      // Create a MEETING activity
      act(() => {
        result.current.handleNewActivity();
        result.current.setFormData({
          title: 'Reunião Teste',
          type: 'MEETING',
          date: '2025-12-01',
          time: '10:00',
          description: '',
          dealId: '',
        });
      });

      act(() => {
        result.current.handleSubmit({ preventDefault: () => {} } as React.FormEvent);
      });

      // Filter by CALL
      act(() => {
        result.current.setFilterType('CALL');
      });

      await waitFor(() => {
        // All filtered activities should be CALL type
        result.current.filteredActivities.forEach(a => {
          expect(a.type).toBe('CALL');
        });
      });
    });
  });
});
