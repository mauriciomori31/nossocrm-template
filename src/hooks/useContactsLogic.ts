import { Contact } from '../types';
import { INITIAL_CONTACTS } from '../services/mockData';
import { usePersistedState } from './usePersistedState';

export const useContactsLogic = () => {
  const [contacts, setContacts] = usePersistedState<Contact[]>('crm_contacts', INITIAL_CONTACTS);

  const addContact = (contact: Contact) => {
    setContacts(prev => [contact, ...prev]);
  };

  const updateContact = (id: string, updates: Partial<Contact>) => {
    setContacts(prev => prev.map(c => (c.id === id ? { ...c, ...updates } : c)));
  };

  const deleteContact = (id: string) => {
    setContacts(prev => prev.filter(c => c.id !== id));
  };

  return {
    contacts,
    addContact,
    updateContact,
    deleteContact,
    setContacts,
  };
};
