import { Activity } from '../types';
import { INITIAL_ACTIVITIES } from '../services/mockData';
import { usePersistedState } from './usePersistedState';

export const useActivitiesLogic = () => {
  const [activities, setActivities] = usePersistedState<Activity[]>(
    'crm_activities',
    INITIAL_ACTIVITIES
  );

  const addActivity = (activity: Activity) => {
    setActivities(prev => [activity, ...prev]);
  };

  const updateActivity = (id: string, updates: Partial<Activity>) => {
    setActivities(prev => prev.map(a => (a.id === id ? { ...a, ...updates } : a)));
  };

  const deleteActivity = (id: string) => {
    setActivities(prev => prev.filter(a => a.id !== id));
  };

  const toggleActivityCompletion = (id: string) => {
    setActivities(prev => prev.map(a => (a.id === id ? { ...a, completed: !a.completed } : a)));
  };

  return {
    activities,
    addActivity,
    updateActivity,
    deleteActivity,
    toggleActivityCompletion,
    setActivities,
  };
};
