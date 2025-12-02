import { Lead } from '@/types';
import { INITIAL_LEADS } from '@/services/mockData';

const delay = (ms: number) => new Promise(resolve => setTimeout(resolve, ms));

export const leadsService = {
  getAll: async (): Promise<Lead[]> => {
    await delay(500);
    const stored = localStorage.getItem('crm_leads');
    return stored ? JSON.parse(stored) : INITIAL_LEADS;
  },

  save: async (lead: Lead): Promise<Lead> => {
    await delay(500);
    // In a real app: axios.post('/api/leads', lead)
    return lead;
  }
};
