import { Lead } from '../types';
import { INITIAL_LEADS } from '../services/mockData';
import { usePersistedState } from './usePersistedState';

export const useLeadsLogic = () => {
    const [leads, setLeads] = usePersistedState<Lead[]>('crm_leads', []);

    const addLead = (lead: Lead) => {
        setLeads(prev => [lead, ...prev]);
    };

    const updateLead = (id: string, updates: Partial<Lead>) => {
        setLeads(prev => prev.map(l => l.id === id ? { ...l, ...updates } : l));
    };

    const discardLead = (leadId: string) => {
        setLeads(prev => prev.filter(l => l.id !== leadId));
    };

    return {
        leads,
        addLead,
        updateLead,
        discardLead,
        setLeads
    };
};
