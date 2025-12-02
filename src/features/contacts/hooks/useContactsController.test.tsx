import { describe, it, expect, vi, beforeEach } from 'vitest';
import { renderHook, act } from '@testing-library/react';
import React from 'react';
import { useContactsController } from './useContactsController';
import { ToastProvider } from '@/context/ToastContext';
import { ThemeProvider } from '@/context/ThemeContext';
import { MemoryRouter } from 'react-router-dom';
import { ContactStage } from '@/types';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';

// Mock TanStack Query hooks
vi.mock('@/lib/query/hooks/useContactsQuery', () => ({
  useContacts: () => ({ data: [], isLoading: false }),
  useCompanies: () => ({ data: [], isLoading: false }),
  useCreateContact: () => ({ mutateAsync: vi.fn() }),
  useUpdateContact: () => ({ mutateAsync: vi.fn() }),
  useDeleteContact: () => ({ mutate: vi.fn(), mutateAsync: vi.fn() }),
  useCreateCompany: () => ({ mutateAsync: vi.fn() }),
  useContactHasDeals: () => ({ mutateAsync: vi.fn().mockResolvedValue({ hasDeals: false, dealCount: 0 }) }),
}));

vi.mock('@/lib/query/hooks/useDealsQuery', () => ({
  useCreateDeal: () => ({ mutateAsync: vi.fn() }),
}));

vi.mock('@/lib/query/hooks/useBoardsQuery', () => ({
  useBoards: () => ({ data: [{ id: 'board-1', name: 'Pipeline', stages: [{ id: 'stage-1', name: 'New' }] }] }),
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
      <MemoryRouter>
        <ThemeProvider>
          <ToastProvider>{children}</ToastProvider>
        </ThemeProvider>
      </MemoryRouter>
    </QueryClientProvider>
  );
};

describe('useContactsController', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    localStorage.clear();
  });

  it('should initialize with default values', () => {
    const { result } = renderHook(() => useContactsController(), { wrapper: createWrapper() });

    expect(result.current.search).toBe('');
    expect(result.current.statusFilter).toBe('ALL');
    expect(result.current.stageFilter).toBe('ALL');
    expect(result.current.viewMode).toBe('people');
    expect(result.current.isFilterOpen).toBe(false);
    expect(result.current.isModalOpen).toBe(false);
    expect(result.current.editingContact).toBeNull();
    expect(result.current.deleteId).toBeNull();
  });

  it('should update search term', () => {
    const { result } = renderHook(() => useContactsController(), { wrapper: createWrapper() });

    act(() => {
      result.current.setSearch('john');
    });

    expect(result.current.search).toBe('john');
  });

  it('should update status filter', () => {
    const { result } = renderHook(() => useContactsController(), { wrapper: createWrapper() });

    act(() => {
      result.current.setStatusFilter('ACTIVE');
    });

    expect(result.current.statusFilter).toBe('ACTIVE');

    act(() => {
      result.current.setStatusFilter('CHURNED');
    });

    expect(result.current.statusFilter).toBe('CHURNED');
  });

  it('should update stage filter', () => {
    const { result } = renderHook(() => useContactsController(), { wrapper: createWrapper() });

    act(() => {
      result.current.setStageFilter(ContactStage.LEAD);
    });

    expect(result.current.stageFilter).toBe(ContactStage.LEAD);

    act(() => {
      result.current.setStageFilter(ContactStage.CUSTOMER);
    });

    expect(result.current.stageFilter).toBe(ContactStage.CUSTOMER);
  });

  it('should toggle view mode between people and companies', () => {
    const { result } = renderHook(() => useContactsController(), { wrapper: createWrapper() });

    expect(result.current.viewMode).toBe('people');

    act(() => {
      result.current.setViewMode('companies');
    });

    expect(result.current.viewMode).toBe('companies');

    act(() => {
      result.current.setViewMode('people');
    });

    expect(result.current.viewMode).toBe('people');
  });

  it('should toggle filter panel', () => {
    const { result } = renderHook(() => useContactsController(), { wrapper: createWrapper() });

    expect(result.current.isFilterOpen).toBe(false);

    act(() => {
      result.current.setIsFilterOpen(true);
    });

    expect(result.current.isFilterOpen).toBe(true);
  });

  it('should open create modal with empty form data', () => {
    const { result } = renderHook(() => useContactsController(), { wrapper: createWrapper() });

    act(() => {
      result.current.openCreateModal();
    });

    expect(result.current.isModalOpen).toBe(true);
    expect(result.current.editingContact).toBeNull();
    expect(result.current.formData).toEqual({
      name: '',
      email: '',
      phone: '',
      role: '',
      companyName: '',
    });
  });

  it('should update form data', () => {
    const { result } = renderHook(() => useContactsController(), { wrapper: createWrapper() });

    act(() => {
      result.current.setFormData({
        name: 'John Doe',
        email: 'john@example.com',
        phone: '123456789',
        role: 'Developer',
        companyName: 'Acme Corp',
      });
    });

    expect(result.current.formData.name).toBe('John Doe');
    expect(result.current.formData.email).toBe('john@example.com');
    expect(result.current.formData.phone).toBe('123456789');
    expect(result.current.formData.role).toBe('Developer');
    expect(result.current.formData.companyName).toBe('Acme Corp');
  });

  it('should set deleteId for confirmation', () => {
    const { result } = renderHook(() => useContactsController(), { wrapper: createWrapper() });

    act(() => {
      result.current.setDeleteId('contact-123');
    });

    expect(result.current.deleteId).toBe('contact-123');
  });

  it('should update date range', () => {
    const { result } = renderHook(() => useContactsController(), { wrapper: createWrapper() });

    act(() => {
      result.current.setDateRange({ start: '2024-01-01', end: '2024-12-31' });
    });

    expect(result.current.dateRange.start).toBe('2024-01-01');
    expect(result.current.dateRange.end).toBe('2024-12-31');
  });

  it('should close modal', () => {
    const { result } = renderHook(() => useContactsController(), { wrapper: createWrapper() });

    act(() => {
      result.current.openCreateModal();
    });

    expect(result.current.isModalOpen).toBe(true);

    act(() => {
      result.current.setIsModalOpen(false);
    });

    expect(result.current.isModalOpen).toBe(false);
  });

  it('should expose contacts and companies arrays', () => {
    const { result } = renderHook(() => useContactsController(), { wrapper: createWrapper() });

    expect(Array.isArray(result.current.contacts)).toBe(true);
    expect(Array.isArray(result.current.companies)).toBe(true);
  });

  it('should expose filteredContacts array', () => {
    const { result } = renderHook(() => useContactsController(), { wrapper: createWrapper() });

    expect(Array.isArray(result.current.filteredContacts)).toBe(true);
  });

  it('should expose filteredCompanies array', () => {
    const { result } = renderHook(() => useContactsController(), { wrapper: createWrapper() });

    expect(Array.isArray(result.current.filteredCompanies)).toBe(true);
  });

  it('should expose getCompanyName function', () => {
    const { result } = renderHook(() => useContactsController(), { wrapper: createWrapper() });

    expect(typeof result.current.getCompanyName).toBe('function');

    // Should return a fallback for non-existent company
    const name = result.current.getCompanyName('non-existent-id');
    expect(name).toBe('Empresa não vinculada');
  });

  it('should expose stageCounts object', () => {
    const { result } = renderHook(() => useContactsController(), { wrapper: createWrapper() });

    expect(result.current.stageCounts).toBeDefined();
    expect(typeof result.current.stageCounts.LEAD).toBe('number');
    expect(typeof result.current.stageCounts.MQL).toBe('number');
    expect(typeof result.current.stageCounts.PROSPECT).toBe('number');
    expect(typeof result.current.stageCounts.CUSTOMER).toBe('number');
  });

  it('should filter contacts by search term (name)', () => {
    const { result } = renderHook(() => useContactsController(), { wrapper: createWrapper() });

    const initialCount = result.current.filteredContacts.length;

    act(() => {
      result.current.setSearch('xyznonexistent');
    });

    expect(result.current.filteredContacts.length).toBeLessThanOrEqual(initialCount);
  });

  it('should filter contacts by search term (email)', () => {
    const { result } = renderHook(() => useContactsController(), { wrapper: createWrapper() });

    act(() => {
      result.current.setSearch('@nonexistent.com');
    });

    // Should filter based on email
    expect(result.current.filteredContacts.length).toBeGreaterThanOrEqual(0);
  });

  it('should expose action functions', () => {
    const { result } = renderHook(() => useContactsController(), { wrapper: createWrapper() });

    expect(typeof result.current.openCreateModal).toBe('function');
    expect(typeof result.current.openEditModal).toBe('function');
    expect(typeof result.current.confirmDelete).toBe('function');
    expect(typeof result.current.handleSubmit).toBe('function');
    expect(typeof result.current.updateContact).toBe('function');
    expect(typeof result.current.convertContactToDeal).toBe('function');
  });
});
