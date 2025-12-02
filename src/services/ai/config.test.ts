import { describe, it, expect, vi } from 'vitest';
import { getModel, AIProvider } from '@/services/ai/config';

// Mock the AI SDK providers
vi.mock('@ai-sdk/google', () => ({
  createGoogleGenerativeAI: vi.fn(() => {
    const modelFn = vi.fn((modelId: string) => ({ provider: 'google', model: modelId }));
    return modelFn;
  }),
}));

vi.mock('@ai-sdk/openai', () => ({
  createOpenAI: vi.fn(() => {
    const modelFn = vi.fn((modelId: string) => ({ provider: 'openai', model: modelId }));
    return modelFn;
  }),
}));

vi.mock('@ai-sdk/anthropic', () => ({
  createAnthropic: vi.fn(() => {
    const modelFn = vi.fn((modelId: string) => ({ provider: 'anthropic', model: modelId }));
    return modelFn;
  }),
}));

describe('AI Config', () => {
  describe('getModel', () => {
    it('should throw error if API key is missing', () => {
      expect(() => getModel('google', '', 'gemini-1.5-flash')).toThrow('API Key is missing');
    });

    it('should create Google model with provided model ID', () => {
      const result = getModel('google', 'test-api-key', 'gemini-2.5-flash');
      expect(result).toEqual({ provider: 'google', model: 'gemini-2.5-flash' });
    });

    it('should create Google model with default model ID', () => {
      const result = getModel('google', 'test-api-key', '');
      expect(result).toEqual({ provider: 'google', model: 'gemini-1.5-flash' });
    });

    it('should create OpenAI model with provided model ID', () => {
      const result = getModel('openai', 'test-api-key', 'gpt-4-turbo');
      expect(result).toEqual({ provider: 'openai', model: 'gpt-4-turbo' });
    });

    it('should create OpenAI model with default model ID', () => {
      const result = getModel('openai', 'test-api-key', '');
      expect(result).toEqual({ provider: 'openai', model: 'gpt-4o' });
    });

    it('should create Anthropic model with provided model ID', () => {
      const result = getModel('anthropic', 'test-api-key', 'claude-3-opus-20240229');
      expect(result).toEqual({ provider: 'anthropic', model: 'claude-3-opus-20240229' });
    });

    it('should create Anthropic model with default model ID', () => {
      const result = getModel('anthropic', 'test-api-key', '');
      expect(result).toEqual({ provider: 'anthropic', model: 'claude-3-5-sonnet-20240620' });
    });

    it('should throw error for unsupported provider', () => {
      expect(() => getModel('unsupported' as AIProvider, 'test-api-key', 'model')).toThrow(
        'Provider unsupported not supported'
      );
    });
  });
});
