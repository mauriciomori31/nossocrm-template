/**
 * TanStack Query hooks for Contacts - Supabase Edition
 *
 * Features:
 * - Real Supabase API calls
 * - Optimistic updates for instant UI feedback
 * - Automatic cache invalidation
 */
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { queryKeys } from '../index';
import { contactsService, companiesService } from '@/lib/supabase';
import type { Contact, ContactStage, Company } from '@/types';

// ============ QUERY HOOKS ============

export interface ContactsFilters {
  companyId?: string;
  stage?: ContactStage | string;
  status?: 'ACTIVE' | 'INACTIVE';
  search?: string;
}

/**
 * Hook to fetch all contacts with optional filters
 */
export const useContacts = (filters?: ContactsFilters) => {
  return useQuery({
    queryKey: filters
      ? queryKeys.contacts.list(filters as Record<string, unknown>)
      : queryKeys.contacts.lists(),
    queryFn: async () => {
      const { data, error } = await contactsService.getAll();
      if (error) throw error;

      let contacts = data || [];

      // Apply client-side filters
      if (filters) {
        contacts = contacts.filter(contact => {
          if (filters.companyId && contact.companyId !== filters.companyId) return false;
          if (filters.stage && contact.stage !== filters.stage) return false;
          if (filters.status && contact.status !== filters.status) return false;
          if (filters.search) {
            const search = filters.search.toLowerCase();
            const matchName = contact.name.toLowerCase().includes(search);
            const matchEmail = contact.email.toLowerCase().includes(search);
            if (!matchName && !matchEmail) return false;
          }
          return true;
        });
      }

      return contacts;
    },
    staleTime: 2 * 60 * 1000,
  });
};

/**
 * Hook to fetch a single contact by ID
 */
export const useContact = (id: string | undefined) => {
  return useQuery({
    queryKey: queryKeys.contacts.detail(id || ''),
    queryFn: async () => {
      const { data, error } = await contactsService.getAll();
      if (error) throw error;
      return (data || []).find(c => c.id === id) || null;
    },
    enabled: !!id,
  });
};

/**
 * Hook to fetch contacts by company
 */
export const useContactsByCompany = (companyId: string) => {
  return useQuery({
    queryKey: queryKeys.contacts.list({ companyId }),
    queryFn: async () => {
      const { data, error } = await contactsService.getAll();
      if (error) throw error;
      return (data || []).filter(c => c.companyId === companyId);
    },
  });
};

/**
 * Hook to fetch leads (contacts in LEAD stage)
 */
export const useLeadContacts = () => {
  return useQuery({
    queryKey: queryKeys.contacts.list({ stage: 'LEAD' }),
    queryFn: async () => {
      const { data, error } = await contactsService.getAll();
      if (error) throw error;
      return (data || []).filter(c => c.stage === 'LEAD');
    },
  });
};

/**
 * Hook to fetch all CRM companies
 */
export const useCompanies = () => {
  return useQuery({
    queryKey: queryKeys.companies.lists(),
    queryFn: async () => {
      const { data, error } = await companiesService.getAll();
      if (error) throw error;
      return data || [];
    },
    staleTime: 5 * 60 * 1000, // 5 minutes - companies change less frequently
  });
};

// ============ MUTATION HOOKS ============

/**
 * Hook to create a new contact
 */
export const useCreateContact = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (contact: Omit<Contact, 'id' | 'createdAt'>) => {
      // company_id will be auto-set by trigger
      const { data, error } = await contactsService.create(contact, '');
      if (error) throw error;
      return data!;
    },
    onMutate: async newContact => {
      await queryClient.cancelQueries({ queryKey: queryKeys.contacts.all });
      const previousContacts = queryClient.getQueryData<Contact[]>(queryKeys.contacts.lists());

      const tempContact: Contact = {
        ...newContact,
        id: `temp-${Date.now()}`,
        createdAt: new Date().toISOString(),
      } as Contact;

      queryClient.setQueryData<Contact[]>(queryKeys.contacts.lists(), (old = []) => [
        tempContact,
        ...old,
      ]);
      return { previousContacts };
    },
    onError: (_error, _newContact, context) => {
      if (context?.previousContacts) {
        queryClient.setQueryData(queryKeys.contacts.lists(), context.previousContacts);
      }
    },
    onSettled: () => {
      queryClient.invalidateQueries({ queryKey: queryKeys.contacts.all });
    },
  });
};

/**
 * Hook to update a contact
 */
export const useUpdateContact = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({ id, updates }: { id: string; updates: Partial<Contact> }) => {
      const { error } = await contactsService.update(id, updates);
      if (error) throw error;
      return { id, updates };
    },
    onMutate: async ({ id, updates }) => {
      await queryClient.cancelQueries({ queryKey: queryKeys.contacts.all });
      const previousContacts = queryClient.getQueryData<Contact[]>(queryKeys.contacts.lists());
      queryClient.setQueryData<Contact[]>(queryKeys.contacts.lists(), (old = []) =>
        old.map(contact => (contact.id === id ? { ...contact, ...updates } : contact))
      );
      return { previousContacts };
    },
    onError: (_error, _variables, context) => {
      if (context?.previousContacts) {
        queryClient.setQueryData(queryKeys.contacts.lists(), context.previousContacts);
      }
    },
    onSettled: () => {
      queryClient.invalidateQueries({ queryKey: queryKeys.contacts.all });
    },
  });
};

/**
 * Hook to update contact stage (lifecycle)
 */
export const useUpdateContactStage = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({ id, stage }: { id: string; stage: string }) => {
      const { error } = await contactsService.update(id, { stage });
      if (error) throw error;
      return { id, stage };
    },
    onMutate: async ({ id, stage }) => {
      await queryClient.cancelQueries({ queryKey: queryKeys.contacts.all });
      const previousContacts = queryClient.getQueryData<Contact[]>(queryKeys.contacts.lists());
      queryClient.setQueryData<Contact[]>(queryKeys.contacts.lists(), (old = []) =>
        old.map(contact => (contact.id === id ? { ...contact, stage } : contact))
      );
      return { previousContacts };
    },
    onError: (_error, _variables, context) => {
      if (context?.previousContacts) {
        queryClient.setQueryData(queryKeys.contacts.lists(), context.previousContacts);
      }
    },
    onSettled: () => {
      queryClient.invalidateQueries({ queryKey: queryKeys.contacts.all });
    },
  });
};

/**
 * Hook to delete a contact
 */
export const useDeleteContact = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({ id, forceDeleteDeals = false }: { id: string; forceDeleteDeals?: boolean }) => {
      if (forceDeleteDeals) {
        // Delete contact and all associated deals
        const { error } = await contactsService.deleteWithDeals(id);
        if (error) throw error;
      } else {
        // Try normal delete (will fail if has deals)
        const { error } = await contactsService.delete(id);
        if (error) throw error;
      }
      return id;
    },
    onMutate: async ({ id }) => {
      await queryClient.cancelQueries({ queryKey: queryKeys.contacts.all });
      const previousContacts = queryClient.getQueryData<Contact[]>(queryKeys.contacts.lists());
      queryClient.setQueryData<Contact[]>(queryKeys.contacts.lists(), (old = []) =>
        old.filter(contact => contact.id !== id)
      );
      return { previousContacts };
    },
    onError: (_error, _variables, context) => {
      if (context?.previousContacts) {
        queryClient.setQueryData(queryKeys.contacts.lists(), context.previousContacts);
      }
    },
    onSettled: () => {
      queryClient.invalidateQueries({ queryKey: queryKeys.contacts.all });
      // Also invalidate deals since they reference contacts
      queryClient.invalidateQueries({ queryKey: queryKeys.deals.all });
    },
  });
};

/**
 * Hook to check if contact has deals
 */
export const useContactHasDeals = () => {
  return useMutation({
    mutationFn: async (contactId: string) => {
      const result = await contactsService.hasDeals(contactId);
      if (result.error) throw result.error;
      return { hasDeals: result.hasDeals, dealCount: result.dealCount, deals: result.deals };
    },
  });
};

// ============ COMPANIES MUTATIONS ============

/**
 * Hook to create a new company
 */
export const useCreateCompany = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (company: Omit<Company, 'id' | 'createdAt'>) => {
      const { data, error } = await companiesService.create(company, '');
      if (error) throw error;
      return data!;
    },
    onSettled: () => {
      queryClient.invalidateQueries({ queryKey: queryKeys.companies.all });
    },
  });
};

/**
 * Hook to update a company
 */
export const useUpdateCompany = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({ id, updates }: { id: string; updates: Partial<Company> }) => {
      const { error } = await companiesService.update(id, updates);
      if (error) throw error;
      return { id, updates };
    },
    onSettled: () => {
      queryClient.invalidateQueries({ queryKey: queryKeys.companies.all });
    },
  });
};

/**
 * Hook to delete a company
 */
export const useDeleteCompany = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (id: string) => {
      const { error } = await companiesService.delete(id);
      if (error) throw error;
      return id;
    },
    onSettled: () => {
      queryClient.invalidateQueries({ queryKey: queryKeys.companies.all });
      queryClient.invalidateQueries({ queryKey: queryKeys.contacts.all });
    },
  });
};

// ============ UTILITY HOOKS ============

/**
 * Hook to prefetch a contact (for hover previews)
 */
export const usePrefetchContact = () => {
  const queryClient = useQueryClient();
  return async (id: string) => {
    await queryClient.prefetchQuery({
      queryKey: queryKeys.contacts.detail(id),
      queryFn: async () => {
        const { data, error } = await contactsService.getAll();
        if (error) throw error;
        return (data || []).find(c => c.id === id) || null;
      },
      staleTime: 5 * 60 * 1000,
    });
  };
};
