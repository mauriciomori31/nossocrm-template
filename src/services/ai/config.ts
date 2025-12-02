import { createGoogleGenerativeAI } from '@ai-sdk/google';
import { createOpenAI } from '@ai-sdk/openai';
import { createAnthropic } from '@ai-sdk/anthropic';

export type AIProvider = 'google' | 'openai' | 'anthropic';

export const getModel = (provider: AIProvider, apiKey: string, modelId: string) => {
    if (!apiKey) {
        throw new Error('API Key is missing');
    }

    switch (provider) {
        case 'google':
            const google = createGoogleGenerativeAI({ apiKey });
            return google(modelId || 'gemini-1.5-flash');

        case 'openai':
            const openai = createOpenAI({ apiKey });
            return openai(modelId || 'gpt-4o');

        case 'anthropic':
            const anthropic = createAnthropic({ apiKey });
            return anthropic(modelId || 'claude-3-5-sonnet-20240620');

        default:
            throw new Error(`Provider ${provider} not supported`);
    }
};
