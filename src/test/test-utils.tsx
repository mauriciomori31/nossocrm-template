import React, { ReactElement } from 'react';
import { render, RenderOptions } from '@testing-library/react';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { ToastProvider } from '@/context/ToastContext';
import { ThemeProvider } from '@/context/ThemeContext';
import { MemoryRouter } from 'react-router-dom';
import { vi } from 'vitest';

// Create a fresh QueryClient for each test
const createTestQueryClient = () =>
  new QueryClient({
    defaultOptions: {
      queries: {
        retry: false,
        gcTime: 0,
        staleTime: 0,
      },
      mutations: {
        retry: false,
      },
    },
  });

// Mock profile data
const mockProfile = {
  id: 'test-user-id',
  email: 'test@example.com',
  company_id: 'test-company-id',
  role: 'admin' as const,
  first_name: 'Test',
  last_name: 'User',
};

// Mock the AuthContext module
vi.mock('@/context/AuthContext', () => ({
  useAuth: () => ({
    session: null,
    user: null,
    profile: mockProfile,
    loading: false,
    isInitialized: true,
    checkInitialization: vi.fn(),
    signOut: vi.fn(),
    refreshProfile: vi.fn(),
  }),
  AuthProvider: ({ children }: { children: React.ReactNode }) => children,
}));

// Mock Supabase services to avoid real API calls
vi.mock('@/lib/supabase', () => ({
  settingsService: {
    get: vi.fn().mockResolvedValue(null),
    upsert: vi.fn().mockResolvedValue(undefined),
  },
  lifecycleStagesService: {
    getAll: vi.fn().mockResolvedValue([]),
    create: vi.fn().mockResolvedValue(null),
    update: vi.fn().mockResolvedValue(undefined),
    delete: vi.fn().mockResolvedValue(undefined),
    reorder: vi.fn().mockResolvedValue(undefined),
  },
  boardsService: {
    getAll: vi.fn().mockResolvedValue([]),
    create: vi.fn().mockResolvedValue(null),
    update: vi.fn().mockResolvedValue(undefined),
    delete: vi.fn().mockResolvedValue(undefined),
  },
  boardStagesService: {
    getAll: vi.fn().mockResolvedValue([]),
    createMany: vi.fn().mockResolvedValue([]),
    update: vi.fn().mockResolvedValue(undefined),
    delete: vi.fn().mockResolvedValue(undefined),
    reorder: vi.fn().mockResolvedValue(undefined),
  },
  contactsService: {
    getAll: vi.fn().mockResolvedValue([]),
    create: vi.fn().mockResolvedValue(null),
    update: vi.fn().mockResolvedValue(undefined),
    delete: vi.fn().mockResolvedValue(undefined),
  },
  companiesService: {
    getAll: vi.fn().mockResolvedValue([]),
    create: vi.fn().mockResolvedValue(null),
    update: vi.fn().mockResolvedValue(undefined),
    delete: vi.fn().mockResolvedValue(undefined),
  },
  dealsService: {
    getAll: vi.fn().mockResolvedValue([]),
    create: vi.fn().mockResolvedValue(null),
    update: vi.fn().mockResolvedValue(undefined),
    delete: vi.fn().mockResolvedValue(undefined),
  },
  activitiesService: {
    getAll: vi.fn().mockResolvedValue([]),
    create: vi.fn().mockResolvedValue(null),
    update: vi.fn().mockResolvedValue(undefined),
    delete: vi.fn().mockResolvedValue(undefined),
  },
}));

// Import CRMProvider AFTER mocking (so it uses mocked dependencies)
import { CRMProvider } from '@/context/CRMContext';

interface AllProvidersProps {
  children: React.ReactNode;
}

const AllProviders: React.FC<AllProvidersProps> = ({ children }) => {
  const queryClient = createTestQueryClient();

  return (
    <QueryClientProvider client={queryClient}>
      <MemoryRouter>
        <ThemeProvider>
          <ToastProvider>
            <CRMProvider>{children}</CRMProvider>
          </ToastProvider>
        </ThemeProvider>
      </MemoryRouter>
    </QueryClientProvider>
  );
};

const customRender = (ui: ReactElement, options?: Omit<RenderOptions, 'wrapper'>) =>
  render(ui, { wrapper: AllProviders, ...options });

// Re-export tudo do testing-library
export * from '@testing-library/react';
export { customRender as render };
