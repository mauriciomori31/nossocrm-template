/**
 * @deprecated Use deal.isWon e deal.isLost para verificar status final.
 * O estágio atual é deal.status (UUID do stage no board).
 * Mantido apenas para compatibilidade de código legado.
 */
export enum DealStatus {
  NEW = 'NEW',
  CONTACTED = 'CONTACTED',
  PROPOSAL = 'PROPOSAL',
  NEGOTIATION = 'NEGOTIATION',
  CLOSED_WON = 'CLOSED_WON',
  CLOSED_LOST = 'CLOSED_LOST',
}

// Estágio do Ciclo de Vida (Dinâmico)
export interface LifecycleStage {
  id: string;
  name: string;
  color: string; // Tailwind class or hex
  order: number;
  isDefault?: boolean; // Cannot be deleted
}

// Estágio do Contato no Funil de Carteira
// @deprecated - Use LifecycleStage IDs (strings)
export enum ContactStage {
  LEAD = 'LEAD', // Suspeito - ainda não qualificado
  MQL = 'MQL', // Marketing Qualified Lead
  PROSPECT = 'PROSPECT', // Em negociação ativa
  CUSTOMER = 'CUSTOMER', // Cliente fechado
}

// @deprecated - Use Contact com stage: ContactStage.LEAD
// Mantido apenas para compatibilidade de migração
export interface Lead {
  id: string;
  name: string; // Nome da pessoa
  email: string;
  companyName: string; // Texto solto, ainda não é uma Company
  role?: string;
  source: 'WEBSITE' | 'LINKEDIN' | 'REFERRAL' | 'MANUAL';
  status: 'NEW' | 'CONTACTED' | 'QUALIFIED' | 'DISQUALIFIED';
  createdAt: string;
  notes?: string;
}

// A Empresa (Quem paga)
export interface Company {
  id: string;
  name: string;
  industry?: string;
  website?: string;
  createdAt: string;
}

// A Pessoa (Com quem falamos)
export interface Contact {
  id: string;
  companyId: string; // Link com a empresa
  name: string;
  role?: string;
  email: string;
  phone: string;
  avatar?: string;
  lastInteraction?: string;
  birthDate?: string; // New field for Agentic AI tasks
  status: 'ACTIVE' | 'INACTIVE' | 'CHURNED';
  stage: string; // ID do LifecycleStage (antes era ContactStage enum)
  source?: 'WEBSITE' | 'LINKEDIN' | 'REFERRAL' | 'MANUAL'; // Origem do contato
  notes?: string; // Anotações gerais
  lastPurchaseDate?: string;
  totalValue?: number; // LTV
  createdAt: string;
}

// ITEM 3: Produtos e Serviços
export interface Product {
  id: string;
  name: string;
  description?: string;
  price: number;
  sku?: string;
}

export interface DealItem {
  id: string;
  productId: string;
  name: string; // Snapshot of name
  quantity: number;
  price: number; // Snapshot of price
}

// CUSTOM FIELDS DEFINITION
export type CustomFieldType = 'text' | 'number' | 'date' | 'select';

export interface CustomFieldDefinition {
  id: string;
  key: string; // camelCase identifier
  label: string;
  type: CustomFieldType;
  options?: string[]; // For select type
}

// O Dinheiro/Oportunidade (O que vai no Kanban)
export interface Deal {
  id: string;
  title: string; // Ex: "Licença Anual"
  companyId: string; // Relacionamento
  contactId: string; // Relacionamento
  boardId: string; // Qual board este deal pertence
  value: number;
  items: DealItem[]; // Lista de Produtos
  status: string; // Stage ID dentro do board (UUID)
  isWon: boolean; // Deal foi ganho?
  isLost: boolean; // Deal foi perdido?
  closedAt?: string; // Quando foi fechado
  createdAt: string;
  updatedAt: string;
  probability: number;
  priority: 'low' | 'medium' | 'high';
  owner: {
    name: string;
    avatar: string;
  };
  nextActivity?: {
    type: 'CALL' | 'MEETING' | 'EMAIL' | 'TASK';
    date: string;
    isOverdue?: boolean;
  };
  tags: string[];
  aiSummary?: string;
  customFields?: Record<string, any>; // Dynamic fields storage
  lastStageChangeDate?: string; // For stagnation tracking
  lossReason?: string; // For win/loss analysis
}

// Helper Type para Visualização (Desnormalizado)
export interface DealView extends Deal {
  companyName: string;
  contactName: string;
  contactEmail: string;
}

export interface Activity {
  id: string;
  dealId: string;
  dealTitle: string;
  type: 'CALL' | 'MEETING' | 'EMAIL' | 'TASK' | 'NOTE' | 'STATUS_CHANGE';
  title: string;
  description?: string;
  date: string;
  user: {
    name: string;
    avatar: string;
  };
  completed: boolean;
}

export interface DashboardStats {
  totalDeals: number;
  pipelineValue: number;
  conversionRate: number;
  winRate: number;
}

// Estágio de um Board (etapa do Kanban)
export interface BoardStage {
  id: string;
  label: string;
  color: string;
  linkedLifecycleStage?: string; // ID do LifecycleStage
}

// Metas do Board (Revenue Ops)
export interface BoardGoal {
  description: string; // "Converter 20% dos leads"
  kpi: string; // "Taxa de Conversão"
  targetValue: string; // "20%"
  currentValue?: string; // "15%" (Progresso atual)
  type?: 'currency' | 'number' | 'percentage'; // Explicit type for calculation
}

// Persona do Agente (Quem opera o board)
export interface AgentPersona {
  name: string; // "Dra. Ana (Virtual)"
  role: string; // "Consultora de Beleza"
  behavior: string; // "Empática, usa emojis..."
}

// Board = Kanban configurável (ex: Pipeline de Vendas, Onboarding, etc)
export interface Board {
  id: string;
  name: string;
  description?: string;
  linkedStage?: ContactStage; // Quando mover para etapa final, atualiza o stage do contato
  linkedLifecycleStage?: string; // Qual lifecycle stage este board gerencia (ex: 'LEAD', 'MQL', 'CUSTOMER')
  nextBoardId?: string; // Quando mover para etapa final (Ganho), cria um card neste board
  stages: BoardStage[];
  isDefault?: boolean;
  template?: 'PRE_SALES' | 'SALES' | 'ONBOARDING' | 'CS' | 'CUSTOM'; // Template usado para criar este board
  automationSuggestions?: string[]; // Sugestões de automação da IA

  // AI Strategy Fields
  goal?: BoardGoal;
  agentPersona?: AgentPersona;
  entryTrigger?: string; // "Quem deve entrar aqui?"

  createdAt: string;
}

// Estágios padrão do board de vendas
export const DEFAULT_BOARD_STAGES: BoardStage[] = [
  { id: DealStatus.NEW, label: 'Novas Oportunidades', color: 'bg-blue-500' },
  { id: DealStatus.CONTACTED, label: 'Contatado', color: 'bg-yellow-500' },
  {
    id: DealStatus.PROPOSAL,
    label: 'Proposta',
    color: 'bg-purple-500',
    linkedLifecycleStage: ContactStage.PROSPECT,
  },
  {
    id: DealStatus.NEGOTIATION,
    label: 'Negociação',
    color: 'bg-orange-500',
    linkedLifecycleStage: ContactStage.PROSPECT,
  },
  {
    id: DealStatus.CLOSED_WON,
    label: 'Ganho',
    color: 'bg-green-500',
    linkedLifecycleStage: ContactStage.CUSTOMER,
  },
];

// @deprecated - Use DEFAULT_BOARD_STAGES
export const PIPELINE_STAGES = DEFAULT_BOARD_STAGES;

// Registry Types
export interface RegistryTemplate {
  id: string;
  path: string;
  name: string;
  description: string;
  author: string;
  version: string;
  tags: string[];
}

export interface RegistryIndex {
  version: string;
  templates: RegistryTemplate[];
}

export interface JourneyDefinition {
  schemaVersion: string;
  name?: string;
  boards: {
    slug: string;
    name: string;
    columns: {
      name: string;
      color?: string;
      linkedLifecycleStage?: string;
    }[];
    strategy?: {
      agentPersona?: AgentPersona;
      goal?: BoardGoal;
      entryTrigger?: string;
    };
  }[];
}
