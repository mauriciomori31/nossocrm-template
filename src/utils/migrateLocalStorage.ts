import { Contact, ContactStage, Lead, Board, DEFAULT_BOARD_STAGES } from '@/types';

const MIGRATION_KEY = 'crm_migration_v1_completed';

export const migrateLocalStorage = () => {
  try {
    const isMigrated = localStorage.getItem(MIGRATION_KEY);
    if (isMigrated) return;

    console.log('Iniciando migração para v1 (Estrutura de Dados)...');

    // 1. Migrar Leads para Contacts
    const storedLeads = localStorage.getItem('crm_leads');
    const storedContacts = localStorage.getItem('crm_contacts');
    
    let leads: Lead[] = storedLeads ? JSON.parse(storedLeads) : [];
    let contacts: Contact[] = storedContacts ? JSON.parse(storedContacts) : [];

    if (leads.length > 0) {
      const newContactsFromLeads: Contact[] = leads.map(lead => ({
        id: lead.id,
        companyId: crypto.randomUUID(), // Gera um ID temporário, idealmente buscaria empresa pelo nome
        name: lead.name,
        email: lead.email,
        phone: '',
        role: lead.role,
        source: lead.source,
        status: 'ACTIVE',
        stage: ContactStage.LEAD, // Define como LEAD no funil
        createdAt: lead.createdAt,
        notes: lead.notes,
        lastPurchaseDate: '',
        totalValue: 0
      }));

      // Adiciona aos contatos existentes
      contacts = [...contacts, ...newContactsFromLeads];
      
      // Salva contatos atualizados
      localStorage.setItem('crm_contacts', JSON.stringify(contacts));
      
      // Limpa leads antigos (opcional, pode manter por segurança)
      // localStorage.removeItem('crm_leads'); 
      console.log(`Migrados ${leads.length} leads para contatos.`);
    }

    // 2. Garantir Board Padrão
    const storedBoards = localStorage.getItem('crm_boards');
    if (!storedBoards) {
      const defaultBoard: Board = {
        id: 'default-sales',
        name: 'Pipeline de Vendas',
        description: 'Funil principal de oportunidades',
        linkedStage: ContactStage.PROSPECT,
        stages: DEFAULT_BOARD_STAGES,
        isDefault: true,
        createdAt: new Date().toISOString()
      };
      localStorage.setItem('crm_boards', JSON.stringify([defaultBoard]));
      console.log('Board padrão criado.');
    }

    // Marca migração como concluída
    localStorage.setItem(MIGRATION_KEY, 'true');
    console.log('Migração v1 concluída com sucesso.');

  } catch (error) {
    console.error('Erro na migração v1:', error);
  }
};
