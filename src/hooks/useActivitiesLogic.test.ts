import { describe, it, expect, vi, beforeEach } from 'vitest';
import { renderHook, act } from '@testing-library/react';
import { useActivitiesLogic } from '@/hooks/useActivitiesLogic';
import { Activity } from '@/types';

// Mock usePersistedState with proper state handling
let mockActivitiesState: Activity[] = [];

vi.mock('@/hooks/usePersistedState', () => ({
  usePersistedState: vi.fn(() => {
    const setState = (updater: Activity[] | ((prev: Activity[]) => Activity[])) => {
      mockActivitiesState = typeof updater === 'function' ? updater(mockActivitiesState) : updater;
    };
    return [mockActivitiesState, setState];
  }),
}));

const createMockActivity = (overrides?: Partial<Activity>): Activity => ({
  id: 'activity-1',
  dealId: 'deal-1',
  dealTitle: 'Test Deal',
  type: 'TASK',
  title: 'Test Activity',
  description: 'Test description',
  date: new Date().toISOString(),
  user: { name: 'Test User', avatar: 'https://example.com/avatar.png' },
  completed: false,
  ...overrides,
});

describe('useActivitiesLogic', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mockActivitiesState = [];
  });

  it('should initialize with activities array', () => {
    const { result } = renderHook(() => useActivitiesLogic());
    expect(result.current.activities).toBeDefined();
    expect(Array.isArray(result.current.activities)).toBe(true);
  });

  it('should expose all required functions', () => {
    const { result } = renderHook(() => useActivitiesLogic());
    expect(typeof result.current.addActivity).toBe('function');
    expect(typeof result.current.updateActivity).toBe('function');
    expect(typeof result.current.deleteActivity).toBe('function');
    expect(typeof result.current.toggleActivityCompletion).toBe('function');
    expect(typeof result.current.setActivities).toBe('function');
  });

  it('should add a new activity to the beginning of the list', () => {
    const { result } = renderHook(() => useActivitiesLogic());
    const newActivity = createMockActivity({ id: 'new-activity' });

    act(() => {
      result.current.addActivity(newActivity);
    });

    expect(mockActivitiesState).toHaveLength(1);
    expect(mockActivitiesState[0]).toEqual(newActivity);
  });

  it('should add new activities at the beginning (most recent first)', () => {
    const activity1 = createMockActivity({ id: 'activity-1', title: 'First' });
    mockActivitiesState = [activity1];

    const { result } = renderHook(() => useActivitiesLogic());
    const activity2 = createMockActivity({ id: 'activity-2', title: 'Second' });

    act(() => {
      result.current.addActivity(activity2);
    });

    expect(mockActivitiesState).toHaveLength(2);
    expect(mockActivitiesState[0].id).toBe('activity-2');
    expect(mockActivitiesState[1].id).toBe('activity-1');
  });

  it('should update an existing activity', () => {
    const existingActivity = createMockActivity({ id: 'activity-1', title: 'Original Title' });
    mockActivitiesState = [existingActivity];

    const { result } = renderHook(() => useActivitiesLogic());

    act(() => {
      result.current.updateActivity('activity-1', {
        title: 'Updated Title',
        description: 'New description',
      });
    });

    expect(mockActivitiesState[0].title).toBe('Updated Title');
    expect(mockActivitiesState[0].description).toBe('New description');
    expect(mockActivitiesState[0].type).toBe('TASK'); // Unchanged
  });

  it('should not update activity if id does not exist', () => {
    const existingActivity = createMockActivity({ id: 'activity-1', title: 'Original Title' });
    mockActivitiesState = [existingActivity];

    const { result } = renderHook(() => useActivitiesLogic());

    act(() => {
      result.current.updateActivity('non-existent', { title: 'Updated Title' });
    });

    expect(mockActivitiesState[0].title).toBe('Original Title');
  });

  it('should delete an activity by id', () => {
    const activity1 = createMockActivity({ id: 'activity-1' });
    const activity2 = createMockActivity({ id: 'activity-2' });
    mockActivitiesState = [activity1, activity2];

    const { result } = renderHook(() => useActivitiesLogic());

    act(() => {
      result.current.deleteActivity('activity-1');
    });

    expect(mockActivitiesState).toHaveLength(1);
    expect(mockActivitiesState[0].id).toBe('activity-2');
  });

  it('should handle deleting non-existent activity gracefully', () => {
    const activity1 = createMockActivity({ id: 'activity-1' });
    mockActivitiesState = [activity1];

    const { result } = renderHook(() => useActivitiesLogic());

    act(() => {
      result.current.deleteActivity('non-existent');
    });

    expect(mockActivitiesState).toHaveLength(1);
  });

  it('should toggle activity completion from false to true', () => {
    const activity = createMockActivity({ id: 'activity-1', completed: false });
    mockActivitiesState = [activity];

    const { result } = renderHook(() => useActivitiesLogic());

    act(() => {
      result.current.toggleActivityCompletion('activity-1');
    });

    expect(mockActivitiesState[0].completed).toBe(true);
  });

  it('should toggle activity completion from true to false', () => {
    const activity = createMockActivity({ id: 'activity-1', completed: true });
    mockActivitiesState = [activity];

    const { result } = renderHook(() => useActivitiesLogic());

    act(() => {
      result.current.toggleActivityCompletion('activity-1');
    });

    expect(mockActivitiesState[0].completed).toBe(false);
  });

  it('should not toggle completion for non-existent activity', () => {
    const activity = createMockActivity({ id: 'activity-1', completed: false });
    mockActivitiesState = [activity];

    const { result } = renderHook(() => useActivitiesLogic());

    act(() => {
      result.current.toggleActivityCompletion('non-existent');
    });

    expect(mockActivitiesState[0].completed).toBe(false);
  });

  it('should handle all activity types', () => {
    const { result } = renderHook(() => useActivitiesLogic());

    const types: Activity['type'][] = ['CALL', 'MEETING', 'EMAIL', 'TASK', 'NOTE', 'STATUS_CHANGE'];

    types.forEach((type, index) => {
      const activity = createMockActivity({ id: `activity-${index}`, type });

      act(() => {
        result.current.addActivity(activity);
      });
    });

    expect(mockActivitiesState).toHaveLength(6);
  });

  it('should handle activities with different deal associations', () => {
    const activity1 = createMockActivity({
      id: 'activity-1',
      dealId: 'deal-1',
      dealTitle: 'Deal One',
    });
    const activity2 = createMockActivity({
      id: 'activity-2',
      dealId: 'deal-2',
      dealTitle: 'Deal Two',
    });
    const activity3 = createMockActivity({ id: 'activity-3', dealId: '', dealTitle: '' }); // No deal

    const { result } = renderHook(() => useActivitiesLogic());

    act(() => {
      result.current.addActivity(activity1);
      result.current.addActivity(activity2);
      result.current.addActivity(activity3);
    });

    expect(mockActivitiesState).toHaveLength(3);
    expect(mockActivitiesState.find(a => a.id === 'activity-3')?.dealId).toBe('');
  });

  it('should preserve other activities when updating one', () => {
    const activity1 = createMockActivity({ id: 'activity-1', title: 'First' });
    const activity2 = createMockActivity({ id: 'activity-2', title: 'Second' });
    const activity3 = createMockActivity({ id: 'activity-3', title: 'Third' });
    mockActivitiesState = [activity1, activity2, activity3];

    const { result } = renderHook(() => useActivitiesLogic());

    act(() => {
      result.current.updateActivity('activity-2', { title: 'Updated Second' });
    });

    expect(mockActivitiesState).toHaveLength(3);
    expect(mockActivitiesState.find(a => a.id === 'activity-1')?.title).toBe('First');
    expect(mockActivitiesState.find(a => a.id === 'activity-2')?.title).toBe('Updated Second');
    expect(mockActivitiesState.find(a => a.id === 'activity-3')?.title).toBe('Third');
  });
});
