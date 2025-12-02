import { Contact } from '@/types';
import { INITIAL_CONTACTS } from '@/services/mockData';

const delay = (ms: number) => new Promise(resolve => setTimeout(resolve, ms));

export const contactsService = {
  getAll: async (): Promise<Contact[]> => {
    await delay(500);
    const stored = localStorage.getItem('crm_contacts');
    return stored ? JSON.parse(stored) : INITIAL_CONTACTS;
  },

  save: async (contact: Contact): Promise<Contact> => {
    await delay(500);
    // In a real app: axios.post('/api/contacts', contact)
    return contact;
  }
};
