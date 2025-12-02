import { supabase } from './client';
import { Deal, DealItem } from '@/types';
import { sanitizeUUID, requireUUID, isValidUUID } from './utils';

// ============================================
// DEALS SERVICE
// ============================================

export interface DbDeal {
  id: string;
  title: string;
  value: number;
  probability: number;
  status: string | null; // @deprecated - usar is_won/is_lost
  priority: string;
  board_id: string | null;
  stage_id: string | null;
  contact_id: string | null;
  crm_company_id: string | null;
  ai_summary: string | null;
  loss_reason: string | null;
  tags: string[];
  last_stage_change_date: string | null;
  custom_fields: Record<string, any>;
  created_at: string;
  updated_at: string;
  owner_id: string | null;
  // Novos campos para status final
  is_won: boolean;
  is_lost: boolean;
  closed_at: string | null;
}

export interface DbDealItem {
  id: string;
  deal_id: string;
  product_id: string | null;
  name: string;
  quantity: number;
  price: number;
  created_at: string;
}

// Transform DB -> App
const transformDeal = (db: DbDeal, items: DbDealItem[]): Deal => {
  // Usar stage_id como status (UUID do estágio no kanban)
  // is_won e is_lost indicam se o deal foi fechado
  const stageStatus = db.stage_id || db.status || '';
  
  return {
    id: db.id,
    title: db.title,
    value: db.value || 0,
    probability: db.probability || 0,
    status: stageStatus,
    isWon: db.is_won ?? false,
    isLost: db.is_lost ?? false,
    closedAt: db.closed_at || undefined,
    priority: (db.priority as Deal['priority']) || 'medium',
    boardId: db.board_id || '',
    contactId: db.contact_id || '',
    companyId: db.crm_company_id || '',
    aiSummary: db.ai_summary || undefined,
    lossReason: db.loss_reason || undefined,
    tags: db.tags || [],
    lastStageChangeDate: db.last_stage_change_date || undefined,
    customFields: db.custom_fields || {},
    createdAt: db.created_at,
    updatedAt: db.updated_at,
    items: items
      .filter(i => i.deal_id === db.id)
      .map(i => ({
        id: i.id,
        productId: i.product_id || '',
        name: i.name,
        quantity: i.quantity,
        price: i.price,
      })),
    owner: { name: 'Você', avatar: '' }, // Will be enriched later
  };
};

// Transform App -> DB
const transformDealToDb = (deal: Partial<Deal>): Partial<DbDeal> => {
  const db: Partial<DbDeal> = {};
  
  if (deal.title !== undefined) db.title = deal.title;
  if (deal.value !== undefined) db.value = deal.value;
  if (deal.probability !== undefined) db.probability = deal.probability;
  
  // Status = stage_id (UUID do estágio no kanban)
  if (deal.status !== undefined && isValidUUID(deal.status)) {
    db.stage_id = deal.status;
  }
  
  // Campos de fechamento
  if (deal.isWon !== undefined) db.is_won = deal.isWon;
  if (deal.isLost !== undefined) db.is_lost = deal.isLost;
  if (deal.closedAt !== undefined) db.closed_at = deal.closedAt || null;
  
  if (deal.priority !== undefined) db.priority = deal.priority;
  if (deal.boardId !== undefined) db.board_id = sanitizeUUID(deal.boardId);
  if (deal.contactId !== undefined) db.contact_id = sanitizeUUID(deal.contactId);
  if (deal.companyId !== undefined) db.crm_company_id = sanitizeUUID(deal.companyId);
  if (deal.aiSummary !== undefined) db.ai_summary = deal.aiSummary || null;
  if (deal.lossReason !== undefined) db.loss_reason = deal.lossReason || null;
  if (deal.tags !== undefined) db.tags = deal.tags;
  if (deal.lastStageChangeDate !== undefined) db.last_stage_change_date = deal.lastStageChangeDate || null;
  if (deal.customFields !== undefined) db.custom_fields = deal.customFields;
  
  return db;
};

export const dealsService = {
  async getAll(): Promise<{ data: Deal[] | null; error: Error | null }> {
    try {
      const [dealsResult, itemsResult] = await Promise.all([
        supabase.from('deals').select('*').order('created_at', { ascending: false }),
        supabase.from('deal_items').select('*'),
      ]);

      if (dealsResult.error) return { data: null, error: dealsResult.error };
      if (itemsResult.error) return { data: null, error: itemsResult.error };

      const deals = (dealsResult.data || []).map(d => 
        transformDeal(d as DbDeal, (itemsResult.data || []) as DbDealItem[])
      );
      return { data: deals, error: null };
    } catch (e) {
      return { data: null, error: e as Error };
    }
  },

  async getById(id: string): Promise<{ data: Deal | null; error: Error | null }> {
    try {
      const [dealResult, itemsResult] = await Promise.all([
        supabase.from('deals').select('*').eq('id', id).single(),
        supabase.from('deal_items').select('*').eq('deal_id', id),
      ]);

      if (dealResult.error) return { data: null, error: dealResult.error };

      const deal = transformDeal(dealResult.data as DbDeal, (itemsResult.data || []) as DbDealItem[]);
      return { data: deal, error: null };
    } catch (e) {
      return { data: null, error: e as Error };
    }
  },

  async create(deal: Omit<Deal, 'id' | 'createdAt'> & { stageId?: string }, companyId: string | null): Promise<{ data: Deal | null; error: Error | null }> {
    try {
      // stageId pode vir separado ou ser o mesmo que status
      const stageId = deal.stageId || deal.status || null;
      
      // Validação: board_id é OBRIGATÓRIO e deve existir
      let boardId: string;
      try {
        boardId = requireUUID(deal.boardId, 'Board ID');
      } catch (e) {
        return { data: null, error: e as Error };
      }
      
      // Validação: verifica se o board existe antes de inserir
      const { data: boardExists, error: boardCheckError } = await supabase
        .from('boards')
        .select('id')
        .eq('id', boardId)
        .single();
      
      if (boardCheckError || !boardExists) {
        return { 
          data: null, 
          error: new Error(`Board não encontrado: ${boardId}. Recarregue a página.`) 
        };
      }
      
      const insertData = {
        title: deal.title,
        value: deal.value || 0,
        probability: deal.probability || 0,
        status: deal.status,
        priority: deal.priority || 'medium',
        board_id: boardId,
        stage_id: sanitizeUUID(stageId),
        contact_id: sanitizeUUID(deal.contactId),
        crm_company_id: sanitizeUUID(deal.companyId),
        tags: deal.tags || [],
        custom_fields: deal.customFields || {},
        // company_id (tenant) será preenchido pelo trigger
      };
      
      const { data, error } = await supabase
        .from('deals')
        .insert(insertData)
        .select()
        .single();

      if (error) return { data: null, error };

      // Create items if any
      if (deal.items && deal.items.length > 0) {
        const itemsToInsert = deal.items.map(item => ({
          deal_id: data.id,
          product_id: item.productId || null,
          name: item.name,
          quantity: item.quantity,
          price: item.price,
        }));

        const { error: itemsError } = await supabase
          .from('deal_items')
          .insert(itemsToInsert);

        if (itemsError) return { data: null, error: itemsError };
      }

      // Fetch items
      const { data: items } = await supabase
        .from('deal_items')
        .select('*')
        .eq('deal_id', data.id);

      return { 
        data: transformDeal(data as DbDeal, (items || []) as DbDealItem[]), 
        error: null 
      };
    } catch (e) {
      return { data: null, error: e as Error };
    }
  },

  async update(id: string, updates: Partial<Deal>): Promise<{ error: Error | null }> {
    try {
      const dbUpdates = transformDealToDb(updates);
      dbUpdates.updated_at = new Date().toISOString();

      const { error } = await supabase
        .from('deals')
        .update(dbUpdates)
        .eq('id', id);

      return { error };
    } catch (e) {
      return { error: e as Error };
    }
  },

  async delete(id: string): Promise<{ error: Error | null }> {
    try {
      // Items are deleted automatically via CASCADE
      const { error } = await supabase
        .from('deals')
        .delete()
        .eq('id', id);

      return { error };
    } catch (e) {
      return { error: e as Error };
    }
  },

  async deleteByBoardId(boardId: string): Promise<{ error: Error | null }> {
    try {
      // Items are deleted automatically via CASCADE
      const { error } = await supabase
        .from('deals')
        .delete()
        .eq('board_id', boardId);

      return { error };
    } catch (e) {
      return { error: e as Error };
    }
  },

  async addItem(dealId: string, item: Omit<DealItem, 'id'>): Promise<{ data: DealItem | null; error: Error | null }> {
    try {
      const { data, error } = await supabase
        .from('deal_items')
        .insert({
          deal_id: sanitizeUUID(dealId),
          product_id: sanitizeUUID(item.productId),
          name: item.name,
          quantity: item.quantity,
          price: item.price,
        })
        .select()
        .single();

      if (error) return { data: null, error };

      // Update deal value
      await this.recalculateDealValue(dealId);

      return {
        data: {
          id: data.id,
          productId: data.product_id || '',
          name: data.name,
          quantity: data.quantity,
          price: data.price,
        },
        error: null,
      };
    } catch (e) {
      return { data: null, error: e as Error };
    }
  },

  async removeItem(dealId: string, itemId: string): Promise<{ error: Error | null }> {
    try {
      const { error } = await supabase
        .from('deal_items')
        .delete()
        .eq('id', itemId);

      if (error) return { error };

      // Update deal value
      await this.recalculateDealValue(dealId);

      return { error: null };
    } catch (e) {
      return { error: e as Error };
    }
  },

  async recalculateDealValue(dealId: string): Promise<{ error: Error | null }> {
    try {
      const { data: items } = await supabase
        .from('deal_items')
        .select('price, quantity')
        .eq('deal_id', dealId);

      const newValue = (items || []).reduce((sum, i) => sum + (i.price * i.quantity), 0);

      const { error } = await supabase
        .from('deals')
        .update({ value: newValue, updated_at: new Date().toISOString() })
        .eq('id', dealId);

      return { error };
    } catch (e) {
      return { error: e as Error };
    }
  },

  // Marcar deal como GANHO
  async markAsWon(dealId: string): Promise<{ error: Error | null }> {
    try {
      const { error } = await supabase
        .from('deals')
        .update({
          is_won: true,
          is_lost: false,
          closed_at: new Date().toISOString(),
          updated_at: new Date().toISOString(),
        })
        .eq('id', dealId);

      return { error };
    } catch (e) {
      return { error: e as Error };
    }
  },

  // Marcar deal como PERDIDO
  async markAsLost(dealId: string, lossReason?: string): Promise<{ error: Error | null }> {
    try {
      const updates: Record<string, any> = {
        is_lost: true,
        is_won: false,
        closed_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
      };
      
      if (lossReason) {
        updates.loss_reason = lossReason;
      }

      const { error } = await supabase
        .from('deals')
        .update(updates)
        .eq('id', dealId);

      return { error };
    } catch (e) {
      return { error: e as Error };
    }
  },

  // Reabrir deal fechado
  async reopen(dealId: string): Promise<{ error: Error | null }> {
    try {
      const { error } = await supabase
        .from('deals')
        .update({
          is_won: false,
          is_lost: false,
          closed_at: null,
          updated_at: new Date().toISOString(),
        })
        .eq('id', dealId);

      return { error };
    } catch (e) {
      return { error: e as Error };
    }
  },
};
