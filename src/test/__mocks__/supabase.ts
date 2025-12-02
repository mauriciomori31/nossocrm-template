/**
 * Mock do cliente Supabase para testes
 */
import { vi } from 'vitest';

// Mock session data
export const mockSession = {
  user: {
    id: 'test-user-id',
    email: 'test@example.com',
    app_metadata: {},
    user_metadata: {},
    aud: 'authenticated',
    created_at: new Date().toISOString(),
  },
  access_token: 'mock-access-token',
  refresh_token: 'mock-refresh-token',
  token_type: 'bearer',
  expires_in: 3600,
  expires_at: Date.now() + 3600000,
};

export const mockProfile = {
  id: 'test-user-id',
  email: 'test@example.com',
  company_id: 'test-company-id',
  role: 'admin' as const,
  first_name: 'Test',
  last_name: 'User',
  nickname: null,
  phone: null,
  avatar_url: null,
  created_at: new Date().toISOString(),
};

// Mock Supabase auth
export const mockAuth = {
  getSession: vi.fn().mockResolvedValue({ data: { session: mockSession }, error: null }),
  getUser: vi.fn().mockResolvedValue({ data: { user: mockSession.user }, error: null }),
  onAuthStateChange: vi.fn().mockReturnValue({
    data: { subscription: { unsubscribe: vi.fn() } },
  }),
  signOut: vi.fn().mockResolvedValue({ error: null }),
  signInWithPassword: vi.fn().mockResolvedValue({ data: { session: mockSession }, error: null }),
};

// Mock Supabase query builder
const createMockQueryBuilder = () => {
  const builder: any = {
    select: vi.fn().mockReturnThis(),
    insert: vi.fn().mockReturnThis(),
    update: vi.fn().mockReturnThis(),
    delete: vi.fn().mockReturnThis(),
    upsert: vi.fn().mockReturnThis(),
    eq: vi.fn().mockReturnThis(),
    neq: vi.fn().mockReturnThis(),
    gt: vi.fn().mockReturnThis(),
    gte: vi.fn().mockReturnThis(),
    lt: vi.fn().mockReturnThis(),
    lte: vi.fn().mockReturnThis(),
    like: vi.fn().mockReturnThis(),
    ilike: vi.fn().mockReturnThis(),
    is: vi.fn().mockReturnThis(),
    in: vi.fn().mockReturnThis(),
    contains: vi.fn().mockReturnThis(),
    containedBy: vi.fn().mockReturnThis(),
    order: vi.fn().mockReturnThis(),
    limit: vi.fn().mockReturnThis(),
    range: vi.fn().mockReturnThis(),
    single: vi.fn().mockResolvedValue({ data: null, error: null }),
    maybeSingle: vi.fn().mockResolvedValue({ data: null, error: null }),
    then: vi
      .fn()
      .mockImplementation(callback => Promise.resolve({ data: [], error: null }).then(callback)),
  };
  return builder;
};

// Mock Supabase realtime channel
export const mockChannel = {
  on: vi.fn().mockReturnThis(),
  subscribe: vi.fn().mockReturnValue({ unsubscribe: vi.fn() }),
  unsubscribe: vi.fn(),
};

// Mock Supabase client
export const supabase = {
  auth: mockAuth,
  from: vi.fn().mockReturnValue(createMockQueryBuilder()),
  rpc: vi.fn().mockResolvedValue({ data: true, error: null }),
  channel: vi.fn().mockReturnValue(mockChannel),
  removeChannel: vi.fn(),
  storage: {
    from: vi.fn().mockReturnValue({
      upload: vi.fn().mockResolvedValue({ data: { path: 'test-path' }, error: null }),
      getPublicUrl: vi.fn().mockReturnValue({ data: { publicUrl: 'https://test.url' } }),
      download: vi.fn().mockResolvedValue({ data: new Blob(), error: null }),
      remove: vi.fn().mockResolvedValue({ data: null, error: null }),
    }),
  },
};

// Mock settings service
export const settingsService = {
  get: vi.fn().mockResolvedValue({
    data: {
      aiProvider: 'google',
      aiApiKey: '',
      aiModel: 'gemini-2.5-flash',
      aiThinking: true,
      aiSearch: true,
      aiAnthropicCaching: false,
      darkMode: true,
      defaultRoute: '/dashboard',
      activeBoardId: null,
      inboxViewMode: 'list',
      onboardingCompleted: false,
    },
    error: null,
  }),
  createDefault: vi.fn().mockResolvedValue({ data: null, error: null }),
  update: vi.fn().mockResolvedValue({ error: null }),
};

// Mock lifecycle stages service
export const lifecycleStagesService = {
  getAll: vi.fn().mockResolvedValue({
    data: [
      { id: '1', name: 'Lead', color: 'bg-blue-500', order: 0, isDefault: true },
      { id: '2', name: 'MQL', color: 'bg-yellow-500', order: 1, isDefault: true },
      { id: '3', name: 'Prospect', color: 'bg-orange-500', order: 2, isDefault: true },
      { id: '4', name: 'Customer', color: 'bg-green-500', order: 3, isDefault: true },
    ],
    error: null,
  }),
  create: vi.fn().mockImplementation(stage =>
    Promise.resolve({
      data: {
        id: `stage-${Date.now()}`,
        ...stage,
        isDefault: false,
      },
      error: null,
    })
  ),
  update: vi.fn().mockResolvedValue({ data: null, error: null }),
  delete: vi.fn().mockResolvedValue({ error: null }),
  reorder: vi.fn().mockResolvedValue({ error: null }),
};

// Mock contacts service
export const contactsService = {
  getAll: vi.fn().mockResolvedValue({ data: [], error: null }),
  getById: vi.fn().mockResolvedValue({ data: null, error: null }),
  create: vi.fn().mockResolvedValue({ data: { id: 'new-contact-id' }, error: null }),
  update: vi.fn().mockResolvedValue({ data: null, error: null }),
  delete: vi.fn().mockResolvedValue({ error: null }),
};

// Mock companies service
export const companiesService = {
  getAll: vi.fn().mockResolvedValue({ data: [], error: null }),
  getById: vi.fn().mockResolvedValue({ data: null, error: null }),
  create: vi.fn().mockResolvedValue({ data: { id: 'new-company-id' }, error: null }),
  update: vi.fn().mockResolvedValue({ data: null, error: null }),
  delete: vi.fn().mockResolvedValue({ error: null }),
};

// Mock boards service
export const boardsService = {
  getAll: vi.fn().mockResolvedValue({ data: [], error: null }),
  getById: vi.fn().mockResolvedValue({ data: null, error: null }),
  create: vi.fn().mockResolvedValue({ data: { id: 'new-board-id' }, error: null }),
  update: vi.fn().mockResolvedValue({ data: null, error: null }),
  delete: vi.fn().mockResolvedValue({ error: null }),
  createFromTemplate: vi.fn().mockResolvedValue({ data: { id: 'new-board-id' }, error: null }),
};

// Mock board stages service
export const boardStagesService = {
  getAll: vi.fn().mockResolvedValue({ data: [], error: null }),
  getByBoardId: vi.fn().mockResolvedValue({ data: [], error: null }),
  create: vi.fn().mockResolvedValue({ data: { id: 'new-stage-id' }, error: null }),
  update: vi.fn().mockResolvedValue({ data: null, error: null }),
  delete: vi.fn().mockResolvedValue({ error: null }),
  reorder: vi.fn().mockResolvedValue({ error: null }),
};

// Mock deals service
export const dealsService = {
  getAll: vi.fn().mockResolvedValue({ data: [], error: null }),
  getById: vi.fn().mockResolvedValue({ data: null, error: null }),
  create: vi.fn().mockResolvedValue({ data: { id: 'new-deal-id' }, error: null }),
  update: vi.fn().mockResolvedValue({ data: null, error: null }),
  delete: vi.fn().mockResolvedValue({ error: null }),
  updateStage: vi.fn().mockResolvedValue({ data: null, error: null }),
};

// Mock activities service
export const activitiesService = {
  getAll: vi.fn().mockResolvedValue({ data: [], error: null }),
  getById: vi.fn().mockResolvedValue({ data: null, error: null }),
  create: vi.fn().mockResolvedValue({ data: { id: 'new-activity-id' }, error: null }),
  update: vi.fn().mockResolvedValue({ data: null, error: null }),
  delete: vi.fn().mockResolvedValue({ error: null }),
  toggleComplete: vi.fn().mockResolvedValue({ data: null, error: null }),
};

export default supabase;
