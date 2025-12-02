/**
 * Zustand Store for FlowCRM
 *
 * Optimized global state management to reduce unnecessary re-renders
 *
 * Benefits over Context API:
 * - Selective subscriptions (components only re-render when their slice changes)
 * - No provider nesting required
 * - Built-in devtools support
 * - Simpler async actions
 */
import { create } from 'zustand';
import { devtools, persist, subscribeWithSelector } from 'zustand/middleware';
import { immer } from 'zustand/middleware/immer';
import type { Deal, Contact, Company, Activity, Board } from '@/types';

// ============ UI STATE STORE ============
// For ephemeral UI state that doesn't need persistence

interface UIState {
  // Sidebar
  sidebarOpen: boolean;
  toggleSidebar: () => void;

  // AI Assistant
  aiAssistantOpen: boolean;
  setAIAssistantOpen: (open: boolean) => void;
  toggleAIAssistant: () => void;

  // Modals
  activeModal: string | null;
  modalData: Record<string, unknown>;
  openModal: (modalId: string, data?: Record<string, unknown>) => void;
  closeModal: () => void;

  // Search
  globalSearchQuery: string;
  setGlobalSearchQuery: (query: string) => void;

  // Loading states
  loadingStates: Record<string, boolean>;
  setLoading: (key: string, loading: boolean) => void;
  isLoading: (key: string) => boolean;
}

export const useUIStore = create<UIState>()(
  devtools(
    subscribeWithSelector((set, get) => ({
      // Sidebar
      sidebarOpen: true,
      toggleSidebar: () => set(state => ({ sidebarOpen: !state.sidebarOpen })),

      // AI Assistant
      aiAssistantOpen: false,
      setAIAssistantOpen: open => set({ aiAssistantOpen: open }),
      toggleAIAssistant: () => set(state => ({ aiAssistantOpen: !state.aiAssistantOpen })),

      // Modals
      activeModal: null,
      modalData: {},
      openModal: (modalId, data = {}) => set({ activeModal: modalId, modalData: data }),
      closeModal: () => set({ activeModal: null, modalData: {} }),

      // Search
      globalSearchQuery: '',
      setGlobalSearchQuery: query => set({ globalSearchQuery: query }),

      // Loading states
      loadingStates: {},
      setLoading: (key, loading) =>
        set(state => ({
          loadingStates: { ...state.loadingStates, [key]: loading },
        })),
      isLoading: key => get().loadingStates[key] ?? false,
    })),
    { name: 'ui-store' }
  )
);

// ============ FORM STATE STORE ============
// For form drafts and validation states

interface FormDraft {
  data: Record<string, unknown>;
  savedAt: number;
}

interface FormState {
  // Form drafts (auto-save)
  drafts: Record<string, FormDraft>;
  saveDraft: (formId: string, data: Record<string, unknown>) => void;
  getDraft: (formId: string) => FormDraft | null;
  clearDraft: (formId: string) => void;
  clearAllDrafts: () => void;

  // Form submission tracking
  submitting: Record<string, boolean>;
  setSubmitting: (formId: string, submitting: boolean) => void;
  isSubmitting: (formId: string) => boolean;
}

export const useFormStore = create<FormState>()(
  devtools(
    persist(
      (set, get) => ({
        // Drafts
        drafts: {},
        saveDraft: (formId, data) =>
          set(state => ({
            drafts: {
              ...state.drafts,
              [formId]: { data, savedAt: Date.now() },
            },
          })),
        getDraft: formId => get().drafts[formId] ?? null,
        clearDraft: formId =>
          set(state => {
            const { [formId]: _, ...rest } = state.drafts;
            return { drafts: rest };
          }),
        clearAllDrafts: () => set({ drafts: {} }),

        // Submission
        submitting: {},
        setSubmitting: (formId, submitting) =>
          set(state => ({
            submitting: { ...state.submitting, [formId]: submitting },
          })),
        isSubmitting: formId => get().submitting[formId] ?? false,
      }),
      {
        name: 'form-drafts',
        partialize: state => ({ drafts: state.drafts }), // Only persist drafts
      }
    ),
    { name: 'form-store' }
  )
);

// ============ NOTIFICATIONS STORE ============

export interface Notification {
  id: string;
  type: 'success' | 'error' | 'warning' | 'info';
  title: string;
  message?: string;
  duration?: number;
  action?: {
    label: string;
    onClick: () => void;
  };
}

interface NotificationState {
  notifications: Notification[];
  addNotification: (notification: Omit<Notification, 'id'>) => string;
  removeNotification: (id: string) => void;
  clearAll: () => void;
}

export const useNotificationStore = create<NotificationState>()(
  devtools(
    (set, get) => ({
      notifications: [],

      addNotification: notification => {
        const id = crypto.randomUUID();
        set(state => ({
          notifications: [...state.notifications, { ...notification, id }],
        }));

        // Auto-remove after duration
        const duration = notification.duration ?? 5000;
        if (duration > 0) {
          setTimeout(() => {
            get().removeNotification(id);
          }, duration);
        }

        return id;
      },

      removeNotification: id =>
        set(state => ({
          notifications: state.notifications.filter(n => n.id !== id),
        })),

      clearAll: () => set({ notifications: [] }),
    }),
    { name: 'notification-store' }
  )
);

// ============ SELECTOR HOOKS ============
// Fine-grained selectors for optimal re-render performance

// UI selectors
export const useSidebarOpen = () => useUIStore(state => state.sidebarOpen);
export const useAIAssistantOpen = () => useUIStore(state => state.aiAssistantOpen);
export const useActiveModal = () => useUIStore(state => state.activeModal);
export const useModalData = () => useUIStore(state => state.modalData);
export const useGlobalSearch = () => useUIStore(state => state.globalSearchQuery);

// Form selectors
export const useFormDraft = (formId: string) => useFormStore(state => state.drafts[formId] ?? null);
export const useIsFormSubmitting = (formId: string) =>
  useFormStore(state => state.submitting[formId] ?? false);

// Notification selectors
export const useNotifications = () => useNotificationStore(state => state.notifications);

// ============ HELPER HOOKS ============

/**
 * Hook to auto-save form drafts
 */
export const useFormDraftAutoSave = (
  formId: string,
  data: Record<string, unknown>,
  debounceMs = 1000
) => {
  const saveDraft = useFormStore(state => state.saveDraft);

  React.useEffect(() => {
    const timer = setTimeout(() => {
      if (Object.keys(data).length > 0) {
        saveDraft(formId, data);
      }
    }, debounceMs);

    return () => clearTimeout(timer);
  }, [formId, data, debounceMs, saveDraft]);
};

// Import React for the hook above
import React from 'react';
