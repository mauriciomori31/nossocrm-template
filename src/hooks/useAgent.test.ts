import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { renderHook, act, waitFor } from '@testing-library/react';
import { useAgent, Message, Attachment } from '@/hooks/useAgent';
import React from 'react';

// Mock the AI SDK
vi.mock('ai', () => ({
  streamText: vi.fn(),
}));

vi.mock('@ai-sdk/google', () => ({
  google: {
    tools: {
      googleSearch: vi.fn(() => ({})),
    },
  },
}));

vi.mock('@ai-sdk/anthropic', () => ({
  anthropic: {
    tools: {
      webSearch_20250305: vi.fn(() => ({})),
    },
  },
}));

vi.mock('@/services/ai/config', () => ({
  getModel: vi.fn(() => 'mock-model'),
}));

// Mock CRM Context
const mockCRMContext = {
  aiProvider: 'google' as const,
  aiApiKey: 'test-api-key',
  aiModel: 'gemini-2.5-flash',
  aiThinking: false,
  aiSearch: false,
  aiAnthropicCaching: false,
};

vi.mock('@/context/CRMContext', () => ({
  useCRM: () => mockCRMContext,
}));

// Mock localStorage
const localStorageMock = (() => {
  let store: Record<string, string> = {};
  return {
    getItem: vi.fn((key: string) => store[key] || null),
    setItem: vi.fn((key: string, value: string) => {
      store[key] = value;
    }),
    removeItem: vi.fn((key: string) => {
      delete store[key];
    }),
    clear: vi.fn(() => {
      store = {};
    }),
  };
})();

Object.defineProperty(window, 'localStorage', { value: localStorageMock });

describe('useAgent', () => {
  beforeEach(() => {
    localStorageMock.clear();
    vi.clearAllMocks();
  });

  describe('Initialization', () => {
    it('should initialize with empty messages by default', () => {
      const { result } = renderHook(() => useAgent());

      expect(result.current.messages).toEqual([]);
      expect(result.current.input).toBe('');
      expect(result.current.isLoading).toBe(false);
      expect(result.current.error).toBeNull();
    });

    it('should initialize with provided initial messages', () => {
      const initialMessages: Message[] = [{ id: '1', role: 'assistant', content: 'Hello!' }];

      const { result } = renderHook(() => useAgent({ initialMessages }));

      expect(result.current.messages).toEqual(initialMessages);
    });

    it('should load messages from localStorage when id is provided', () => {
      const savedMessages: Message[] = [
        { id: '1', role: 'user', content: 'Hi' },
        { id: '2', role: 'assistant', content: 'Hello!' },
      ];

      localStorageMock.setItem('chat_history_test-id', JSON.stringify(savedMessages));

      const { result } = renderHook(() => useAgent({ id: 'test-id' }));

      expect(result.current.messages).toEqual(savedMessages);
    });

    it('should fallback to initialMessages if localStorage is invalid', () => {
      localStorageMock.setItem('chat_history_test-id', 'invalid-json');

      const { result } = renderHook(() => useAgent({ id: 'test-id' }));

      expect(result.current.messages).toEqual([]);
    });
  });

  describe('Input management', () => {
    it('should update input with setInput', () => {
      const { result } = renderHook(() => useAgent());

      act(() => {
        result.current.setInput('Hello world');
      });

      expect(result.current.input).toBe('Hello world');
    });
  });

  describe('Message management', () => {
    it('should allow manual message reset with setMessages', () => {
      const { result } = renderHook(() => useAgent());

      const newMessages: Message[] = [
        { id: 'new-1', role: 'assistant', content: 'New conversation' },
      ];

      act(() => {
        result.current.setMessages(newMessages);
      });

      expect(result.current.messages).toEqual(newMessages);
    });
  });

  describe('Persistence', () => {
    it('should save messages to localStorage when id is provided', async () => {
      const { result } = renderHook(() => useAgent({ id: 'persist-test' }));

      const newMessages: Message[] = [{ id: '1', role: 'user', content: 'Test message' }];

      act(() => {
        result.current.setMessages(newMessages);
      });

      await waitFor(() => {
        expect(localStorageMock.setItem).toHaveBeenCalledWith(
          'chat_history_persist-test',
          JSON.stringify(newMessages)
        );
      });
    });

    it('should not save to localStorage when no id is provided', () => {
      const { result } = renderHook(() => useAgent());

      act(() => {
        result.current.setMessages([{ id: '1', role: 'user', content: 'Test' }]);
      });

      // Should only be called for initial load, not for saving
      expect(localStorageMock.setItem).not.toHaveBeenCalled();
    });
  });

  describe('append function', () => {
    it('should set error if no API key is configured', async () => {
      // Override mock to return empty API key
      vi.mocked(mockCRMContext).aiApiKey = '';

      const { result } = renderHook(() => useAgent());

      await act(async () => {
        await result.current.append('Hello');
      });

      expect(result.current.error).toBeDefined();
      expect(result.current.error?.message).toContain('API Key');

      // Reset mock
      vi.mocked(mockCRMContext).aiApiKey = 'test-api-key';
    });

    it('should add user message optimistically', async () => {
      const { streamText } = await import('ai');
      vi.mocked(streamText).mockResolvedValue({
        textStream: (async function* () {
          yield 'Hello';
          yield ' there!';
        })(),
      } as unknown as ReturnType<typeof streamText>);

      const { result } = renderHook(() => useAgent());

      await act(async () => {
        await result.current.append('Test message');
      });

      // User message should be added
      expect(
        result.current.messages.some(m => m.role === 'user' && m.content === 'Test message')
      ).toBe(true);
    });

    it('should clear input after append', async () => {
      const { streamText } = await import('ai');
      vi.mocked(streamText).mockResolvedValue({
        textStream: (async function* () {
          yield 'Response';
        })(),
      } as unknown as ReturnType<typeof streamText>);

      const { result } = renderHook(() => useAgent());

      act(() => {
        result.current.setInput('Hello');
      });

      await act(async () => {
        await result.current.append('Hello');
      });

      expect(result.current.input).toBe('');
    });
  });

  describe('handleSubmit', () => {
    it('should not submit if input is empty', async () => {
      const { result } = renderHook(() => useAgent());

      await act(async () => {
        await result.current.handleSubmit();
      });

      expect(result.current.messages).toEqual([]);
    });

    it('should not submit if input is only whitespace', async () => {
      const { result } = renderHook(() => useAgent());

      act(() => {
        result.current.setInput('   ');
      });

      await act(async () => {
        await result.current.handleSubmit();
      });

      // Should remain at 0 messages (no user message added)
      expect(result.current.messages).toEqual([]);
    });
  });

  describe('Attachment handling', () => {
    it('should accept attachments with append', async () => {
      const { streamText } = await import('ai');
      vi.mocked(streamText).mockResolvedValue({
        textStream: (async function* () {
          yield 'I see the image';
        })(),
      } as unknown as ReturnType<typeof streamText>);

      const { result } = renderHook(() => useAgent());

      const attachment: Attachment = {
        id: 'att-1',
        type: 'image',
        url: 'data:image/png;base64,abc123',
        name: 'test.png',
        mimeType: 'image/png',
      };

      await act(async () => {
        await result.current.append('What is this?', [attachment]);
      });

      // User message should include the attachment
      const userMessage = result.current.messages.find(m => m.role === 'user');
      expect(userMessage?.attachments).toEqual([attachment]);
    });
  });

  describe('Return value structure', () => {
    it('should return all expected properties', () => {
      const { result } = renderHook(() => useAgent());

      expect(result.current).toHaveProperty('messages');
      expect(result.current).toHaveProperty('input');
      expect(result.current).toHaveProperty('setInput');
      expect(result.current).toHaveProperty('append');
      expect(result.current).toHaveProperty('handleSubmit');
      expect(result.current).toHaveProperty('isLoading');
      expect(result.current).toHaveProperty('error');
      expect(result.current).toHaveProperty('setMessages');
    });

    it('should have correct types for functions', () => {
      const { result } = renderHook(() => useAgent());

      expect(typeof result.current.setInput).toBe('function');
      expect(typeof result.current.append).toBe('function');
      expect(typeof result.current.handleSubmit).toBe('function');
      expect(typeof result.current.setMessages).toBe('function');
    });
  });
});
