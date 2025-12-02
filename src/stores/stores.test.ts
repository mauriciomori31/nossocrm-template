import { describe, it, expect, beforeEach, vi, afterEach } from 'vitest';
import {
  useUIStore,
  useFormStore,
  useNotificationStore,
  useSidebarOpen,
  useAIAssistantOpen,
  useActiveModal,
  useModalData,
  useGlobalSearch,
  useFormDraft,
  useIsFormSubmitting,
  useNotifications,
} from './index';
import { renderHook, act } from '@testing-library/react';

describe('Zustand Stores', () => {
  describe('useUIStore', () => {
    beforeEach(() => {
      // Reset store to initial state
      useUIStore.setState({
        sidebarOpen: true,
        aiAssistantOpen: false,
        activeModal: null,
        modalData: {},
        globalSearchQuery: '',
        loadingStates: {},
      });
    });

    it('should initialize with default values', () => {
      const state = useUIStore.getState();
      expect(state.sidebarOpen).toBe(true);
      expect(state.aiAssistantOpen).toBe(false);
      expect(state.activeModal).toBeNull();
      expect(state.globalSearchQuery).toBe('');
    });

    it('should toggle sidebar', () => {
      const { toggleSidebar } = useUIStore.getState();

      toggleSidebar();
      expect(useUIStore.getState().sidebarOpen).toBe(false);

      toggleSidebar();
      expect(useUIStore.getState().sidebarOpen).toBe(true);
    });

    it('should set AI assistant open state', () => {
      const { setAIAssistantOpen } = useUIStore.getState();

      setAIAssistantOpen(true);
      expect(useUIStore.getState().aiAssistantOpen).toBe(true);

      setAIAssistantOpen(false);
      expect(useUIStore.getState().aiAssistantOpen).toBe(false);
    });

    it('should toggle AI assistant', () => {
      const { toggleAIAssistant } = useUIStore.getState();

      toggleAIAssistant();
      expect(useUIStore.getState().aiAssistantOpen).toBe(true);

      toggleAIAssistant();
      expect(useUIStore.getState().aiAssistantOpen).toBe(false);
    });

    it('should open modal with data', () => {
      const { openModal } = useUIStore.getState();

      openModal('confirmDelete', { itemId: '123', itemName: 'Test' });

      const state = useUIStore.getState();
      expect(state.activeModal).toBe('confirmDelete');
      expect(state.modalData).toEqual({ itemId: '123', itemName: 'Test' });
    });

    it('should close modal and clear data', () => {
      const { openModal, closeModal } = useUIStore.getState();

      openModal('confirmDelete', { itemId: '123' });
      closeModal();

      const state = useUIStore.getState();
      expect(state.activeModal).toBeNull();
      expect(state.modalData).toEqual({});
    });

    it('should set global search query', () => {
      const { setGlobalSearchQuery } = useUIStore.getState();

      setGlobalSearchQuery('test query');
      expect(useUIStore.getState().globalSearchQuery).toBe('test query');
    });

    it('should manage loading states', () => {
      const { setLoading, isLoading } = useUIStore.getState();

      setLoading('fetchDeals', true);
      expect(useUIStore.getState().isLoading('fetchDeals')).toBe(true);

      setLoading('fetchDeals', false);
      expect(useUIStore.getState().isLoading('fetchDeals')).toBe(false);
    });

    it('should return false for unknown loading keys', () => {
      const { isLoading } = useUIStore.getState();
      expect(isLoading('unknownKey')).toBe(false);
    });
  });

  describe('useFormStore', () => {
    beforeEach(() => {
      useFormStore.setState({
        drafts: {},
        submitting: {},
      });
    });

    it('should initialize with empty state', () => {
      const state = useFormStore.getState();
      expect(state.drafts).toEqual({});
      expect(state.submitting).toEqual({});
    });

    it('should save form draft', () => {
      const { saveDraft } = useFormStore.getState();

      const draftData = { name: 'John', email: 'john@test.com' };
      saveDraft('contactForm', draftData);

      const savedDraft = useFormStore.getState().drafts.contactForm;
      expect(savedDraft?.data).toEqual(draftData);
      expect(savedDraft?.savedAt).toBeDefined();
    });

    it('should get form draft', () => {
      const { saveDraft, getDraft } = useFormStore.getState();

      const draftData = { title: 'Deal 1', value: 1000 };
      saveDraft('dealForm', draftData);

      const draft = getDraft('dealForm');
      expect(draft?.data).toEqual(draftData);
      expect(draft?.savedAt).toBeDefined();
    });

    it('should return null for non-existent draft', () => {
      const { getDraft } = useFormStore.getState();
      expect(getDraft('nonExistentForm')).toBeNull();
    });

    it('should clear form draft', () => {
      const { saveDraft, clearDraft, getDraft } = useFormStore.getState();

      saveDraft('testForm', { data: 'test' });
      expect(getDraft('testForm')).not.toBeNull();

      clearDraft('testForm');
      expect(getDraft('testForm')).toBeNull();
    });

    it('should set submitting state', () => {
      const { setSubmitting } = useFormStore.getState();

      setSubmitting('contactForm', true);
      expect(useFormStore.getState().submitting.contactForm).toBe(true);

      setSubmitting('contactForm', false);
      expect(useFormStore.getState().submitting.contactForm).toBe(false);
    });

    it('should check if form is submitting', () => {
      const { setSubmitting, isSubmitting } = useFormStore.getState();

      expect(isSubmitting('unknownForm')).toBe(false);

      setSubmitting('testForm', true);
      expect(useFormStore.getState().isSubmitting('testForm')).toBe(true);
    });

    it('should clear all drafts', () => {
      const { saveDraft, clearAllDrafts, getDraft } = useFormStore.getState();

      saveDraft('form1', { data: '1' });
      saveDraft('form2', { data: '2' });

      clearAllDrafts();

      expect(getDraft('form1')).toBeNull();
      expect(getDraft('form2')).toBeNull();
    });
  });

  describe('useNotificationStore', () => {
    beforeEach(() => {
      useNotificationStore.setState({
        notifications: [],
      });
    });

    it('should initialize with empty notifications', () => {
      const state = useNotificationStore.getState();
      expect(state.notifications).toEqual([]);
    });

    it('should add notification with title', () => {
      const { addNotification } = useNotificationStore.getState();

      addNotification({
        type: 'success',
        title: 'Success!',
        message: 'Deal created successfully',
      });

      const state = useNotificationStore.getState();
      expect(state.notifications).toHaveLength(1);
      expect(state.notifications[0].type).toBe('success');
      expect(state.notifications[0].title).toBe('Success!');
      expect(state.notifications[0].message).toBe('Deal created successfully');
      expect(state.notifications[0].id).toBeDefined();
    });

    it('should add multiple notifications', () => {
      const { addNotification } = useNotificationStore.getState();

      addNotification({ type: 'success', title: 'First' });
      addNotification({ type: 'error', title: 'Second' });
      addNotification({ type: 'info', title: 'Third' });

      expect(useNotificationStore.getState().notifications).toHaveLength(3);
    });

    it('should remove notification by id', () => {
      const { addNotification, removeNotification } = useNotificationStore.getState();

      addNotification({ type: 'success', title: 'Test' });
      const id = useNotificationStore.getState().notifications[0].id;

      removeNotification(id);
      expect(useNotificationStore.getState().notifications).toHaveLength(0);
    });

    it('should clear all notifications', () => {
      const { addNotification, clearAll } = useNotificationStore.getState();

      addNotification({ type: 'success', title: 'First' });
      addNotification({ type: 'error', title: 'Second' });

      clearAll();
      expect(useNotificationStore.getState().notifications).toHaveLength(0);
    });

    it('should auto-remove notification after duration', async () => {
      vi.useFakeTimers();
      const { addNotification } = useNotificationStore.getState();

      addNotification({
        type: 'success',
        title: 'Auto-remove test',
        duration: 1000,
      });

      expect(useNotificationStore.getState().notifications).toHaveLength(1);

      vi.advanceTimersByTime(1100);

      expect(useNotificationStore.getState().notifications).toHaveLength(0);
      vi.useRealTimers();
    });

    it('should not auto-remove notification with duration 0', async () => {
      vi.useFakeTimers();
      const { addNotification } = useNotificationStore.getState();

      addNotification({
        type: 'info',
        title: 'Persistent notification',
        duration: 0,
      });

      expect(useNotificationStore.getState().notifications).toHaveLength(1);

      vi.advanceTimersByTime(10000);

      expect(useNotificationStore.getState().notifications).toHaveLength(1);
      vi.useRealTimers();
    });
  });

  describe('Selector Hooks', () => {
    beforeEach(() => {
      useUIStore.setState({
        sidebarOpen: true,
        aiAssistantOpen: false,
        activeModal: null,
        modalData: {},
        globalSearchQuery: '',
        loadingStates: {},
      });
      useFormStore.setState({
        drafts: {},
        submitting: {},
      });
      useNotificationStore.setState({
        notifications: [],
      });
    });

    it('useSidebarOpen should return sidebar state', () => {
      const { result } = renderHook(() => useSidebarOpen());
      expect(result.current).toBe(true);

      act(() => {
        useUIStore.getState().toggleSidebar();
      });

      expect(result.current).toBe(false);
    });

    it('useAIAssistantOpen should return AI assistant state', () => {
      const { result } = renderHook(() => useAIAssistantOpen());
      expect(result.current).toBe(false);

      act(() => {
        useUIStore.getState().setAIAssistantOpen(true);
      });

      expect(result.current).toBe(true);
    });

    it('useActiveModal should return current modal', () => {
      const { result } = renderHook(() => useActiveModal());
      expect(result.current).toBeNull();

      act(() => {
        useUIStore.getState().openModal('testModal', {});
      });

      expect(result.current).toBe('testModal');
    });

    it('useModalData should return modal data', () => {
      const { result } = renderHook(() => useModalData());
      expect(result.current).toEqual({});

      act(() => {
        useUIStore.getState().openModal('testModal', { id: '123' });
      });

      expect(result.current).toEqual({ id: '123' });
    });

    it('useGlobalSearch should return search query', () => {
      const { result } = renderHook(() => useGlobalSearch());
      expect(result.current).toBe('');

      act(() => {
        useUIStore.getState().setGlobalSearchQuery('test search');
      });

      expect(result.current).toBe('test search');
    });

    it('useFormDraft should return form draft or null', () => {
      const { result } = renderHook(() => useFormDraft('testForm'));
      expect(result.current).toBeNull();

      act(() => {
        useFormStore.getState().saveDraft('testForm', { name: 'Test' });
      });

      expect(result.current?.data).toEqual({ name: 'Test' });
    });

    it('useIsFormSubmitting should return submitting state', () => {
      const { result } = renderHook(() => useIsFormSubmitting('testForm'));
      expect(result.current).toBe(false);

      act(() => {
        useFormStore.getState().setSubmitting('testForm', true);
      });

      expect(result.current).toBe(true);
    });

    it('useNotifications should return notifications list', () => {
      const { result } = renderHook(() => useNotifications());
      expect(result.current).toEqual([]);

      act(() => {
        useNotificationStore.getState().addNotification({
          type: 'success',
          title: 'Test',
          duration: 0,
        });
      });

      expect(result.current).toHaveLength(1);
    });
  });
});
