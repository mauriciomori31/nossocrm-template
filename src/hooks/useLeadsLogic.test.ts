import { describe, it, expect, vi, beforeEach } from 'vitest';
import { renderHook, act } from '@testing-library/react';
import { useLeadsLogic } from '@/hooks/useLeadsLogic';
import { Lead } from '@/types';

// Mock usePersistedState with proper state handling
let mockLeadsState: Lead[] = [];

vi.mock('@/hooks/usePersistedState', () => ({
  usePersistedState: vi.fn(() => {
    const setState = (updater: Lead[] | ((prev: Lead[]) => Lead[])) => {
      mockLeadsState = typeof updater === 'function' ? updater(mockLeadsState) : updater;
    };
    return [mockLeadsState, setState];
  }),
}));

describe('useLeadsLogic', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mockLeadsState = [];
  });

  it('should initialize with leads array', () => {
    const { result } = renderHook(() => useLeadsLogic());
    expect(result.current.leads).toBeDefined();
    expect(Array.isArray(result.current.leads)).toBe(true);
  });

  it('should expose addLead function', () => {
    const { result } = renderHook(() => useLeadsLogic());
    expect(typeof result.current.addLead).toBe('function');
  });

  it('should expose updateLead function', () => {
    const { result } = renderHook(() => useLeadsLogic());
    expect(typeof result.current.updateLead).toBe('function');
  });

  it('should expose discardLead function', () => {
    const { result } = renderHook(() => useLeadsLogic());
    expect(typeof result.current.discardLead).toBe('function');
  });

  it('should add a new lead to the beginning of the list', () => {
    const { result } = renderHook(() => useLeadsLogic());

    const newLead: Lead = {
      id: 'lead-1',
      name: 'John Smith',
      email: 'john.smith@example.com',
      companyName: 'Acme Corp',
      role: 'CEO',
      source: 'WEBSITE',
      status: 'NEW',
      createdAt: new Date().toISOString(),
    };

    act(() => {
      result.current.addLead(newLead);
    });

    expect(mockLeadsState).toHaveLength(1);
    expect(mockLeadsState[0]).toEqual(newLead);
  });

  it('should add new leads at the beginning (most recent first)', () => {
    const lead1: Lead = {
      id: 'lead-1',
      name: 'First Lead',
      email: 'first@example.com',
      companyName: 'First Corp',
      source: 'MANUAL',
      status: 'NEW',
      createdAt: '2024-01-01T00:00:00Z',
    };
    mockLeadsState = [lead1];

    const { result } = renderHook(() => useLeadsLogic());

    const lead2: Lead = {
      id: 'lead-2',
      name: 'Second Lead',
      email: 'second@example.com',
      companyName: 'Second Corp',
      source: 'LINKEDIN',
      status: 'NEW',
      createdAt: '2024-01-02T00:00:00Z',
    };

    act(() => {
      result.current.addLead(lead2);
    });

    expect(mockLeadsState).toHaveLength(2);
    expect(mockLeadsState[0].id).toBe('lead-2'); // New lead at the beginning
  });

  it('should update an existing lead', () => {
    const existingLead: Lead = {
      id: 'lead-1',
      name: 'John Smith',
      email: 'john@example.com',
      companyName: 'Acme Corp',
      source: 'WEBSITE',
      status: 'NEW',
      createdAt: new Date().toISOString(),
    };
    mockLeadsState = [existingLead];

    const { result } = renderHook(() => useLeadsLogic());

    act(() => {
      result.current.updateLead('lead-1', { status: 'CONTACTED', notes: 'Called today' });
    });

    expect(mockLeadsState[0].status).toBe('CONTACTED');
    expect(mockLeadsState[0].notes).toBe('Called today');
    expect(mockLeadsState[0].name).toBe('John Smith'); // Unchanged
  });

  it('should not update lead if id does not exist', () => {
    const existingLead: Lead = {
      id: 'lead-1',
      name: 'John Smith',
      email: 'john@example.com',
      companyName: 'Acme Corp',
      source: 'WEBSITE',
      status: 'NEW',
      createdAt: new Date().toISOString(),
    };
    mockLeadsState = [existingLead];

    const { result } = renderHook(() => useLeadsLogic());

    act(() => {
      result.current.updateLead('non-existent', { status: 'CONTACTED' });
    });

    expect(mockLeadsState[0].status).toBe('NEW'); // Unchanged
  });

  it('should discard a lead by id', () => {
    const lead1: Lead = {
      id: 'lead-1',
      name: 'John Smith',
      email: 'john@example.com',
      companyName: 'Acme Corp',
      source: 'WEBSITE',
      status: 'NEW',
      createdAt: new Date().toISOString(),
    };
    const lead2: Lead = {
      id: 'lead-2',
      name: 'Jane Doe',
      email: 'jane@example.com',
      companyName: 'Beta Inc',
      source: 'REFERRAL',
      status: 'QUALIFIED',
      createdAt: new Date().toISOString(),
    };
    mockLeadsState = [lead1, lead2];

    const { result } = renderHook(() => useLeadsLogic());

    act(() => {
      result.current.discardLead('lead-1');
    });

    expect(mockLeadsState).toHaveLength(1);
    expect(mockLeadsState[0].id).toBe('lead-2');
  });

  it('should handle discarding non-existent lead gracefully', () => {
    const lead1: Lead = {
      id: 'lead-1',
      name: 'John Smith',
      email: 'john@example.com',
      companyName: 'Acme Corp',
      source: 'WEBSITE',
      status: 'NEW',
      createdAt: new Date().toISOString(),
    };
    mockLeadsState = [lead1];

    const { result } = renderHook(() => useLeadsLogic());

    act(() => {
      result.current.discardLead('non-existent');
    });

    expect(mockLeadsState).toHaveLength(1);
  });

  it('should handle all lead sources', () => {
    const { result } = renderHook(() => useLeadsLogic());

    const sources: Lead['source'][] = ['WEBSITE', 'LINKEDIN', 'REFERRAL', 'MANUAL'];

    sources.forEach((source, index) => {
      const lead: Lead = {
        id: `lead-${index}`,
        name: `Lead ${index}`,
        email: `lead${index}@example.com`,
        companyName: `Company ${index}`,
        source,
        status: 'NEW',
        createdAt: new Date().toISOString(),
      };

      act(() => {
        result.current.addLead(lead);
      });
    });

    expect(mockLeadsState).toHaveLength(4);
  });

  it('should handle all lead statuses', () => {
    const existingLead: Lead = {
      id: 'lead-1',
      name: 'John Smith',
      email: 'john@example.com',
      companyName: 'Acme Corp',
      source: 'WEBSITE',
      status: 'NEW',
      createdAt: new Date().toISOString(),
    };
    mockLeadsState = [existingLead];

    const { result } = renderHook(() => useLeadsLogic());

    const statuses: Lead['status'][] = ['NEW', 'CONTACTED', 'QUALIFIED', 'DISQUALIFIED'];

    statuses.forEach(status => {
      act(() => {
        result.current.updateLead('lead-1', { status });
      });
      expect(mockLeadsState[0].status).toBe(status);
    });
  });
});
