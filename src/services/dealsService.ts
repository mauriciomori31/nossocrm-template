import { Deal } from '@/types';
import { INITIAL_DEALS } from '@/services/mockData';

const delay = (ms: number) => new Promise(resolve => setTimeout(resolve, ms));

export const dealsService = {
  getAll: async (): Promise<Deal[]> => {
    await delay(500);
    const stored = localStorage.getItem('crm_deals');
    return stored ? JSON.parse(stored) : INITIAL_DEALS;
  },

  save: async (deal: Deal): Promise<Deal> => {
    await delay(500);
    // In a real app: axios.post('/api/deals', deal)
    return deal;
  }
};
