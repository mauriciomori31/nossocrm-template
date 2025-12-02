import React, { createContext, useContext, useMemo, useEffect, ReactNode, useState, useCallback } from 'react';
import {
  Deal,
  Activity,
  DealStatus,
  Company,
  Contact,
  DealView,
  Lead,
  Product,
  DealItem,
  CustomFieldDefinition,
  Board,
  LifecycleStage,
} from '../types';

// Import individual providers
import { DealsProvider, useDeals } from './deals/DealsContext';
import { ContactsProvider, useContacts } from './contacts/ContactsContext';
import { ActivitiesProvider, useActivities } from './activities/ActivitiesContext';
import { BoardsProvider, useBoards } from './boards/BoardsContext';
import { SettingsProvider, useSettings } from './settings/SettingsContext';

// ============================================
// CRM CONTEXT TYPE (Legacy API - Backward Compatible)
// ============================================

interface CRMContextType {
  // Loading states
  loading: boolean;
  error: string | null;

  // Views (denormalized)
  deals: DealView[];
  companies: Company[];
  contacts: Contact[];
  leads: Lead[];
  leadsFromContacts: Contact[];
  products: Product[];
  customFieldDefinitions: CustomFieldDefinition[];
  availableTags: string[];

  // Lifecycle Stages
  lifecycleStages: LifecycleStage[];
  addLifecycleStage: (stage: Omit<LifecycleStage, 'id' | 'order'>) => Promise<LifecycleStage | null>;
  updateLifecycleStage: (id: string, updates: Partial<LifecycleStage>) => Promise<void>;
  deleteLifecycleStage: (id: string) => Promise<void>;
  reorderLifecycleStages: (newOrder: LifecycleStage[]) => Promise<void>;

  // Boards
  boards: Board[];
  activeBoard: Board | null;
  activeBoardId: string;
  setActiveBoardId: (id: string) => void;
  addBoard: (board: Omit<Board, 'id' | 'createdAt'>) => Promise<Board | null>;
  updateBoard: (id: string, updates: Partial<Board>) => Promise<void>;
  deleteBoard: (id: string) => Promise<void>;

  // Deals
  addDeal: (deal: Omit<Deal, 'id' | 'createdAt'>, relatedData?: { contact?: Partial<Contact>; companyName?: string }) => Promise<void>;
  updateDeal: (id: string, updates: Partial<Deal>) => Promise<void>;
  moveDeal: (id: string, newStatus: string, lossReason?: string) => Promise<void>;
  deleteDeal: (id: string) => Promise<void>;
  addItemToDeal: (dealId: string, item: Omit<DealItem, 'id'>) => Promise<DealItem | null>;
  removeItemFromDeal: (dealId: string, itemId: string) => Promise<void>;

  // Activities
  activities: Activity[];
  addActivity: (activity: Omit<Activity, 'id' | 'createdAt'>) => Promise<Activity | null>;
  updateActivity: (id: string, updates: Partial<Activity>) => Promise<void>;
  deleteActivity: (id: string) => Promise<void>;
  toggleActivityCompletion: (id: string) => Promise<void>;

  // Leads (deprecated)
  addLead: (lead: Lead) => void;
  updateLead: (id: string, updates: Partial<Lead>) => void;
  convertLead: (leadId: string) => Promise<void>;
  discardLead: (id: string) => void;

  // Companies
  addCompany: (company: Omit<Company, 'id' | 'createdAt'>) => Promise<Company | null>;
  updateCompany: (id: string, updates: Partial<Company>) => Promise<void>;
  deleteCompany: (id: string) => Promise<void>;

  // Contacts
  addContact: (contact: Omit<Contact, 'id' | 'createdAt'>) => Promise<Contact | null>;
  updateContact: (id: string, updates: Partial<Contact>) => Promise<void>;
  deleteContact: (id: string) => Promise<void>;
  updateContactStage: (id: string, stage: string) => Promise<void>;
  convertContactToDeal: (contactId: string) => Promise<void>;

  // Custom Fields & Tags
  addCustomField: (field: Omit<CustomFieldDefinition, 'id'>) => void;
  updateCustomField: (id: string, updates: Partial<CustomFieldDefinition>) => void;
  removeCustomField: (id: string) => void;
  addTag: (tag: string) => void;
  removeTag: (tag: string) => void;

  // Utilities
  checkWalletHealth: () => Promise<number>;
  checkStagnantDeals: () => Promise<number>;

  // UI State
  isGlobalAIOpen: boolean;
  setIsGlobalAIOpen: (isOpen: boolean) => void;

  // AI Configuration
  aiProvider: 'google' | 'openai' | 'anthropic';
  setAiProvider: (provider: 'google' | 'openai' | 'anthropic') => Promise<void>;
  aiApiKey: string;
  setAiApiKey: (key: string) => Promise<void>;
  aiModel: string;
  setAiModel: (model: string) => Promise<void>;
  aiThinking: boolean;
  setAiThinking: (enabled: boolean) => Promise<void>;
  aiSearch: boolean;
  setAiSearch: (enabled: boolean) => Promise<void>;
  aiAnthropicCaching: boolean;
  setAiAnthropicCaching: (enabled: boolean) => Promise<void>;

  // Refresh
  refresh: () => Promise<void>;
}

const CRMContext = createContext<CRMContextType | undefined>(undefined);

// ============================================
// INNER PROVIDER (Uses all individual contexts)
// ============================================

const CRMInnerProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
  // Use individual contexts
  const {
    rawDeals,
    loading: dealsLoading,
    error: dealsError,
    addDeal: addDealState,
    updateDeal,
    updateDealStatus,
    deleteDeal,
    addItemToDeal,
    removeItemFromDeal,
    refresh: refreshDeals,
  } = useDeals();

  const {
    contacts,
    contactsLoading,
    contactsError,
    addContact,
    updateContact,
    deleteContact,
    companies,
    companiesLoading,
    companiesError,
    addCompany,
    updateCompany,
    deleteCompany,
    companyMap,
    contactMap,
    leadsFromContacts,
    refreshContacts,
    refreshCompanies,
  } = useContacts();

  const {
    activities,
    loading: activitiesLoading,
    error: activitiesError,
    addActivity,
    updateActivity,
    deleteActivity,
    toggleActivityCompletion,
    refresh: refreshActivities,
  } = useActivities();

  const {
    boards,
    loading: boardsLoading,
    error: boardsError,
    addBoard,
    updateBoard,
    deleteBoard,
    activeBoardId,
    setActiveBoardId,
    activeBoard,
    getBoardById,
    refresh: refreshBoards,
  } = useBoards();

  const {
    loading: settingsLoading,
    error: settingsError,
    lifecycleStages,
    addLifecycleStage,
    updateLifecycleStage,
    deleteLifecycleStage,
    reorderLifecycleStages,
    products,
    customFieldDefinitions,
    addCustomField,
    updateCustomField,
    removeCustomField,
    availableTags,
    addTag,
    removeTag,
    aiProvider,
    setAiProvider,
    aiApiKey,
    setAiApiKey,
    aiModel,
    setAiModel,
    aiThinking,
    setAiThinking,
    aiSearch,
    setAiSearch,
    aiAnthropicCaching,
    setAiAnthropicCaching,
    isGlobalAIOpen,
    setIsGlobalAIOpen,
    leads,
    setLeads,
    addLead,
    updateLead,
    discardLead,
    refresh: refreshSettings,
  } = useSettings();

  // Aggregate loading and error states
  const loading = dealsLoading || contactsLoading || companiesLoading || activitiesLoading || boardsLoading || settingsLoading;
  const error = dealsError || contactsError || companiesError || activitiesError || boardsError || settingsError;

  // View Projection: deals with company/contact names
  const deals: DealView[] = useMemo(() => {
    return rawDeals.map(deal => ({
      ...deal,
      companyName: companyMap[deal.companyId]?.name || 'Empresa Desconhecida',
      contactName: contactMap[deal.contactId]?.name || 'Sem Contato',
      contactEmail: contactMap[deal.contactId]?.email || '',
    }));
  }, [rawDeals, companyMap, contactMap]);

  // Update contact stage helper
  const updateContactStage = useCallback(async (id: string, stage: string) => {
    await updateContact(id, { stage });
  }, [updateContact]);

  // Refresh all data
  const refresh = useCallback(async () => {
    await Promise.all([
      refreshDeals(),
      refreshContacts(),
      refreshCompanies(),
      refreshActivities(),
      refreshBoards(),
      refreshSettings(),
    ]);
  }, [refreshDeals, refreshContacts, refreshCompanies, refreshActivities, refreshBoards, refreshSettings]);

  // ============================================
  // COMPLEX BUSINESS LOGIC (Glue between contexts)
  // ============================================

  const addDeal = useCallback(async (
    deal: Omit<Deal, 'id' | 'createdAt'>,
    relatedData?: { contact?: Partial<Contact>; companyName?: string }
  ) => {
    let finalCompanyId = deal.companyId;
    let finalContactId = deal.contactId;

    // Handle Company
    if (relatedData?.companyName) {
      const existingCompany = companies.find(
        c => c.name.toLowerCase() === relatedData.companyName!.toLowerCase()
      );
      if (existingCompany) {
        finalCompanyId = existingCompany.id;
      } else {
        const newCompany = await addCompany({
          name: relatedData.companyName,
        });
        if (newCompany) {
          finalCompanyId = newCompany.id;
        }
      }
    } else if (!companies.find(c => c.id === deal.companyId)) {
      const newCompany = await addCompany({
        name: 'Nova Empresa (Auto)',
      });
      if (newCompany) {
        finalCompanyId = newCompany.id;
      }
    }

    // Handle Contact
    if (relatedData?.contact && relatedData.contact.name) {
      const existingContact = relatedData.contact.email
        ? contacts.find(c => c.email.toLowerCase() === relatedData.contact!.email!.toLowerCase())
        : undefined;

      if (existingContact) {
        finalContactId = existingContact.id;
      } else {
        let initialStage = 'LEAD';
        if (activeBoard) {
          const targetBoardStage = activeBoard.stages.find(s => s.id === deal.status);
          if (targetBoardStage && targetBoardStage.linkedLifecycleStage) {
            initialStage = targetBoardStage.linkedLifecycleStage;
          }
        }

        const newContact = await addContact({
          companyId: finalCompanyId,
          name: relatedData.contact.name,
          email: relatedData.contact.email || '',
          phone: relatedData.contact.phone || '',
          role: relatedData.contact.role || '',
          status: 'ACTIVE',
          stage: initialStage,
          lastPurchaseDate: '',
          totalValue: 0,
        } as Omit<Contact, 'id' | 'createdAt'>);
        if (newContact) {
          finalContactId = newContact.id;
        }
      }
    }

    const createdDeal = await addDealState({
      ...deal,
      companyId: finalCompanyId,
      contactId: finalContactId,
    });

    if (createdDeal) {
      await addActivity({
        dealId: createdDeal.id,
        dealTitle: createdDeal.title,
        type: 'STATUS_CHANGE',
        title: 'Negócio Criado',
        date: new Date().toISOString(),
        user: { name: 'Eu', avatar: 'https://i.pravatar.cc/150?u=me' },
        completed: true,
      });
    }
  }, [companies, contacts, activeBoard, addCompany, addContact, addDealState, addActivity]);

  const moveDeal = useCallback(async (id: string, newStatus: string, lossReason?: string) => {
    await updateDealStatus(id, newStatus, lossReason);

    const deal = rawDeals.find(l => l.id === id);
    if (deal) {
      await addActivity({
        dealId: id,
        dealTitle: deal.title,
        type: 'STATUS_CHANGE',
        title: `Moveu para ${newStatus}`,
        description: lossReason ? `Motivo da perda: ${lossReason}` : undefined,
        date: new Date().toISOString(),
        user: { name: 'Eu', avatar: 'https://i.pravatar.cc/150?u=me' },
        completed: true,
      });

      // LinkedStage: Update contact stage when moving to linked column
      if (activeBoard) {
        const targetStage = activeBoard.stages.find(s => s.id === newStatus);
        if (targetStage && targetStage.linkedLifecycleStage) {
          const lifecycleStageName =
            lifecycleStages.find(ls => ls.id === targetStage.linkedLifecycleStage)?.name ||
            targetStage.linkedLifecycleStage;

          await updateContactStage(deal.contactId, targetStage.linkedLifecycleStage);
          await addActivity({
            dealId: id,
            dealTitle: deal.title,
            type: 'STATUS_CHANGE',
            title: `Contato promovido para ${lifecycleStageName}`,
            description: `Automático via LinkedStage da etapa "${targetStage.label}"`,
            date: new Date().toISOString(),
            user: { name: 'Sistema', avatar: '' },
            completed: true,
          });
        }
      }

      // NextBoard Automation
      if (activeBoard && newStatus === DealStatus.CLOSED_WON && activeBoard.nextBoardId) {
        const nextBoard = getBoardById(activeBoard.nextBoardId);
        if (nextBoard && nextBoard.stages.length > 0) {
          const newDeal: Omit<Deal, 'id' | 'createdAt'> = {
            ...deal,
            boardId: nextBoard.id,
            status: nextBoard.stages[0].id,
            updatedAt: new Date().toISOString(),
            lastStageChangeDate: undefined,
            lossReason: undefined,
            nextActivity: undefined,
            aiSummary: undefined,
          };

          const createdDeal = await addDealState(newDeal);

          if (createdDeal) {
            await addActivity({
              dealId: createdDeal.id,
              dealTitle: createdDeal.title,
              type: 'STATUS_CHANGE',
              title: 'Criado via Automação',
              description: `Originado do board "${activeBoard.name}"`,
              date: new Date().toISOString(),
              user: { name: 'Sistema', avatar: '' },
              completed: true,
            });
          }
        }
      }
    }
  }, [rawDeals, activeBoard, lifecycleStages, updateDealStatus, addActivity, updateContactStage, getBoardById, addDealState]);

  const convertContactToDeal = useCallback(async (contactId: string) => {
    const contact = contacts.find(c => c.id === contactId);
    if (!contact) return;

    const company = companies.find(c => c.id === contact.companyId);
    let companyId = contact.companyId;
    if (!company) {
      const newCompany = await addCompany({
        name: 'Empresa Auto (from Contact)',
      });
      if (newCompany) {
        companyId = newCompany.id;
      }
    }

    if (activeBoard && activeBoard.stages.length > 0) {
      const newDeal: Omit<Deal, 'id' | 'createdAt'> = {
        title: `Negócio com ${contact.name}`,
        companyId,
        contactId: contact.id,
        boardId: activeBoardId,
        value: 0,
        items: [],
        status: activeBoard.stages[0].id,
        updatedAt: new Date().toISOString(),
        probability: 20,
        priority: 'medium',
        owner: { name: 'Eu', avatar: 'https://i.pravatar.cc/150?u=me' },
        tags: [],
        customFields: {},
        isWon: false,
        isLost: false,
      };

      const createdDeal = await addDealState(newDeal);

      if (createdDeal) {
        await addActivity({
          dealId: createdDeal.id,
          dealTitle: createdDeal.title,
          type: 'STATUS_CHANGE',
          title: 'Convertido de Contato',
          description: `Contato ${contact.name} convertido em oportunidade.`,
          date: new Date().toISOString(),
          user: { name: 'Sistema', avatar: '' },
          completed: true,
        });
      }
    }
  }, [contacts, companies, activeBoard, activeBoardId, addCompany, addDealState, addActivity]);

  const convertLead = useCallback(async (leadId: string) => {
    const lead = leads.find(l => l.id === leadId);
    if (!lead) return;

    const newCompany = await addCompany({
      name: lead.companyName,
    });

    if (!newCompany) return;

    const newContact = await addContact({
      companyId: newCompany.id,
      name: lead.name,
      email: lead.email,
      phone: '',
      role: lead.role || '',
      status: 'ACTIVE',
      stage: 'LEAD',
      lastPurchaseDate: '',
      totalValue: 0,
    } as Omit<Contact, 'id' | 'createdAt'>);

    if (!newContact || !activeBoard || activeBoard.stages.length === 0) return;

    const newDeal: Omit<Deal, 'id' | 'createdAt'> = {
      title: `Negócio com ${lead.companyName}`,
      companyId: newCompany.id,
      contactId: newContact.id,
      boardId: activeBoardId,
      value: 0,
      items: [],
      status: activeBoard.stages[0].id,
      updatedAt: new Date().toISOString(),
      probability: 20,
      priority: 'medium',
      owner: { name: 'Eu', avatar: 'https://i.pravatar.cc/150?u=me' },
      tags: ['Origem: ' + lead.source],
      customFields: {},
      isWon: false,
      isLost: false,
    };

    const createdDeal = await addDealState(newDeal);
    discardLead(leadId);

    if (createdDeal) {
      await addActivity({
        dealId: createdDeal.id,
        dealTitle: createdDeal.title,
        type: 'STATUS_CHANGE',
        title: 'Convertido de Lead',
        description: `Lead ${lead.name} convertido automaticamente.`,
        date: new Date().toISOString(),
        user: { name: 'Sistema', avatar: '' },
        completed: true,
      });
    }
  }, [leads, activeBoard, activeBoardId, addCompany, addContact, addDealState, addActivity, discardLead]);

  const checkWalletHealth = useCallback(async () => {
    const thirtyDaysAgo = new Date();
    thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);

    const riskyContacts = contacts.filter(c => {
      if (c.status !== 'ACTIVE') return false;
      if (!c.lastPurchaseDate) return true;
      return new Date(c.lastPurchaseDate) < thirtyDaysAgo;
    });

    let newActivitiesCount = 0;

    for (const contact of riskyContacts) {
      const existingTask = activities.find(
        a =>
          a.title === 'Análise de Carteira: Risco de Churn' &&
          a.description?.includes(contact.name) &&
          !a.completed
      );

      if (!existingTask) {
        await addActivity({
          dealId: '',
          dealTitle: 'Carteira de Clientes',
          type: 'TASK',
          title: 'Análise de Carteira: Risco de Churn',
          description: `O cliente ${contact.name} (Empresa: ${companies.find(c => c.id === contact.companyId)?.name}) não compra há mais de 30 dias.`,
          date: new Date().toISOString(),
          user: { name: 'Sistema', avatar: '' },
          completed: false,
        });
        newActivitiesCount++;
      }
    }

    return newActivitiesCount;
  }, [contacts, activities, companies, addActivity]);

  const checkStagnantDeals = useCallback(async () => {
    const tenDaysAgo = new Date();
    tenDaysAgo.setDate(tenDaysAgo.getDate() - 10);

    const stagnantDeals = rawDeals.filter(
      d =>
        d.status !== DealStatus.CLOSED_WON &&
        d.status !== DealStatus.CLOSED_LOST &&
        (!d.lastStageChangeDate || new Date(d.lastStageChangeDate) < tenDaysAgo)
    );

    let count = 0;
    if (stagnantDeals.length > 0) {
      for (const deal of stagnantDeals.slice(0, 3)) {
        const existingAlert = activities.find(
          a => a.dealId === deal.id && a.title === 'Alerta de Estagnação' && !a.completed
        );

        if (!existingAlert) {
          await addActivity({
            dealId: deal.id,
            dealTitle: deal.title,
            type: 'TASK',
            title: 'Alerta de Estagnação',
            description: `Oportunidade parada em ${deal.status} há mais de 10 dias.`,
            date: new Date().toISOString(),
            user: { name: 'Sistema', avatar: '' },
            completed: false,
          });
          count++;
        }
      }
      return stagnantDeals.length;
    }
    return 0;
  }, [rawDeals, activities, addActivity]);

  // Build the context value
  const value: CRMContextType = useMemo(
    () => ({
      loading,
      error,
      deals,
      companies,
      contacts,
      leads,
      leadsFromContacts,
      products,
      customFieldDefinitions,
      availableTags,
      addCompany,
      updateCompany,
      deleteCompany,
      lifecycleStages,
      addLifecycleStage,
      updateLifecycleStage,
      deleteLifecycleStage,
      reorderLifecycleStages,
      boards,
      activeBoard,
      activeBoardId,
      setActiveBoardId,
      addBoard,
      updateBoard,
      deleteBoard,
      addDeal,
      updateDeal,
      moveDeal,
      deleteDeal,
      addItemToDeal,
      removeItemFromDeal,
      activities,
      addActivity,
      updateActivity,
      deleteActivity,
      toggleActivityCompletion,
      addLead,
      updateLead,
      convertLead,
      discardLead,
      addContact,
      updateContact,
      deleteContact,
      updateContactStage,
      convertContactToDeal,
      addCustomField,
      updateCustomField,
      removeCustomField,
      addTag,
      removeTag,
      checkWalletHealth,
      checkStagnantDeals,
      isGlobalAIOpen,
      setIsGlobalAIOpen,
      aiProvider,
      setAiProvider,
      aiApiKey,
      setAiApiKey,
      aiModel,
      setAiModel,
      aiThinking,
      setAiThinking,
      aiSearch,
      setAiSearch,
      aiAnthropicCaching,
      setAiAnthropicCaching,
      refresh,
    }),
    [
      loading,
      error,
      deals,
      companies,
      contacts,
      leads,
      leadsFromContacts,
      products,
      customFieldDefinitions,
      availableTags,
      addCompany,
      updateCompany,
      deleteCompany,
      lifecycleStages,
      addLifecycleStage,
      updateLifecycleStage,
      deleteLifecycleStage,
      reorderLifecycleStages,
      boards,
      activeBoard,
      activeBoardId,
      setActiveBoardId,
      addBoard,
      updateBoard,
      deleteBoard,
      addDeal,
      updateDeal,
      moveDeal,
      deleteDeal,
      addItemToDeal,
      removeItemFromDeal,
      activities,
      addActivity,
      updateActivity,
      deleteActivity,
      toggleActivityCompletion,
      addLead,
      updateLead,
      convertLead,
      discardLead,
      addContact,
      updateContact,
      deleteContact,
      updateContactStage,
      convertContactToDeal,
      addCustomField,
      updateCustomField,
      removeCustomField,
      addTag,
      removeTag,
      checkWalletHealth,
      checkStagnantDeals,
      isGlobalAIOpen,
      setIsGlobalAIOpen,
      aiProvider,
      setAiProvider,
      aiApiKey,
      setAiApiKey,
      aiModel,
      setAiModel,
      aiThinking,
      setAiThinking,
      aiSearch,
      setAiSearch,
      aiAnthropicCaching,
      setAiAnthropicCaching,
      refresh,
    ]
  );

  return <CRMContext.Provider value={value}>{children}</CRMContext.Provider>;
};

// ============================================
// MAIN PROVIDER (Composes all providers)
// ============================================

export const CRMProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
  return (
    <SettingsProvider>
      <BoardsProvider>
        <ContactsProvider>
          <ActivitiesProvider>
            <DealsProvider>
              <CRMInnerProvider>{children}</CRMInnerProvider>
            </DealsProvider>
          </ActivitiesProvider>
        </ContactsProvider>
      </BoardsProvider>
    </SettingsProvider>
  );
};

// ============================================
// LEGACY HOOK (Backward Compatible)
// ============================================

export const useCRM = () => {
  const context = useContext(CRMContext);
  if (context === undefined) {
    throw new Error('useCRM must be used within a CRMProvider');
  }
  return context;
};
