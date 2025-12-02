import { describe, it, expect, vi, beforeEach } from 'vitest';
import { renderHook } from '@testing-library/react';
import React from 'react';
import { useDashboardMetrics } from './useDashboardMetrics';
import { ToastProvider } from '@/context/ToastContext';
import { ThemeProvider } from '@/context/ThemeContext';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';

// Mock data
const mockDeals: any[] = [];
const mockContacts: any[] = [];

// Mock TanStack Query hooks
vi.mock('@/lib/query/hooks/useDealsQuery', () => ({
  useDeals: () => ({ data: mockDeals, isLoading: false }),
}));

vi.mock('@/lib/query/hooks/useContactsQuery', () => ({
  useContacts: () => ({ data: mockContacts, isLoading: false }),
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
      <ThemeProvider>
        <ToastProvider>{children}</ToastProvider>
      </ThemeProvider>
    </QueryClientProvider>
  );
};

describe('useDashboardMetrics', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    localStorage.clear();
  });

  it('should return deals array', () => {
    const { result } = renderHook(() => useDashboardMetrics(), { wrapper: createWrapper() });

    expect(result.current.deals).toBeDefined();
    expect(Array.isArray(result.current.deals)).toBe(true);
  });

  it('should calculate totalValue as a number', () => {
    const { result } = renderHook(() => useDashboardMetrics(), { wrapper: createWrapper() });

    expect(typeof result.current.totalValue).toBe('number');
    expect(result.current.totalValue).toBeGreaterThanOrEqual(0);
  });

  it('should return wonDeals array', () => {
    const { result } = renderHook(() => useDashboardMetrics(), { wrapper: createWrapper() });

    expect(result.current.wonDeals).toBeDefined();
    expect(Array.isArray(result.current.wonDeals)).toBe(true);
  });

  it('should calculate winRate as a percentage', () => {
    const { result } = renderHook(() => useDashboardMetrics(), { wrapper: createWrapper() });

    expect(typeof result.current.winRate).toBe('number');
    expect(result.current.winRate).toBeGreaterThanOrEqual(0);
    expect(result.current.winRate).toBeLessThanOrEqual(100);
  });

  it('should calculate pipelineValue', () => {
    const { result } = renderHook(() => useDashboardMetrics(), { wrapper: createWrapper() });

    expect(typeof result.current.pipelineValue).toBe('number');
    expect(result.current.pipelineValue).toBeGreaterThanOrEqual(0);
  });

  it('should return topDeals with at most 4 items', () => {
    const { result } = renderHook(() => useDashboardMetrics(), { wrapper: createWrapper() });

    expect(result.current.topDeals).toBeDefined();
    expect(Array.isArray(result.current.topDeals)).toBe(true);
    expect(result.current.topDeals.length).toBeLessThanOrEqual(4);
  });

  it('should return funnelData with correct structure', () => {
    const { result } = renderHook(() => useDashboardMetrics(), { wrapper: createWrapper() });

    expect(result.current.funnelData).toBeDefined();
    expect(Array.isArray(result.current.funnelData)).toBe(true);
    expect(result.current.funnelData.length).toBe(5); // 5 stages

    result.current.funnelData.forEach(item => {
      expect(item).toHaveProperty('name');
      expect(item).toHaveProperty('count');
      expect(typeof item.count).toBe('number');
    });
  });

  it('should return trendData with 6 months', () => {
    const { result } = renderHook(() => useDashboardMetrics(), { wrapper: createWrapper() });

    expect(result.current.trendData).toBeDefined();
    expect(Array.isArray(result.current.trendData)).toBe(true);
    expect(result.current.trendData.length).toBe(6);

    result.current.trendData.forEach(item => {
      expect(item).toHaveProperty('month');
      expect(item).toHaveProperty('revenue');
      expect(typeof item.month).toBe('string');
      expect(typeof item.revenue).toBe('number');
    });
  });

  it('should return contact status arrays', () => {
    const { result } = renderHook(() => useDashboardMetrics(), { wrapper: createWrapper() });

    expect(Array.isArray(result.current.activeContacts)).toBe(true);
    expect(Array.isArray(result.current.inactiveContacts)).toBe(true);
    expect(Array.isArray(result.current.churnedContacts)).toBe(true);
  });

  it('should calculate contact percentages', () => {
    const { result } = renderHook(() => useDashboardMetrics(), { wrapper: createWrapper() });

    expect(typeof result.current.activePercent).toBe('number');
    expect(typeof result.current.inactivePercent).toBe('number');
    expect(typeof result.current.churnedPercent).toBe('number');

    // Percentages should be between 0 and 100
    expect(result.current.activePercent).toBeGreaterThanOrEqual(0);
    expect(result.current.activePercent).toBeLessThanOrEqual(100);
    expect(result.current.inactivePercent).toBeGreaterThanOrEqual(0);
    expect(result.current.inactivePercent).toBeLessThanOrEqual(100);
    expect(result.current.churnedPercent).toBeGreaterThanOrEqual(0);
    expect(result.current.churnedPercent).toBeLessThanOrEqual(100);
  });

  it('should calculate avgLTV', () => {
    const { result } = renderHook(() => useDashboardMetrics(), { wrapper: createWrapper() });

    expect(typeof result.current.avgLTV).toBe('number');
    expect(result.current.avgLTV).toBeGreaterThanOrEqual(0);
  });

  it('should calculate riskyCount', () => {
    const { result } = renderHook(() => useDashboardMetrics(), { wrapper: createWrapper() });

    expect(typeof result.current.riskyCount).toBe('number');
    expect(result.current.riskyCount).toBeGreaterThanOrEqual(0);
  });

  it('should calculate sales cycle metrics', () => {
    const { result } = renderHook(() => useDashboardMetrics(), { wrapper: createWrapper() });

    expect(typeof result.current.avgSalesCycle).toBe('number');
    expect(typeof result.current.fastestDeal).toBe('number');
    expect(typeof result.current.slowestDeal).toBe('number');

    expect(result.current.avgSalesCycle).toBeGreaterThanOrEqual(0);
    expect(result.current.fastestDeal).toBeGreaterThanOrEqual(0);
    expect(result.current.slowestDeal).toBeGreaterThanOrEqual(0);
  });

  it('should calculate actualWinRate', () => {
    const { result } = renderHook(() => useDashboardMetrics(), { wrapper: createWrapper() });

    expect(typeof result.current.actualWinRate).toBe('number');
    expect(result.current.actualWinRate).toBeGreaterThanOrEqual(0);
    expect(result.current.actualWinRate).toBeLessThanOrEqual(100);
  });

  it('should return lostDeals array', () => {
    const { result } = renderHook(() => useDashboardMetrics(), { wrapper: createWrapper() });

    expect(result.current.lostDeals).toBeDefined();
    expect(Array.isArray(result.current.lostDeals)).toBe(true);
  });

  it('should return topLossReasons with at most 3 items', () => {
    const { result } = renderHook(() => useDashboardMetrics(), { wrapper: createWrapper() });

    expect(result.current.topLossReasons).toBeDefined();
    expect(Array.isArray(result.current.topLossReasons)).toBe(true);
    expect(result.current.topLossReasons.length).toBeLessThanOrEqual(3);
  });

  it('should return wonDealsWithDates array', () => {
    const { result } = renderHook(() => useDashboardMetrics(), { wrapper: createWrapper() });

    expect(result.current.wonDealsWithDates).toBeDefined();
    expect(Array.isArray(result.current.wonDealsWithDates)).toBe(true);
  });

  it('should have consistent funnel stage names', () => {
    const { result } = renderHook(() => useDashboardMetrics(), { wrapper: createWrapper() });

    const expectedStages = ['Novos', 'Contatos', 'Proposta', 'Negoc.', 'Ganho'];
    const actualStages = result.current.funnelData.map(d => d.name);

    expect(actualStages).toEqual(expectedStages);
  });
});
