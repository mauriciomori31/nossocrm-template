import { describe, it, expect, vi, beforeEach } from 'vitest';
import { renderHook, act } from '@testing-library/react';
import { useCompaniesLogic } from '@/hooks/useCompaniesLogic';
import { Company } from '@/types';

// Mock usePersistedState with proper state handling
let mockCompaniesState: Company[] = [];

vi.mock('@/hooks/usePersistedState', () => ({
  usePersistedState: vi.fn(() => {
    const setState = (updater: Company[] | ((prev: Company[]) => Company[])) => {
      mockCompaniesState = typeof updater === 'function' ? updater(mockCompaniesState) : updater;
    };
    return [mockCompaniesState, setState];
  }),
}));

describe('useCompaniesLogic', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mockCompaniesState = [];
  });

  it('should initialize with companies array', () => {
    const { result } = renderHook(() => useCompaniesLogic());
    expect(result.current.companies).toBeDefined();
    expect(Array.isArray(result.current.companies)).toBe(true);
  });

  it('should expose addCompany function', () => {
    const { result } = renderHook(() => useCompaniesLogic());
    expect(typeof result.current.addCompany).toBe('function');
  });

  it('should expose setCompanies function', () => {
    const { result } = renderHook(() => useCompaniesLogic());
    expect(typeof result.current.setCompanies).toBe('function');
  });

  it('should add a new company', () => {
    const { result } = renderHook(() => useCompaniesLogic());

    const newCompany: Company = {
      id: 'company-1',
      name: 'Acme Corporation',
      industry: 'Technology',
      website: 'https://acme.com',
      createdAt: new Date().toISOString(),
    };

    act(() => {
      result.current.addCompany(newCompany);
    });

    expect(mockCompaniesState).toHaveLength(1);
    expect(mockCompaniesState[0]).toEqual(newCompany);
  });

  it('should add multiple companies', () => {
    const { result } = renderHook(() => useCompaniesLogic());

    const company1: Company = {
      id: 'company-1',
      name: 'First Corp',
      createdAt: new Date().toISOString(),
    };
    const company2: Company = {
      id: 'company-2',
      name: 'Second Corp',
      createdAt: new Date().toISOString(),
    };

    act(() => {
      result.current.addCompany(company1);
    });

    act(() => {
      result.current.addCompany(company2);
    });

    expect(mockCompaniesState).toHaveLength(2);
  });

  it('should handle company with minimal fields', () => {
    const { result } = renderHook(() => useCompaniesLogic());

    const minimalCompany: Company = {
      id: 'company-1',
      name: 'Minimal Corp',
      createdAt: new Date().toISOString(),
    };

    act(() => {
      result.current.addCompany(minimalCompany);
    });

    expect(mockCompaniesState[0].industry).toBeUndefined();
    expect(mockCompaniesState[0].website).toBeUndefined();
  });

  it('should handle company with all fields', () => {
    const { result } = renderHook(() => useCompaniesLogic());

    const fullCompany: Company = {
      id: 'company-1',
      name: 'Full Corp',
      industry: 'Healthcare',
      website: 'https://fullcorp.com',
      createdAt: new Date().toISOString(),
    };

    act(() => {
      result.current.addCompany(fullCompany);
    });

    expect(mockCompaniesState[0].industry).toBe('Healthcare');
    expect(mockCompaniesState[0].website).toBe('https://fullcorp.com');
  });

  it('should set companies array directly', () => {
    const { result } = renderHook(() => useCompaniesLogic());

    const companies: Company[] = [
      { id: 'company-1', name: 'Corp 1', createdAt: new Date().toISOString() },
      { id: 'company-2', name: 'Corp 2', createdAt: new Date().toISOString() },
      { id: 'company-3', name: 'Corp 3', createdAt: new Date().toISOString() },
    ];

    act(() => {
      result.current.setCompanies(companies);
    });

    expect(mockCompaniesState).toHaveLength(3);
  });
});
