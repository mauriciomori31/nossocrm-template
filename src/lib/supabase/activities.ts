import { supabase } from './client';
import { Activity } from '@/types';
import { sanitizeUUID } from './utils';

// ============================================
// ACTIVITIES SERVICE
// ============================================

export interface DbActivity {
  id: string;
  title: string;
  description: string | null;
  type: string;
  date: string;
  completed: boolean;
  deal_id: string | null;
  contact_id: string | null;
  created_at: string;
  owner_id: string | null;
}

// Transform DB -> App
const transformActivity = (db: DbActivity): Activity => ({
  id: db.id,
  title: db.title,
  description: db.description || undefined,
  type: db.type as Activity['type'],
  date: db.date,
  completed: db.completed,
  dealId: db.deal_id || '',
  dealTitle: '', // Will be enriched later
  user: { name: 'Você', avatar: '' }, // Will be enriched later
});

// Transform App -> DB
const transformActivityToDb = (activity: Partial<Activity>): Partial<DbActivity> => {
  const db: Partial<DbActivity> = {};
  
  if (activity.title !== undefined) db.title = activity.title;
  if (activity.description !== undefined) db.description = activity.description || null;
  if (activity.type !== undefined) db.type = activity.type;
  if (activity.date !== undefined) db.date = activity.date;
  if (activity.completed !== undefined) db.completed = activity.completed;
  if (activity.dealId !== undefined) db.deal_id = sanitizeUUID(activity.dealId);
  
  return db;
};

export const activitiesService = {
  async getAll(): Promise<{ data: Activity[] | null; error: Error | null }> {
    try {
      const { data, error } = await supabase
        .from('activities')
        .select('*')
        .order('date', { ascending: false });

      if (error) return { data: null, error };
      return { data: (data || []).map(a => transformActivity(a as DbActivity)), error: null };
    } catch (e) {
      return { data: null, error: e as Error };
    }
  },

  async create(activity: Omit<Activity, 'id' | 'createdAt'>, companyId: string): Promise<{ data: Activity | null; error: Error | null }> {
    try {
      const { data, error } = await supabase
        .from('activities')
        .insert({
          title: activity.title,
          description: activity.description || null,
          type: activity.type,
          date: activity.date,
          completed: activity.completed || false,
          deal_id: sanitizeUUID(activity.dealId),
          company_id: sanitizeUUID(companyId),
        })
        .select()
        .single();

      if (error) return { data: null, error };
      return { data: transformActivity(data as DbActivity), error: null };
    } catch (e) {
      return { data: null, error: e as Error };
    }
  },

  async update(id: string, updates: Partial<Activity>): Promise<{ error: Error | null }> {
    try {
      const dbUpdates = transformActivityToDb(updates);

      const { error } = await supabase
        .from('activities')
        .update(dbUpdates)
        .eq('id', id);

      return { error };
    } catch (e) {
      return { error: e as Error };
    }
  },

  async delete(id: string): Promise<{ error: Error | null }> {
    try {
      const { error } = await supabase
        .from('activities')
        .delete()
        .eq('id', id);

      return { error };
    } catch (e) {
      return { error: e as Error };
    }
  },

  async toggleCompletion(id: string): Promise<{ data: boolean | null; error: Error | null }> {
    try {
      // First get current state
      const { data: current, error: fetchError } = await supabase
        .from('activities')
        .select('completed')
        .eq('id', id)
        .single();

      if (fetchError) return { data: null, error: fetchError };

      const newCompleted = !current.completed;

      const { error } = await supabase
        .from('activities')
        .update({ completed: newCompleted })
        .eq('id', id);

      if (error) return { data: null, error };
      return { data: newCompleted, error: null };
    } catch (e) {
      return { data: null, error: e as Error };
    }
  },
};
