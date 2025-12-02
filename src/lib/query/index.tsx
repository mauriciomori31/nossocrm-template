/**
 * TanStack Query Configuration for FlowCRM
 *
 * Provides:
 * - Server state management
 * - Intelligent caching
 * - Automatic background refetching
 * - Centralized error handling
 * - Optimistic updates
 */
import {
  QueryClient,
  QueryClientProvider,
  useQuery,
  useMutation,
  useQueryClient,
  QueryCache,
  MutationCache,
} from '@tanstack/react-query';
import React from 'react';
import { useNotificationStore } from '@/stores';
import { ERROR_CODES, getErrorMessage } from '@/lib/validations/errorCodes';

// ============ ERROR HANDLING ============

interface APIError {
  code: string;
  message: string;
  status?: number;
}

const handleQueryError = (error: unknown) => {
  const addNotification = useNotificationStore.getState().addNotification;

  let errorMessage = getErrorMessage(ERROR_CODES.API_ERROR);

  if (error instanceof Error) {
    // Network error
    if (error.message === 'Failed to fetch') {
      errorMessage = getErrorMessage(ERROR_CODES.API_NETWORK_ERROR);
    }
    // Timeout
    else if (error.name === 'AbortError') {
      errorMessage = getErrorMessage(ERROR_CODES.API_TIMEOUT);
    }
    // API error with code
    else if ('code' in error) {
      const apiError = error as unknown as APIError;
      if (apiError.status === 401) {
        errorMessage = getErrorMessage(ERROR_CODES.API_UNAUTHORIZED);
      } else if (apiError.status === 404) {
        errorMessage = getErrorMessage(ERROR_CODES.API_NOT_FOUND);
      }
    }
  }

  addNotification({
    type: 'error',
    title: 'Erro',
    message: errorMessage,
  });
};

const handleMutationError = (error: unknown, _variables: unknown, _context: unknown) => {
  handleQueryError(error);
};

// ============ QUERY CLIENT ============

export const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      // Stale time: 5 minutes
      staleTime: 5 * 60 * 1000,
      // Cache time: 30 minutes
      gcTime: 30 * 60 * 1000,
      // Retry failed requests 3 times
      retry: 3,
      // Retry delay with exponential backoff
      retryDelay: attemptIndex => Math.min(1000 * 2 ** attemptIndex, 30000),
      // Refetch on window focus for fresh data
      refetchOnWindowFocus: true,
      // Don't refetch on mount if data is fresh
      refetchOnMount: true,
      // Refetch on reconnect
      refetchOnReconnect: true,
    },
    mutations: {
      // Retry mutations once
      retry: 1,
    },
  },
  queryCache: new QueryCache({
    onError: handleQueryError,
  }),
  mutationCache: new MutationCache({
    onError: handleMutationError,
  }),
});

// ============ PROVIDER ============

interface QueryProviderProps {
  children: React.ReactNode;
}

export const QueryProvider: React.FC<QueryProviderProps> = ({ children }) => {
  return <QueryClientProvider client={queryClient}>{children}</QueryClientProvider>;
};

// ============ QUERY KEYS ============
// Centralized query keys for cache management

export const queryKeys = {
  // Deals
  deals: {
    all: ['deals'] as const,
    lists: () => [...queryKeys.deals.all, 'list'] as const,
    list: (filters: Record<string, unknown>) => [...queryKeys.deals.lists(), filters] as const,
    details: () => [...queryKeys.deals.all, 'detail'] as const,
    detail: (id: string) => [...queryKeys.deals.details(), id] as const,
  },

  // Contacts
  contacts: {
    all: ['contacts'] as const,
    lists: () => [...queryKeys.contacts.all, 'list'] as const,
    list: (filters: Record<string, unknown>) => [...queryKeys.contacts.lists(), filters] as const,
    details: () => [...queryKeys.contacts.all, 'detail'] as const,
    detail: (id: string) => [...queryKeys.contacts.details(), id] as const,
  },

  // Companies
  companies: {
    all: ['companies'] as const,
    lists: () => [...queryKeys.companies.all, 'list'] as const,
    list: (filters: Record<string, unknown>) => [...queryKeys.companies.lists(), filters] as const,
    details: () => [...queryKeys.companies.all, 'detail'] as const,
    detail: (id: string) => [...queryKeys.companies.details(), id] as const,
  },

  // Activities
  activities: {
    all: ['activities'] as const,
    lists: () => [...queryKeys.activities.all, 'list'] as const,
    list: (filters: Record<string, unknown>) => [...queryKeys.activities.lists(), filters] as const,
    byDeal: (dealId: string) => [...queryKeys.activities.all, 'deal', dealId] as const,
  },

  // Boards
  boards: {
    all: ['boards'] as const,
    lists: () => [...queryKeys.boards.all, 'list'] as const,
    details: () => [...queryKeys.boards.all, 'detail'] as const,
    detail: (id: string) => [...queryKeys.boards.details(), id] as const,
  },

  // Dashboard
  dashboard: {
    stats: ['dashboard', 'stats'] as const,
    funnel: ['dashboard', 'funnel'] as const,
    timeline: ['dashboard', 'timeline'] as const,
  },
};

// ============ CUSTOM HOOKS ============
// These will be used when we have a real API

/**
 * Hook for optimistic updates on mutations
 */
export const useOptimisticMutation = <TData, TVariables, TContext>(options: {
  mutationFn: (variables: TVariables) => Promise<TData>;
  queryKey: readonly unknown[];
  optimisticUpdate: (oldData: TData | undefined, variables: TVariables) => TData;
  onSuccess?: (data: TData, variables: TVariables, context: TContext) => void;
  onError?: (error: Error, variables: TVariables, context: TContext | undefined) => void;
}) => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: options.mutationFn,
    onMutate: async variables => {
      // Cancel outgoing refetches
      await queryClient.cancelQueries({ queryKey: options.queryKey });

      // Snapshot previous value
      const previousData = queryClient.getQueryData<TData>(options.queryKey);

      // Optimistically update
      queryClient.setQueryData<TData>(options.queryKey, old =>
        options.optimisticUpdate(old, variables)
      );

      return { previousData } as TContext;
    },
    onError: (error, variables, context) => {
      // Rollback on error
      if (context && typeof context === 'object' && 'previousData' in context) {
        queryClient.setQueryData(
          options.queryKey,
          (context as { previousData: TData }).previousData
        );
      }
      options.onError?.(error, variables, context);
    },
    onSettled: () => {
      // Refetch after mutation
      queryClient.invalidateQueries({ queryKey: options.queryKey });
    },
    onSuccess: options.onSuccess,
  });
};

// ============ PREFETCH HELPERS ============

/**
 * Prefetch data for a route before navigation
 */
export const prefetchRouteData = async (route: string) => {
  switch (route) {
    case 'dashboard':
      await Promise.all([
        queryClient.prefetchQuery({
          queryKey: queryKeys.dashboard.stats,
          queryFn: async () => {
            // Will be replaced with actual API call
            return null;
          },
        }),
      ]);
      break;
    case 'contacts':
      await queryClient.prefetchQuery({
        queryKey: queryKeys.contacts.lists(),
        queryFn: async () => null,
      });
      break;
    // Add more routes as needed
  }
};

// Re-export hooks from TanStack Query
export { useQuery, useMutation, useQueryClient };

// Re-export entity hooks
export * from './hooks';
