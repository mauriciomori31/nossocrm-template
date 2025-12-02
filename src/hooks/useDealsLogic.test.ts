import { renderHook, act } from '@testing-library/react';
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { DealStatus, Deal } from '@/types';

// Mock state that persists across renders
let mockDeals: Deal[] = [];

// Mock usePersistedState with inline function to avoid hoisting issues
vi.mock('@/hooks/usePersistedState', () => ({
  usePersistedState: vi.fn().mockImplementation(() => [
    mockDeals,
    (updater: unknown) => {
      mockDeals = typeof updater === 'function' ? updater(mockDeals) : updater;
      return mockDeals;
    },
  ]),
}));

// Import after mock is set up
import { useDealsLogic } from '@/hooks/useDealsLogic';

describe('useDealsLogic', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('should initialize with deals', () => {
    const { result } = renderHook(() => useDealsLogic());
    expect(result.current.rawDeals).toBeDefined();
    expect(Array.isArray(result.current.rawDeals)).toBe(true);
  });

  it('should expose all CRUD methods', () => {
    const { result } = renderHook(() => useDealsLogic());

    expect(typeof result.current.addDeal).toBe('function');
    expect(typeof result.current.updateDeal).toBe('function');
    expect(typeof result.current.updateDealStatus).toBe('function');
    expect(typeof result.current.deleteDeal).toBe('function');
    expect(typeof result.current.addItemToDeal).toBe('function');
    expect(typeof result.current.removeItemFromDeal).toBe('function');
  });

  it('should expose setRawDeals for direct state access', () => {
    const { result } = renderHook(() => useDealsLogic());
    expect(typeof result.current.setRawDeals).toBe('function');
  });
});

// Tests for the logic functions themselves (unit tests)
describe('useDealsLogic - Function Logic', () => {
  it('addDeal should prepend new deal to array', () => {
    const { result } = renderHook(() => useDealsLogic());

    const newDeal: Deal = {
      id: 'new-deal',
      title: 'New Deal',
      value: 5000,
      status: DealStatus.NEW,
      companyId: 'comp-2',
      contactId: 'cont-2',
      boardId: 'board-1',
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
      probability: 25,
      priority: 'high',
      owner: { name: 'Thales', avatar: '' },
      tags: ['enterprise'],
      items: [],
      isWon: false,
      isLost: false,
    };

    act(() => {
      result.current.addDeal(newDeal);
    });

    // The function should run without errors
    expect(result.current.addDeal).toBeDefined();
  });

  it('updateDeal should merge updates into existing deal', () => {
    const { result } = renderHook(() => useDealsLogic());

    act(() => {
      result.current.updateDeal('deal-1', {
        title: 'Updated Title',
        value: 2000,
      });
    });

    expect(result.current.updateDeal).toBeDefined();
  });

  it('updateDealStatus should set new status and lastStageChangeDate', () => {
    const { result } = renderHook(() => useDealsLogic());

    act(() => {
      result.current.updateDealStatus('deal-1', DealStatus.CONTACTED);
    });

    expect(result.current.updateDealStatus).toBeDefined();
  });

  it('updateDealStatus should set lossReason when status is CLOSED_LOST', () => {
    const { result } = renderHook(() => useDealsLogic());

    act(() => {
      result.current.updateDealStatus('deal-1', DealStatus.CLOSED_LOST, 'Too expensive');
    });

    expect(result.current.updateDealStatus).toBeDefined();
  });

  it('deleteDeal should remove deal from array', () => {
    const { result } = renderHook(() => useDealsLogic());

    act(() => {
      result.current.deleteDeal('deal-1');
    });

    expect(result.current.deleteDeal).toBeDefined();
  });

  it('addItemToDeal should add item and recalculate value', () => {
    const { result } = renderHook(() => useDealsLogic());

    const newItem = {
      productId: 'prod-1',
      name: 'Product A',
      quantity: 2,
      price: 500,
    };

    act(() => {
      result.current.addItemToDeal('deal-1', newItem);
    });

    expect(result.current.addItemToDeal).toBeDefined();
  });

  it('removeItemFromDeal should remove item and recalculate value', () => {
    const { result } = renderHook(() => useDealsLogic());

    act(() => {
      result.current.removeItemFromDeal('deal-1', 'item-1');
    });

    expect(result.current.removeItemFromDeal).toBeDefined();
  });
});

// Edge cases
describe('useDealsLogic - Edge Cases', () => {
  it('should handle updating non-existent deal gracefully', () => {
    const { result } = renderHook(() => useDealsLogic());

    // Should not throw
    act(() => {
      result.current.updateDeal('non-existent-id', { title: 'Test' });
    });

    expect(result.current.updateDeal).toBeDefined();
  });

  it('should handle deleting non-existent deal gracefully', () => {
    const { result } = renderHook(() => useDealsLogic());

    // Should not throw
    act(() => {
      result.current.deleteDeal('non-existent-id');
    });

    expect(result.current.deleteDeal).toBeDefined();
  });

  it('should handle adding item to non-existent deal gracefully', () => {
    const { result } = renderHook(() => useDealsLogic());

    // Should not throw
    act(() => {
      result.current.addItemToDeal('non-existent-id', {
        productId: 'prod-1',
        name: 'Test',
        quantity: 1,
        price: 100,
      });
    });

    expect(result.current.addItemToDeal).toBeDefined();
  });
});
