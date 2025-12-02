import React, { useState, useMemo } from 'react';
import { useSearchParams } from 'react-router-dom';
import { useToast } from '@/context/ToastContext';
import { Contact, ContactStage } from '@/types';
import {
  useContacts,
  useCompanies,
  useCreateContact,
  useUpdateContact,
  useDeleteContact,
  useCreateCompany,
  useContactHasDeals,
} from '@/lib/query/hooks/useContactsQuery';
import { useCreateDeal } from '@/lib/query/hooks/useDealsQuery';
import { useBoards } from '@/lib/query/hooks/useBoardsQuery';
import { useRealtimeSync } from '@/lib/realtime';

export const useContactsController = () => {
  // TanStack Query hooks
  const { data: contacts = [], isLoading: contactsLoading } = useContacts();
  const { data: companies = [], isLoading: companiesLoading } = useCompanies();
  const { data: boards = [] } = useBoards();
  const createContactMutation = useCreateContact();
  const updateContactMutation = useUpdateContact();
  const deleteContactMutation = useDeleteContact();
  const checkHasDealsMutation = useContactHasDeals();
  const createCompanyMutation = useCreateCompany();
  const createDealMutation = useCreateDeal();

  // Enable realtime sync
  useRealtimeSync('contacts');
  useRealtimeSync('crm_companies');

  const { addToast, showToast } = useToast();
  const [searchParams] = useSearchParams();

  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState<
    'ALL' | 'ACTIVE' | 'INACTIVE' | 'CHURNED' | 'RISK'
  >(() => {
    const filter = searchParams.get('filter');
    const validFilters = ['ALL', 'ACTIVE', 'INACTIVE', 'CHURNED', 'RISK'] as const;
    return validFilters.includes(filter as (typeof validFilters)[number])
      ? (filter as (typeof validFilters)[number])
      : 'ALL';
  });
  const [stageFilter, setStageFilter] = useState<ContactStage | 'ALL'>(
    (searchParams.get('stage') as ContactStage) || 'ALL'
  );
  const [viewMode, setViewMode] = useState<'people' | 'companies'>('people');
  const [isFilterOpen, setIsFilterOpen] = useState(false);
  const [dateRange, setDateRange] = useState({ start: '', end: '' });

  // Selection State
  const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set());

  // CRUD State
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingContact, setEditingContact] = useState<Contact | null>(null);
  const [deleteId, setDeleteId] = useState<string | null>(null);
  const [deleteWithDeals, setDeleteWithDeals] = useState<{ id: string; dealCount: number; deals: Array<{ id: string; title: string }> } | null>(null);
  const [bulkDeleteConfirm, setBulkDeleteConfirm] = useState(false);
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    phone: '',
    role: '',
    companyName: '',
  });

  // Create Deal State
  const [createDealContactId, setCreateDealContactId] = useState<string | null>(null);
  const contactForDeal = contacts.find(c => c.id === createDealContactId);

  const isLoading = contactsLoading || companiesLoading;

  const openCreateModal = () => {
    setEditingContact(null);
    setFormData({ name: '', email: '', phone: '', role: '', companyName: '' });
    setIsModalOpen(true);
  };

  const openEditModal = (contact: Contact) => {
    setEditingContact(contact);
    const company = companies.find(c => c.id === contact.companyId);
    setFormData({
      name: contact.name,
      email: contact.email,
      phone: contact.phone,
      role: contact.role || '',
      companyName: company?.name || '',
    });
    setIsModalOpen(true);
  };

  const confirmDelete = async () => {
    if (deleteId) {
      // First check if contact has deals
      try {
        const result = await checkHasDealsMutation.mutateAsync(deleteId);
        
        if (result.hasDeals) {
          // Show confirmation for deleting with deals
          setDeleteWithDeals({ id: deleteId, dealCount: result.dealCount, deals: result.deals });
          setDeleteId(null);
          return;
        }
        
        // No deals, delete normally
        deleteContactMutation.mutate(
          { id: deleteId },
          {
            onSuccess: () => {
              (addToast || showToast)('Contato excluído com sucesso', 'success');
              setDeleteId(null);
            },
            onError: (error: Error) => {
              (addToast || showToast)(`Erro ao excluir: ${error.message}`, 'error');
            },
          }
        );
      } catch (error) {
        (addToast || showToast)('Erro ao verificar negócios do contato', 'error');
      }
    }
  };

  const confirmDeleteWithDeals = () => {
    if (deleteWithDeals) {
      deleteContactMutation.mutate(
        { id: deleteWithDeals.id, forceDeleteDeals: true },
        {
          onSuccess: () => {
            (addToast || showToast)(`Contato e ${deleteWithDeals.dealCount} negócio(s) excluídos`, 'success');
            setDeleteWithDeals(null);
          },
          onError: (error: Error) => {
            (addToast || showToast)(`Erro ao excluir: ${error.message}`, 'error');
          },
        }
      );
    }
  };

  // Selection handlers
  const toggleSelect = (id: string) => {
    setSelectedIds(prev => {
      const next = new Set(prev);
      if (next.has(id)) {
        next.delete(id);
      } else {
        next.add(id);
      }
      return next;
    });
  };

  const toggleSelectAll = () => {
    if (selectedIds.size === filteredContacts.length) {
      setSelectedIds(new Set());
    } else {
      setSelectedIds(new Set(filteredContacts.map(c => c.id)));
    }
  };

  const clearSelection = () => {
    setSelectedIds(new Set());
  };

  // Bulk delete
  const confirmBulkDelete = async () => {
    const ids: string[] = Array.from(selectedIds);
    let successCount = 0;
    let errorCount = 0;

    for (const id of ids) {
      try {
        await deleteContactMutation.mutateAsync({ id, forceDeleteDeals: true });
        successCount++;
      } catch {
        errorCount++;
      }
    }

    if (successCount > 0) {
      (addToast || showToast)(`${successCount} contato(s) excluído(s)`, 'success');
    }
    if (errorCount > 0) {
      (addToast || showToast)(`Falha ao excluir ${errorCount} contato(s)`, 'error');
    }

    setSelectedIds(new Set());
    setBulkDeleteConfirm(false);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    // Find or create company
    let companyId: string | undefined;
    const existingCompany = companies.find(
      c => c.name.toLowerCase() === formData.companyName.toLowerCase()
    );

    if (existingCompany) {
      companyId = existingCompany.id;
    } else if (formData.companyName) {
      // Create new company and wait for result
      const newCompany = await new Promise<{ id: string } | null>(resolve => {
        createCompanyMutation.mutate(
          { name: formData.companyName },
          { onSuccess: resolve, onError: () => resolve(null) }
        );
      });
      if (newCompany) {
        companyId = newCompany.id;
      }
    } else if (editingContact) {
      companyId = editingContact.companyId;
    }

    if (editingContact) {
      updateContactMutation.mutate(
        {
          id: editingContact.id,
          updates: {
            name: formData.name,
            email: formData.email,
            phone: formData.phone,
            role: formData.role,
            companyId: companyId,
          },
        },
        {
          onSuccess: () => {
            (addToast || showToast)('Contato atualizado!', 'success');
            setIsModalOpen(false);
          },
        }
      );
    } else {
      createContactMutation.mutate(
        {
          name: formData.name,
          email: formData.email,
          phone: formData.phone,
          role: formData.role,
          companyId: companyId || '',
          status: 'ACTIVE',
          stage: ContactStage.LEAD,
          totalValue: 0,
        },
        {
          onSuccess: () => {
            (addToast || showToast)('Contato criado!', 'success');
            setIsModalOpen(false);
          },
        }
      );
    }
  };

  // Open modal to select board for deal creation (or create directly if only 1 board)
  const convertContactToDeal = (contactId: string) => {
    if (boards.length === 0) {
      addToast('Nenhum board disponível. Crie um board primeiro.', 'error');
      return;
    }
    
    // Se só tem 1 board, cria direto sem abrir modal
    if (boards.length === 1) {
      createDealDirectly(contactId, boards[0]);
      return;
    }
    
    // Se tem mais de 1 board, abre modal para escolher
    setCreateDealContactId(contactId);
  };

  // Create deal directly (used when only 1 board or from modal)
  const createDealDirectly = (contactId: string, board: typeof boards[0]) => {
    const contact = contacts.find(c => c.id === contactId);
    
    if (!contact) {
      addToast('Contato não encontrado', 'error');
      return;
    }
    
    if (!board.stages?.length) {
      addToast('Board não tem estágios configurados', 'error');
      console.error('Board sem stages:', board);
      return;
    }

    const firstStage = board.stages[0];
    
    // Debug log
    console.log('Criando deal:', {
      boardId: board.id,
      boardName: board.name,
      stageId: firstStage.id,
      stageLabel: firstStage.label,
      contactId: contact.id,
    });

    createDealMutation.mutate(
      {
        title: `Deal - ${contact.name}`,
        contactId: contact.id,
        companyId: contact.companyId || undefined,
        boardId: board.id,
        status: firstStage.id, // status = stageId (UUID do stage)
        value: 0,
        probability: 0,
        priority: 'medium',
        tags: [],
        items: [],
        customFields: {},
        owner: { name: 'Eu', avatar: '' },
        isWon: false,
        isLost: false,
      },
      {
        onSuccess: () => {
          addToast(`Deal criado no board "${board.name}"`, 'success');
        },
        onError: (error: Error) => {
          addToast(`Erro ao criar deal: ${error.message}`, 'error');
        },
      }
    );
  };

  // Called from modal after board selection
  const createDealForContact = (boardId: string) => {
    const contact = contacts.find(c => c.id === createDealContactId);
    const board = boards.find(b => b.id === boardId);
    
    if (!contact || !board) {
      addToast('Erro ao criar deal', 'error');
      setCreateDealContactId(null);
      return;
    }

    createDealDirectly(contact.id, board);
    setCreateDealContactId(null);
  };

  // Update contact wrapper
  const updateContact = (contactId: string, data: Partial<Contact>) => {
    updateContactMutation.mutate({
      id: contactId,
      updates: {
        name: data.name,
        email: data.email,
        phone: data.phone,
        role: data.role,
        status: data.status,
        stage: data.stage,
      },
    });
  };

  // Filter contacts
  const filteredContacts = useMemo(() => {
    return contacts.filter(c => {
      const matchesSearch =
        c.name.toLowerCase().includes(search.toLowerCase()) ||
        c.email.toLowerCase().includes(search.toLowerCase());

      // Filtro por estágio
      const matchesStage = stageFilter === 'ALL' || c.stage === stageFilter;

      let matchesStatus = true;
      if (statusFilter === 'RISK') {
        // Risk logic: Active but no purchase > 30 days
        if (c.status !== 'ACTIVE') {
          matchesStatus = false;
        } else {
          const thirtyDaysAgo = new Date();
          thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);
          matchesStatus = !c.lastPurchaseDate || new Date(c.lastPurchaseDate) < thirtyDaysAgo;
        }
      } else {
        matchesStatus = statusFilter === 'ALL' || c.status === statusFilter;
      }

      let matchesDate = true;
      if (dateRange.start) {
        matchesDate = matchesDate && new Date(c.createdAt) >= new Date(dateRange.start);
      }
      if (dateRange.end) {
        const endDate = new Date(dateRange.end);
        endDate.setHours(23, 59, 59, 999);
        matchesDate = matchesDate && new Date(c.createdAt) <= endDate;
      }

      return matchesSearch && matchesStage && matchesStatus && matchesDate;
    });
  }, [contacts, search, stageFilter, statusFilter, dateRange]);

  // Filter companies
  const filteredCompanies = useMemo(() => {
    return companies.filter(
      c =>
        c.name.toLowerCase().includes(search.toLowerCase()) ||
        (c.industry && c.industry.toLowerCase().includes(search.toLowerCase()))
    );
  }, [companies, search]);

  const getCompanyName = (companyId: string) => {
    return companies.find(c => c.id === companyId)?.name || 'Empresa não vinculada';
  };

  // Contadores por estágio
  const stageCounts = useMemo(
    () => ({
      LEAD: contacts.filter(c => c.stage === ContactStage.LEAD).length,
      MQL: contacts.filter(c => c.stage === ContactStage.MQL).length,
      PROSPECT: contacts.filter(c => c.stage === ContactStage.PROSPECT).length,
      CUSTOMER: contacts.filter(c => c.stage === ContactStage.CUSTOMER).length,
      OTHER: contacts.filter(c => !Object.values(ContactStage).includes(c.stage as ContactStage))
        .length,
    }),
    [contacts]
  );

  return {
    // State
    search,
    setSearch,
    statusFilter,
    setStatusFilter,
    stageFilter,
    setStageFilter,
    stageCounts,
    viewMode,
    setViewMode,
    isFilterOpen,
    setIsFilterOpen,
    dateRange,
    setDateRange,
    isModalOpen,
    setIsModalOpen,
    editingContact,
    deleteId,
    setDeleteId,
    deleteWithDeals,
    setDeleteWithDeals,
    bulkDeleteConfirm,
    setBulkDeleteConfirm,
    formData,
    setFormData,
    isLoading,

    // Selection
    selectedIds,
    toggleSelect,
    toggleSelectAll,
    clearSelection,

    // Create Deal State
    createDealContactId,
    setCreateDealContactId,
    contactForDeal,
    boards,

    // Data
    contacts,
    companies,
    filteredContacts,
    filteredCompanies,

    // Actions
    openCreateModal,
    openEditModal,
    confirmDelete,
    confirmDeleteWithDeals,
    handleSubmit,
    getCompanyName,
    updateContact,
    convertContactToDeal,
    createDealForContact,
    confirmBulkDelete,
    addToast: addToast || showToast,
  };
};
