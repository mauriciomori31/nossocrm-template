import { describe, it, expect, vi, beforeEach } from 'vitest';
import type { Mock } from 'vitest';
import {
  generateBoardStructure,
  refineBoardWithAI,
  analyzeLead,
  generateEmailDraft,
  generateObjectionResponse,
  generateDailyBriefing,
  generateRescueMessage,
  chatWithCRM,
  generateBirthdayMessage,
  parseNaturalLanguageAction,
  generateBoardStrategy,
  generateBoardFromDescription,
  chatWithBoardAgent,
  GeneratedBoard,
  AIConfig,
} from './geminiService';
import { generateText } from 'ai';
import type { Deal, DealView, LifecycleStage } from '@/types';
import { DealStatus } from '@/types';

// Mock the 'ai' module
vi.mock('ai', () => ({
  generateText: vi.fn(),
  tool: vi.fn(),
}));

// Mock @ai-sdk/google and others to avoid actual API calls
vi.mock('@ai-sdk/google', () => ({
  google: vi.fn(),
}));

vi.mock('@ai-sdk/anthropic', () => ({
  anthropic: vi.fn(),
}));

vi.mock('@/services/ai/config', () => ({
  getModel: vi.fn().mockReturnValue({}),
}));

// Type-safe mock factory functions
interface GenerateTextResult {
  text: string;
}

const mockConfig: AIConfig = {
  provider: 'google' as const,
  apiKey: 'test-api-key',
  model: 'gemini-2.5-flash',
  thinking: false,
  search: false,
  anthropicCaching: false,
};

const mockDeal: Deal = {
  id: 'deal-1',
  title: 'Enterprise License',
  companyId: 'company-1',
  contactId: 'contact-1',
  boardId: 'board-1',
  value: 50000,
  items: [],
  status: DealStatus.PROPOSAL,
  createdAt: '2024-01-01T00:00:00Z',
  updatedAt: '2024-01-15T00:00:00Z',
  probability: 60,
  priority: 'high' as const,
  owner: { name: 'Sales Rep', avatar: 'https://example.com/avatar.png' },
  tags: ['enterprise'],
  customFields: {},
  isWon: false,
  isLost: false,
};

const mockDealView: DealView = {
  ...mockDeal,
  companyName: 'Acme Corp',
  contactName: 'John Doe',
  contactEmail: 'john@acme.com',
};

const mockGenerateText = generateText as Mock;

describe('geminiService', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe('generateBoardStructure', () => {
    it('should parse valid JSON response correctly', async () => {
      const mockResponse = {
        boardName: 'Test Board',
        description: 'Test Description',
        stages: [{ name: 'Stage 1', color: 'bg-blue-500' }],
        automationSuggestions: [],
      };

      mockGenerateText.mockResolvedValue({
        text: JSON.stringify(mockResponse),
      });

      const result = await generateBoardStructure('test description', [], mockConfig);
      expect(result).toEqual(mockResponse);
    });

    it('should handle markdown code blocks in response', async () => {
      const mockResponse = {
        boardName: 'Test Board',
        stages: [],
      };

      mockGenerateText.mockResolvedValue({
        text: '```json\n' + JSON.stringify(mockResponse) + '\n```',
      });

      const result = await generateBoardStructure('test description', [], mockConfig);
      expect(result).toEqual(mockResponse);
    });

    it('should throw error on invalid JSON', async () => {
      mockGenerateText.mockResolvedValue({
        text: 'Invalid JSON',
      });

      await expect(generateBoardStructure('test description', [], mockConfig)).rejects.toThrow();
    });

    it('should handle lifecycle stages in prompt', async () => {
      const lifecycleStages: LifecycleStage[] = [
        { id: 'LEAD', name: 'Lead', color: 'bg-blue-500', order: 0 },
        { id: 'CUSTOMER', name: 'Customer', color: 'bg-green-500', order: 1 },
      ];

      const mockResponse = {
        boardName: 'Sales Board',
        stages: [
          { name: 'New', linkedLifecycleStage: 'LEAD' },
          { name: 'Won', linkedLifecycleStage: 'CUSTOMER' },
        ],
      };

      mockGenerateText.mockResolvedValue({
        text: JSON.stringify(mockResponse),
      });

      const result = await generateBoardStructure('sales pipeline', lifecycleStages, mockConfig);
      expect(result.stages[0].linkedLifecycleStage).toBe('LEAD');
    });
  });

  describe('refineBoardWithAI', () => {
    it('should merge AI changes with existing board', async () => {
      const currentBoard: Partial<GeneratedBoard> = {
        name: 'Old Name',
        stages: [],
        goal: { description: 'Old Goal', kpi: 'Test KPI', targetValue: '100' },
        agentPersona: { name: 'Old Agent', role: 'Agent', behavior: 'Helpful' },
        entryTrigger: 'Old Trigger',
      };

      const aiResponse = {
        message: 'Updated name',
        board: {
          name: 'New Name',
        },
      };

      mockGenerateText.mockResolvedValue({
        text: JSON.stringify(aiResponse),
      });

      const result = await refineBoardWithAI(
        currentBoard as GeneratedBoard,
        'Change name',
        mockConfig
      );

      expect(result.board).toBeDefined();
      expect(result.board?.name).toBe('New Name');
      expect(result.board?.goal).toEqual(currentBoard.goal);
    });

    it('should return null board if AI decides no change needed', async () => {
      const currentBoard: Partial<GeneratedBoard> = {
        name: 'Test Board',
        stages: [],
      };
      const aiResponse = {
        message: 'Just chatting',
        board: null,
      };

      mockGenerateText.mockResolvedValue({
        text: JSON.stringify(aiResponse),
      });

      const result = await refineBoardWithAI(currentBoard as GeneratedBoard, 'Hello', mockConfig);
      expect(result.board).toBeNull();
      expect(result.message).toBe('Just chatting');
    });

    it('should handle chat history context', async () => {
      const currentBoard: Partial<GeneratedBoard> = {
        name: 'Board',
        stages: [],
        description: 'Test',
        automationSuggestions: [],
        goal: { description: 'Goal', kpi: 'KPI', targetValue: '10' },
        agentPersona: { name: 'Agent', role: 'Role', behavior: 'Behavior' },
        entryTrigger: 'Trigger',
        confidence: 0.9,
      };
      const chatHistory = [
        { role: 'user' as const, content: 'Add a stage' },
        { role: 'ai' as const, content: 'Added new stage' },
      ];

      const aiResponse = { message: 'OK', board: null };

      mockGenerateText.mockResolvedValue({
        text: JSON.stringify(aiResponse),
      });

      await refineBoardWithAI(currentBoard as GeneratedBoard, 'Thanks', mockConfig, chatHistory);
      expect(generateText).toHaveBeenCalled();
    });
  });

  describe('analyzeLead', () => {
    it('should return suggestion and probability', async () => {
      const mockResponse = {
        suggestion: 'Schedule a demo call',
        probabilityScore: 75,
      };

      mockGenerateText.mockResolvedValue({
        text: JSON.stringify(mockResponse),
      });

      const result = await analyzeLead(mockDeal, mockConfig);
      expect(result.suggestion).toBe('Schedule a demo call');
      expect(result.probabilityScore).toBe(75);
    });

    it('should handle API errors gracefully', async () => {
      mockGenerateText.mockRejectedValue(new Error('API Error'));

      const result = await analyzeLead(mockDeal, mockConfig);
      expect(result.suggestion).toContain('Não foi possível');
      expect(result.probabilityScore).toBe(mockDeal.probability);
    });
  });

  describe('generateEmailDraft', () => {
    it('should return email draft', async () => {
      mockGenerateText.mockResolvedValue({
        text: 'Dear John, I wanted to follow up on our proposal...',
      });

      const result = await generateEmailDraft(mockDealView, mockConfig);
      expect(result).toContain('John');
    });

    it('should handle DealView with contact info', async () => {
      mockGenerateText.mockResolvedValue({
        text: 'Email draft content',
      });

      await generateEmailDraft(mockDealView, mockConfig);
      expect(generateText).toHaveBeenCalled();
    });
  });

  describe('generateObjectionResponse', () => {
    it('should return array of responses', async () => {
      const mockResponses = ['Response 1', 'Response 2', 'Response 3'];

      mockGenerateText.mockResolvedValue({
        text: JSON.stringify(mockResponses),
      });

      const result = await generateObjectionResponse(mockDeal, 'Too expensive', mockConfig);
      expect(result).toHaveLength(3);
    });

    it('should handle API errors', async () => {
      mockGenerateText.mockRejectedValue(new Error('API Error'));

      const result = await generateObjectionResponse(mockDeal, 'objection', mockConfig);
      expect(result[0]).toContain('Não foi possível');
    });
  });

  describe('generateDailyBriefing', () => {
    interface DailyBriefingData {
      birthdays: Array<{ name: string }>;
      stalledDeals: number;
      overdueActivities: number;
      upsellDeals: number;
    }

    it('should return briefing text', async () => {
      mockGenerateText.mockResolvedValue({
        text: 'Good morning! Focus on your stalled deals today.',
      });

      const data: DailyBriefingData = {
        birthdays: [],
        stalledDeals: 2,
        overdueActivities: 1,
        upsellDeals: 0,
      };

      const result = await generateDailyBriefing(data, mockConfig);
      expect(result).toContain('Good morning');
    });

    it('should return fallback on error', async () => {
      mockGenerateText.mockRejectedValue(new Error('API Error'));

      const data: DailyBriefingData = {
        birthdays: [],
        stalledDeals: 0,
        overdueActivities: 0,
        upsellDeals: 0,
      };

      const result = await generateDailyBriefing(data, mockConfig);
      expect(result).toContain('Bom dia');
    });
  });

  describe('generateRescueMessage', () => {
    it('should generate WhatsApp message', async () => {
      mockGenerateText.mockResolvedValue({
        text: 'Oi John! Tudo bem? 👋',
      });

      const result = await generateRescueMessage(mockDealView, 'WHATSAPP', mockConfig);
      expect(result).toBeDefined();
    });

    it('should generate phone script', async () => {
      mockGenerateText.mockResolvedValue({
        text: '- Abertura: Oi...\n- Pergunta: ...',
      });

      const result = await generateRescueMessage(mockDealView, 'PHONE', mockConfig);
      expect(result).toBeDefined();
    });

    it('should generate email break-up', async () => {
      mockGenerateText.mockResolvedValue({
        text: 'Hi, I wanted to check if the project is still active...',
      });

      const result = await generateRescueMessage(mockDealView, 'EMAIL', mockConfig);
      expect(result).toBeDefined();
    });
  });

  describe('chatWithCRM', () => {
    interface ChatContext {
      deals?: Array<{ id: string; title: string; value: number; status: string }>;
      contacts?: Array<{ id: string; name: string; email: string }>;
      companies?: Array<{ id: string; name: string }>;
      activities?: Array<{ id: string; title: string; type: string; date: string }>;
      [key: string]: unknown;
    }

    it('should return chat response', async () => {
      mockGenerateText.mockResolvedValue({
        text: 'You have 5 deals in your pipeline.',
      });

      const context: ChatContext = {
        deals: [
          { id: '1', title: 'Deal 1', value: 1000, status: 'open' },
          { id: '2', title: 'Deal 2', value: 2000, status: 'open' },
          { id: '3', title: 'Deal 3', value: 3000, status: 'open' },
          { id: '4', title: 'Deal 4', value: 4000, status: 'open' },
          { id: '5', title: 'Deal 5', value: 5000, status: 'open' },
        ],
      };
      const result = await chatWithCRM('How many deals do I have?', context, mockConfig);
      expect(result).toContain('deals');
    });

    it('should handle API errors', async () => {
      mockGenerateText.mockRejectedValue(new Error('API Error'));

      const result = await chatWithCRM('question', {}, mockConfig);
      expect(result).toContain('Desculpe');
    });
  });

  describe('generateBirthdayMessage', () => {
    it('should return birthday message', async () => {
      mockGenerateText.mockResolvedValue({
        text: 'Happy Birthday, John! Wishing you all the best!',
      });

      const result = await generateBirthdayMessage('John', 35, mockConfig);
      expect(result).toContain('John');
    });

    it('should work without age', async () => {
      mockGenerateText.mockResolvedValue({
        text: 'Happy Birthday!',
      });

      const result = await generateBirthdayMessage('Jane', undefined, mockConfig);
      expect(result).toBeDefined();
    });

    it('should return fallback on error', async () => {
      mockGenerateText.mockRejectedValue(new Error('API Error'));

      const result = await generateBirthdayMessage('John', undefined, mockConfig);
      expect(result).toContain('Parabéns');
    });
  });

  describe('parseNaturalLanguageAction', () => {
    it('should parse action from text', async () => {
      const mockAction = {
        title: 'Call John',
        type: 'CALL' as const,
        date: '2024-01-20T14:00:00Z',
        contactName: 'John',
        confidence: 0.9,
      };

      mockGenerateText.mockResolvedValue({
        text: JSON.stringify(mockAction),
      });

      const result = await parseNaturalLanguageAction('Call John tomorrow at 2pm', mockConfig);
      expect(result?.type).toBe('CALL');
      expect(result?.contactName).toBe('John');
    });

    it('should return null on error', async () => {
      mockGenerateText.mockRejectedValue(new Error('API Error'));

      const result = await parseNaturalLanguageAction('test', mockConfig);
      expect(result).toBeNull();
    });
  });

  describe('generateBoardStrategy', () => {
    interface BoardData {
      boardName: string;
      description: string;
      stages: Array<{
        name: string;
        description: string;
        color: string;
        linkedLifecycleStage: string;
        [key: string]: unknown;
      }>;
      automationSuggestions: string[];
    }

    it('should generate strategy for board', async () => {
      const boardData: BoardData = {
        boardName: 'Sales Pipeline',
        description: 'Main sales funnel',
        stages: [
          { name: 'New', description: '', color: '', linkedLifecycleStage: '' },
          { name: 'Won', description: '', color: '', linkedLifecycleStage: '' },
        ],
        automationSuggestions: [],
      };

      const mockStrategy = {
        goal: { description: 'Close deals', kpi: 'Win Rate', targetValue: '30%' },
        agentPersona: { name: 'Ana', role: 'SDR', behavior: 'Proactive' },
        entryTrigger: 'New leads from website',
      };

      mockGenerateText.mockResolvedValue({
        text: JSON.stringify(mockStrategy),
      });

      const result = await generateBoardStrategy(boardData, mockConfig);
      expect(result.goal.kpi).toBe('Win Rate');
      expect(result.agentPersona.name).toBe('Ana');
    });

    it('should return default strategy on error', async () => {
      const boardData: BoardData = {
        boardName: 'Test',
        description: 'Test',
        stages: [{ name: 'Stage 1', description: '', color: '', linkedLifecycleStage: '' }],
        automationSuggestions: [],
      };

      mockGenerateText.mockRejectedValue(new Error('API Error'));

      const result = await generateBoardStrategy(boardData, mockConfig);
      expect(result.goal.description).toBe('Definir meta');
    });
  });

  describe('generateBoardFromDescription', () => {
    it('should generate complete board from description', async () => {
      const mockStructure = {
        boardName: 'Customer Onboarding',
        description: 'New customer setup',
        stages: [{ name: 'Setup' }, { name: 'Training' }],
        automationSuggestions: [],
      };

      const mockStrategy = {
        goal: { description: 'Onboard customers', kpi: 'Time to Value', targetValue: '7 days' },
        agentPersona: { name: 'Carlos', role: 'CS Manager', behavior: 'Helpful' },
        entryTrigger: 'New customer closed',
      };

      mockGenerateText
        .mockResolvedValueOnce({ text: JSON.stringify(mockStructure) })
        .mockResolvedValueOnce({ text: JSON.stringify(mockStrategy) });

      const result = await generateBoardFromDescription('customer onboarding', [], mockConfig);
      expect(result.name).toBe('Customer Onboarding');
      expect(result.goal?.kpi).toBe('Time to Value');
      expect(result.confidence).toBe(0.9);
    });
  });

  describe('chatWithBoardAgent', () => {
    interface DealSummary {
      id: string;
      title: string;
      value: number;
      status: string;
      probability?: number;
      contactName?: string;
    }

    interface BoardAgentContext {
      agentName: string;
      agentRole: string;
      agentBehavior: string;
      goalDescription: string;
      goalKPI: string;
      goalTarget: string;
      goalCurrent: string;
      entryTrigger: string;
      dealsSummary: DealSummary[];
    }

    it('should respond as board agent', async () => {
      mockGenerateText.mockResolvedValue({
        text: 'Based on your pipeline, focus on closing Deal X.',
      });

      const context: BoardAgentContext = {
        agentName: 'Ana',
        agentRole: 'Sales Manager',
        agentBehavior: 'Direct and helpful',
        goalDescription: 'Close more deals',
        goalKPI: 'Win Rate',
        goalTarget: '30%',
        goalCurrent: '25%',
        entryTrigger: 'New qualified leads',
        dealsSummary: [{ id: 'deal-1', title: 'Deal X', value: 10000, status: 'open' }],
      };

      const result = await chatWithBoardAgent('What should I focus on?', context, mockConfig);
      expect(result).toContain('Deal X');
    });

    it('should handle API errors', async () => {
      mockGenerateText.mockRejectedValue(new Error('API Error'));

      const context: BoardAgentContext = {
        agentName: 'Ana',
        agentRole: 'Sales Manager',
        agentBehavior: 'Direct',
        goalDescription: 'Close deals',
        goalKPI: 'Win Rate',
        goalTarget: '30%',
        goalCurrent: '25%',
        entryTrigger: 'New leads',
        dealsSummary: [],
      };

      const result = await chatWithBoardAgent('question', context, mockConfig);
      expect(result).toContain('Desculpe');
    });
  });
});
