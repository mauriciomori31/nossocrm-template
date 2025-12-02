import { supabase } from './client';
import { Board, BoardStage, BoardGoal, AgentPersona } from '@/types';
import { sanitizeUUID } from './utils';

// ============================================
// BOARDS SERVICE
// ============================================

export interface DbBoard {
  id: string;
  name: string;
  description: string | null;
  is_default: boolean;
  template: string | null;
  linked_lifecycle_stage: string | null;
  next_board_id: string | null;
  goal_description: string | null;
  goal_kpi: string | null;
  goal_target_value: string | null;
  goal_type: string | null;
  agent_name: string | null;
  agent_role: string | null;
  agent_behavior: string | null;
  entry_trigger: string | null;
  automation_suggestions: string[] | null;
  position: number;
  created_at: string;
  updated_at: string;
  owner_id: string | null;
}

export interface DbBoardStage {
  id: string;
  board_id: string;
  name: string;
  label: string | null;
  color: string | null;
  order: number;
  is_default: boolean;
  linked_lifecycle_stage: string | null;
  created_at: string;
}

// Transform DB Stage -> App Stage
const transformStage = (db: DbBoardStage): BoardStage => ({
  id: db.id,
  label: db.label || db.name, // label pode ser null, usar name como fallback
  color: db.color || 'bg-gray-500',
  linkedLifecycleStage: db.linked_lifecycle_stage || undefined,
});

// Transform DB -> App
const transformBoard = (db: DbBoard, stages: DbBoardStage[]): Board => {
  const goal: BoardGoal | undefined = db.goal_description ? {
    description: db.goal_description,
    kpi: db.goal_kpi || '',
    targetValue: db.goal_target_value || '',
    type: (db.goal_type as BoardGoal['type']) || undefined,
  } : undefined;

  const agentPersona: AgentPersona | undefined = db.agent_name ? {
    name: db.agent_name,
    role: db.agent_role || '',
    behavior: db.agent_behavior || '',
  } : undefined;

  return {
    id: db.id,
    name: db.name,
    description: db.description || undefined,
    isDefault: db.is_default,
    template: (db.template as Board['template']) || undefined,
    linkedLifecycleStage: db.linked_lifecycle_stage || undefined,
    nextBoardId: db.next_board_id || undefined,
    goal,
    agentPersona,
    entryTrigger: db.entry_trigger || undefined,
    automationSuggestions: db.automation_suggestions || [],
    stages: stages
      .filter(s => s.board_id === db.id)
      .sort((a, b) => a.order - b.order)
      .map(transformStage),
    createdAt: db.created_at,
  };
};

// Transform App -> DB
const transformToDb = (board: Omit<Board, 'id' | 'createdAt'>, companyId?: string, order?: number): Partial<DbBoard> => ({
  name: board.name,
  description: board.description || null,
  is_default: board.isDefault || false,
  template: board.template || null,
  linked_lifecycle_stage: board.linkedLifecycleStage || null,
  next_board_id: sanitizeUUID(board.nextBoardId),
  goal_description: board.goal?.description || null,
  goal_kpi: board.goal?.kpi || null,
  goal_target_value: board.goal?.targetValue || null,
  goal_type: board.goal?.type || null,
  agent_name: board.agentPersona?.name || null,
  agent_role: board.agentPersona?.role || null,
  agent_behavior: board.agentPersona?.behavior || null,
  entry_trigger: board.entryTrigger || null,
  automation_suggestions: board.automationSuggestions || null,
  position: order ?? 0,
  ...(sanitizeUUID(companyId) && { company_id: sanitizeUUID(companyId) }),
});

// Transform App Stage -> DB Stage
const transformStageToDb = (stage: BoardStage, boardId: string, orderNum: number, companyId?: string): Partial<DbBoardStage> => ({
  board_id: boardId, // boardId já vem validado do create/update
  name: stage.label,
  label: stage.label,
  color: stage.color || 'bg-gray-500',
  order: orderNum,
  linked_lifecycle_stage: stage.linkedLifecycleStage || null,
  ...(sanitizeUUID(companyId) && { company_id: sanitizeUUID(companyId) }),
});

export const boardsService = {
  async getAll(): Promise<{ data: Board[] | null; error: Error | null }> {
    try {
      const [boardsResult, stagesResult] = await Promise.all([
        supabase.from('boards').select('*').order('position', { ascending: true }).order('created_at', { ascending: true }),
        supabase.from('board_stages').select('*').order('order', { ascending: true }),
      ]);

      if (boardsResult.error) return { data: null, error: boardsResult.error };
      if (stagesResult.error) return { data: null, error: stagesResult.error };

      const boards = (boardsResult.data || []).map(b => 
        transformBoard(b as DbBoard, stagesResult.data as DbBoardStage[])
      );

      return { data: boards, error: null };
    } catch (e) {
      return { data: null, error: e as Error };
    }
  },

  async create(board: Omit<Board, 'id' | 'createdAt'>, companyId: string, order?: number): Promise<{ data: Board | null; error: Error | null }> {
    try {
      // Get next order if not provided
      let boardOrder = order;
      if (boardOrder === undefined) {
        const { data: existingBoards } = await supabase
          .from('boards')
          .select('position')
          .order('position', { ascending: false })
          .limit(1);
        boardOrder = existingBoards && existingBoards.length > 0 ? existingBoards[0].position + 1 : 0;
      }

      // 1. Create board
      const { data: newBoard, error: boardError } = await supabase
        .from('boards')
        .insert(transformToDb(board, companyId, boardOrder))
        .select()
        .single();

      if (boardError) return { data: null, error: boardError };

      // 2. Create stages using transformStageToDb
      const stagesToInsert = (board.stages || []).map((stage, index) => 
        transformStageToDb(stage, newBoard.id, index, companyId)
      );

      if (stagesToInsert.length > 0) {
        const { error: stagesError } = await supabase
          .from('board_stages')
          .insert(stagesToInsert);

        if (stagesError) return { data: null, error: stagesError };
      }

      // 3. Fetch complete board with stages
      const { data: stages } = await supabase
        .from('board_stages')
        .select('*')
        .eq('board_id', newBoard.id)
        .order('order');

      return { 
        data: transformBoard(newBoard as DbBoard, (stages || []) as DbBoardStage[]), 
        error: null 
      };
    } catch (e) {
      return { data: null, error: e as Error };
    }
  },

  async update(id: string, updates: Partial<Board>, companyId?: string): Promise<{ error: Error | null }> {
    try {
      const dbUpdates: Partial<DbBoard> = {};
      
      if (updates.name !== undefined) dbUpdates.name = updates.name;
      if (updates.description !== undefined) dbUpdates.description = updates.description || null;
      if (updates.isDefault !== undefined) dbUpdates.is_default = updates.isDefault;
      if (updates.template !== undefined) dbUpdates.template = updates.template || null;
      if (updates.linkedLifecycleStage !== undefined) dbUpdates.linked_lifecycle_stage = updates.linkedLifecycleStage || null;
      if (updates.nextBoardId !== undefined) dbUpdates.next_board_id = updates.nextBoardId || null;
      if (updates.entryTrigger !== undefined) dbUpdates.entry_trigger = updates.entryTrigger || null;
      if (updates.automationSuggestions !== undefined) dbUpdates.automation_suggestions = updates.automationSuggestions || null;
      
      if (updates.goal !== undefined) {
        dbUpdates.goal_description = updates.goal?.description || null;
        dbUpdates.goal_kpi = updates.goal?.kpi || null;
        dbUpdates.goal_target_value = updates.goal?.targetValue || null;
        dbUpdates.goal_type = updates.goal?.type || null;
      }
      
      if (updates.agentPersona !== undefined) {
        dbUpdates.agent_name = updates.agentPersona?.name || null;
        dbUpdates.agent_role = updates.agentPersona?.role || null;
        dbUpdates.agent_behavior = updates.agentPersona?.behavior || null;
      }

      dbUpdates.updated_at = new Date().toISOString();

      const { error } = await supabase
        .from('boards')
        .update(dbUpdates)
        .eq('id', id);

      if (error) return { error };

      // Update stages if provided
      if (updates.stages && companyId) {
        // Delete existing stages
        await supabase.from('board_stages').delete().eq('board_id', id);
        
        // Insert new stages using transformStageToDb
        const stagesToInsert = updates.stages.map((stage, index) => 
          transformStageToDb(stage, id, index, companyId)
        );

        if (stagesToInsert.length > 0) {
          const { error: stagesError } = await supabase
            .from('board_stages')
            .insert(stagesToInsert);

          if (stagesError) return { error: stagesError };
        }
      }

      return { error: null };
    } catch (e) {
      return { error: e as Error };
    }
  },

  async canDelete(boardId: string): Promise<{ canDelete: boolean; dealCount: number; error: Error | null }> {
    try {
      const { count, error } = await supabase
        .from('deals')
        .select('*', { count: 'exact', head: true })
        .eq('board_id', boardId);

      if (error) return { canDelete: false, dealCount: 0, error };

      return {
        canDelete: (count ?? 0) === 0,
        dealCount: count ?? 0,
        error: null,
      };
    } catch (e) {
      return { canDelete: false, dealCount: 0, error: e as Error };
    }
  },

  async moveDealsToBoard(fromBoardId: string, toBoardId: string): Promise<{ error: Error | null }> {
    try {
      // Pega o primeiro stage do board de destino
      const { data: stages, error: stagesError } = await supabase
        .from('board_stages')
        .select('id')
        .eq('board_id', toBoardId)
        .order('order', { ascending: true })
        .limit(1);

      if (stagesError) return { error: stagesError };
      if (!stages || stages.length === 0) {
        return { error: new Error('Board de destino não tem stages') };
      }

      const firstStageId = stages[0].id;

      // Move todos os deals
      const { error } = await supabase
        .from('deals')
        .update({ board_id: toBoardId, stage_id: firstStageId })
        .eq('board_id', fromBoardId);

      return { error };
    } catch (e) {
      return { error: e as Error };
    }
  },

  async delete(id: string): Promise<{ error: Error | null }> {
    try {
      // Verifica se pode deletar
      const { canDelete, dealCount, error: checkError } = await this.canDelete(id);
      if (checkError) return { error: checkError };

      if (!canDelete) {
        return {
          error: new Error(
            `Não é possível excluir este board. Existem ${dealCount} negócio(s) vinculado(s). Mova ou exclua os negócios primeiro.`
          ),
        };
      }

      // Stages are deleted automatically via CASCADE
      const { error } = await supabase
        .from('boards')
        .delete()
        .eq('id', id);

      return { error };
    } catch (e) {
      return { error: e as Error };
    }
  },

  async deleteWithMoveDeals(boardId: string, targetBoardId: string): Promise<{ error: Error | null }> {
    try {
      // 1. Move os deals primeiro
      const { error: moveError } = await this.moveDealsToBoard(boardId, targetBoardId);
      if (moveError) return { error: moveError };

      // 2. Agora pode deletar
      const { error } = await supabase
        .from('boards')
        .delete()
        .eq('id', boardId);

      return { error };
    } catch (e) {
      return { error: e as Error };
    }
  },

  // Stage operations
  async addStage(boardId: string, stage: Omit<BoardStage, 'id'>): Promise<{ data: BoardStage | null; error: Error | null }> {
    try {
      // Get current max order
      const { data: existingStages } = await supabase
        .from('board_stages')
        .select('order')
        .eq('board_id', boardId)
        .order('order', { ascending: false })
        .limit(1);

      const nextOrder = existingStages && existingStages.length > 0 
        ? existingStages[0].order + 1 
        : 0;

      const { data, error } = await supabase
        .from('board_stages')
        .insert({
          board_id: boardId,
          label: stage.label,
          color: stage.color || 'bg-gray-500',
          order: nextOrder,
          linked_lifecycle_stage: stage.linkedLifecycleStage || null,
        })
        .select()
        .single();

      if (error) return { data: null, error };

      return { data: transformStage(data as DbBoardStage), error: null };
    } catch (e) {
      return { data: null, error: e as Error };
    }
  },

  async updateStage(stageId: string, updates: Partial<BoardStage>): Promise<{ error: Error | null }> {
    try {
      const dbUpdates: Partial<DbBoardStage> = {};
      
      if (updates.label !== undefined) dbUpdates.label = updates.label;
      if (updates.color !== undefined) dbUpdates.color = updates.color;
      if (updates.linkedLifecycleStage !== undefined) {
        dbUpdates.linked_lifecycle_stage = updates.linkedLifecycleStage || null;
      }

      const { error } = await supabase
        .from('board_stages')
        .update(dbUpdates)
        .eq('id', stageId);

      return { error };
    } catch (e) {
      return { error: e as Error };
    }
  },

  async deleteStage(stageId: string): Promise<{ error: Error | null }> {
    try {
      const { error } = await supabase
        .from('board_stages')
        .delete()
        .eq('id', stageId);

      return { error };
    } catch (e) {
      return { error: e as Error };
    }
  },
};
