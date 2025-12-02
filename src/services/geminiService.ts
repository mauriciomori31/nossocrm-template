import { generateText, tool } from 'ai';
import { google } from '@ai-sdk/google';
import { anthropic } from '@ai-sdk/anthropic';
import { getModel } from '@/services/ai/config';
import { Deal, DealView, LifecycleStage } from '@/types';

export interface AIConfig {
  provider: 'google' | 'openai' | 'anthropic';
  apiKey: string;
  model: string;
  thinking: boolean;
  search: boolean;
  anthropicCaching: boolean;
}

export const analyzeLead = async (
  deal: Deal | DealView,
  config?: AIConfig
): Promise<{ suggestion: string; probabilityScore: number }> => {
  // Fallback to default if no config (legacy support)
  const provider = config?.provider || 'google';
  const apiKey = config?.apiKey || import.meta.env.VITE_GEMINI_API_KEY || '';
  const modelId = config?.model || 'gemini-2.5-flash';

  if (!apiKey) return { suggestion: 'Erro: API Key não configurada.', probabilityScore: 0 };

  const model = getModel(provider, apiKey, modelId);

  const prompt = `
    Analise esta oportunidade de venda (Deal) e forneça:
    1. Uma sugestão curta e prática do que fazer agora (máx 2 frases).
    2. Uma probabilidade de fechamento (0 a 100) baseada nos dados.

    Retorne APENAS um JSON no formato:
    { "suggestion": "...", "probabilityScore": 50 }

    Dados:
    Título: ${deal.title}
    Valor: ${deal.value}
    Estágio: ${deal.status}
    Probabilidade Atual: ${deal.probability}
    Prioridade: ${deal.priority}
  `;

  try {
    const result = await generateText({
      model,
      prompt,
    });
    const text = result.text;
    const jsonStr = text
      .replace(/```json/g, '')
      .replace(/```/g, '')
      .trim();
    return JSON.parse(jsonStr);
  } catch (error) {
    console.error('Error analyzing lead:', error);
    return { suggestion: 'Não foi possível analisar.', probabilityScore: deal.probability };
  }
};

export const generateEmailDraft = async (
  deal: Deal | DealView,
  config?: AIConfig
): Promise<string> => {
  // Fallback to default if no config (legacy support)
  const provider = config?.provider || 'google';
  const apiKey = config?.apiKey || import.meta.env.VITE_GEMINI_API_KEY || '';
  const modelId = config?.model || 'gemini-2.5-flash';

  if (!apiKey) return 'Erro: API Key não configurada.';

  const model = getModel(provider, apiKey, modelId);

  const prompt = `
    Escreva um rascunho de e-mail curto e persuasivo para este cliente.
    O objetivo é mover o negócio para a próxima fase.
    
    Cliente: ${'contactName' in deal ? deal.contactName : 'Cliente'}
    Empresa: ${'companyName' in deal ? deal.companyName : 'Empresa'}
    Negócio: ${deal.title}
    Estágio Atual: ${deal.status}

    Retorne apenas o corpo do e-mail.
  `;

  try {
    const result = await generateText({
      model,
      prompt,
    });
    return result.text;
  } catch (error) {
    console.error('Error generating email:', error);
    return 'Erro ao gerar e-mail.';
  }
};

export const generateObjectionResponse = async (
  deal: Deal | DealView,
  objection: string,
  config?: AIConfig
): Promise<string[]> => {
  // Fallback to default if no config (legacy support)
  const provider = config?.provider || 'google';
  const apiKey = config?.apiKey || import.meta.env.VITE_GEMINI_API_KEY || '';
  const modelId = config?.model || 'gemini-2.5-flash';

  if (!apiKey) return ['Erro: API Key não configurada.'];

  const model = getModel(provider, apiKey, modelId);

  const prompt = `
    O cliente apresentou a seguinte objeção: "${objection}"
    Contexto do negócio: ${deal.title}, Valor: ${deal.value}.

    Forneça 3 opções de resposta curtas e matadoras para contornar essa objeção.
    Retorne APENAS um JSON array de strings:
    ["Resposta 1...", "Resposta 2...", "Resposta 3..."]
  `;

  try {
    const result = await generateText({
      model,
      prompt,
    });
    const text = result.text;
    const jsonStr = text
      .replace(/```json/g, '')
      .replace(/```/g, '')
      .trim();
    return JSON.parse(jsonStr);
  } catch (error) {
    console.error('Error generating objections:', error);
    return ['Não foi possível gerar respostas.'];
  }
};

export const processAudioNote = async (
  audioBase64: string,
  config?: AIConfig
): Promise<{
  transcription: string;
  sentiment: string;
  nextAction?: { type: string; title: string; date: string };
}> => {
  // Fallback to default if no config (legacy support)
  const provider = config?.provider || 'google';
  const apiKey = config?.apiKey || import.meta.env.VITE_GEMINI_API_KEY || '';
  const modelId = config?.model || 'gemini-2.5-flash';

  if (!apiKey) return { transcription: 'Erro: API Key não configurada.', sentiment: 'Neutro' };

  const model = getModel(provider, apiKey, modelId);

  const prompt = `
    Transcreva este áudio de uma nota de venda.
    Analise o sentimento (Positivo, Neutro, Negativo, Urgente).
    Se houver uma próxima ação clara (ex: "ligar amanhã", "enviar proposta"), extraia-a.

    Retorne JSON:
    {
      "transcription": "...",
      "sentiment": "...",
      "nextAction": { "type": "CALL" | "EMAIL" | "TASK", "title": "...", "date": "ISOString" } (opcional)
    }
  `;

  try {
    const result = await generateText({
      model,
      messages: [
        {
          role: 'user',
          content: [
            { type: 'text', text: prompt },
            { type: 'file', data: audioBase64, mediaType: 'audio/webm' },
          ],
        },
      ],
    });
    const text = result.text;
    const jsonStr = text
      .replace(/```json/g, '')
      .replace(/```/g, '')
      .trim();
    return JSON.parse(jsonStr);
  } catch (error) {
    console.error('Error processing audio:', error);
    return { transcription: 'Erro ao processar áudio.', sentiment: 'Erro' };
  }
};

interface DailyBriefingData {
  birthdays: Array<{ name: string }>;
  stalledDeals: number;
  overdueActivities: number;
  upsellDeals: number;
}

export const generateDailyBriefing = async (
  data: DailyBriefingData,
  config?: AIConfig
): Promise<string> => {
  // Fallback to default if no config (legacy support)
  const provider = config?.provider || 'google';
  const apiKey = config?.apiKey || import.meta.env.VITE_GEMINI_API_KEY || '';
  const modelId = config?.model || 'gemini-2.5-flash';

  if (!apiKey) return 'Erro: API Key não configurada.';

  const model = getModel(provider, apiKey, modelId);

  const prompt = `
    Você é um gerente de vendas sênior analisando o CRM.
    Gere um briefing matinal curto e motivador para o vendedor "Thales".
    
    Dados do dia:
    - Aniversariantes: ${data.birthdays.length}
    - Negócios Estagnados (Risco): ${data.stalledDeals}
    - Atividades Atrasadas: ${data.overdueActivities}
    - Oportunidades de Upsell: ${data.upsellDeals}

    Fale em primeira pessoa ("Eu notei que...", "Sugiro que...").
    Se houver riscos, foque neles. Se estiver tudo limpo, parabenize.
    Máximo 3 frases.
  `;

  try {
    const result = await generateText({
      model,
      prompt,
    });
    return result.text;
  } catch (error) {
    console.error('Error generating briefing:', error);
    return 'Bom dia! Vamos focar em limpar as pendências hoje.';
  }
};

export const generateRescueMessage = async (
  deal: Deal | DealView,
  channel: 'EMAIL' | 'WHATSAPP' | 'PHONE',
  config?: AIConfig
): Promise<string> => {
  // Fallback to default if no config (legacy support)
  const provider = config?.provider || 'google';
  const apiKey = config?.apiKey || import.meta.env.VITE_GEMINI_API_KEY || '';
  const modelId = config?.model || 'gemini-2.5-flash';

  if (!apiKey) return 'Erro: API Key não configurada.';

  const model = getModel(provider, apiKey, modelId);

  let context = `
    Cliente: ${'contactName' in deal ? deal.contactName : 'Cliente'}
    Empresa: ${'companyName' in deal ? deal.companyName : 'Empresa'}
    Negócio: ${deal.title}
    Valor: ${deal.value}
    Estágio: ${deal.status}
    Tempo parado: > 7 dias
    `;

  let prompt = '';

  if (channel === 'WHATSAPP') {
    prompt = `
        ${context}
        Escreva uma mensagem de WhatsApp curta, casual e direta para reativar esse contato.
        Use emojis com moderação. O tom deve ser "preocupado mas leve".
        Ex: "Oi Fulano, tudo bem? Vi que..."
        Retorne APENAS o texto da mensagem.
        `;
  } else if (channel === 'PHONE') {
    prompt = `
        ${context}
        Crie um mini-script de ligação (bullet points) para o vendedor ligar agora.
        O objetivo é descobrir se o projeto ainda está de pé.
        Inclua:
        - Abertura (Quebra-gelo)
        - Pergunta Chave (O motivo da ligação)
        - Fechamento (Próximo passo)
        Retorne em formato de lista simples.
        `;
  } else {
    // EMAIL
    prompt = `
        ${context}
        Escreva um e-mail de "Break-up" (técnica de vendas).
        Seja educado mas firme: pergunte se o projeto foi cancelado para que você possa fechar o arquivo.
        Isso geralmente gera resposta.
        Retorne APENAS o corpo do e-mail.
        `;
  }

  try {
    const result = await generateText({
      model,
      prompt,
    });
    return result.text;
  } catch (error) {
    console.error('Error generating rescue message:', error);
    return 'Erro ao gerar mensagem.';
  }
};

// --- NEW: NATURAL LANGUAGE ACTION PARSING ---

export interface ParsedAction {
  title: string;
  type: 'CALL' | 'MEETING' | 'EMAIL' | 'TASK';
  date?: string; // ISO string
  contactName?: string;
  companyName?: string;
  confidence: number;
}

export const parseNaturalLanguageAction = async (
  text: string,
  config?: AIConfig
): Promise<ParsedAction | null> => {
  // Fallback to default if no config (legacy support)
  const provider = config?.provider || 'google';
  const apiKey = config?.apiKey || import.meta.env.VITE_GEMINI_API_KEY || '';
  const modelId = config?.model || 'gemini-2.5-flash';

  if (!apiKey) {
    console.warn('API Key missing for NLP action parsing');
    return null;
  }

  const model = getModel(provider, apiKey, modelId);

  const now = new Date();
  const prompt = `
    Você é um assistente pessoal inteligente. Analise o seguinte comando de voz/texto e extraia uma ação estruturada.
    
    Comando: "${text}"
    
    Contexto Temporal: Hoje é ${now.toLocaleDateString('pt-BR')} (${now.toLocaleDateString('pt-BR', { weekday: 'long' })}), às ${now.toLocaleTimeString('pt-BR')}.
    
    Instruções:
    1. Identifique a ação principal (Ligar, Reunião, Email, Tarefa).
    2. Extraia a data e hora mencionadas. Se for relativo (ex: "amanhã à tarde"), calcule a data ISO aproximada. Se não houver hora, defina 09:00 para tarefas e 14:00 para reuniões.
    3. Identifique nomes de pessoas (contactName) e empresas (companyName).
    4. Crie um título curto e descritivo.
    
    Retorne JSON.
  `;

  try {
    const result = await generateText({
      model,
      prompt,
    });

    const text = result.text;
    const jsonStr = text
      .replace(/```json/g, '')
      .replace(/```/g, '')
      .trim();
    return JSON.parse(jsonStr);
  } catch (error) {
    console.error('NLP Action Parsing Error:', error);
    return null;
  }
};

interface CRMContext {
  deals?: Array<{ id: string; title: string; value: number; status: string }>;
  contacts?: Array<{ id: string; name: string; email: string }>;
  companies?: Array<{ id: string; name: string }>;
  activities?: Array<{ id: string; title: string; type: string; date: string }>;
  [key: string]: unknown;
}

export const chatWithCRM = async (
  message: string,
  context: CRMContext,
  config?: AIConfig
): Promise<string> => {
  // Fallback to default if no config (legacy support)
  const provider = config?.provider || 'google';
  const apiKey = config?.apiKey || import.meta.env.VITE_GEMINI_API_KEY || '';
  const modelId = config?.model || 'gemini-2.5-flash';

  if (!apiKey) return 'Erro: API Key não configurada.';

  const model = getModel(provider, apiKey, modelId);

  const prompt = `
    Você é um assistente de CRM. O usuário disse: "${message}".
    Contexto atual: ${JSON.stringify(context)}.
    Responda de forma útil e concisa.
  `;

  try {
    const result = await generateText({
      model,
      prompt,
    });
    return result.text;
  } catch (error) {
    console.error('Error in chatWithCRM:', error);
    return 'Desculpe, não consegui processar sua solicitação.';
  }
};

export const generateBirthdayMessage = async (
  contactName: string,
  age?: number,
  config?: AIConfig
): Promise<string> => {
  // Fallback to default if no config (legacy support)
  const provider = config?.provider || 'google';
  const apiKey = config?.apiKey || import.meta.env.VITE_GEMINI_API_KEY || '';
  const modelId = config?.model || 'gemini-2.5-flash';

  if (!apiKey) return 'Erro: API Key não configurada.';

  const model = getModel(provider, apiKey, modelId);

  const prompt = `
    Escreva uma mensagem curta e amigável de feliz aniversário para o cliente ${contactName}.
    ${age ? `Ele está fazendo ${age} anos.` : ''}
    Tom profissional mas caloroso.
    Retorne APENAS o texto da mensagem.
  `;

  try {
    const result = await generateText({
      model,
      prompt,
    });
    return result.text;
  } catch (error) {
    console.error('Error generating birthday message:', error);
    return 'Parabéns pelo seu dia!';
  }
};

export interface GeneratedBoard {
  name: string;
  description: string;
  stages: {
    name: string;
    description: string;
    color: string;
    linkedLifecycleStage: string;
    estimatedDuration?: string;
  }[];
  automationSuggestions: string[];
  goal: {
    description: string;
    kpi: string;
    targetValue: string;
    currentValue?: string;
  };
  agentPersona: {
    name: string;
    role: string;
    behavior: string;
  };
  entryTrigger: string;
  confidence: number;
  boardName?: string; // Optional alias for name, handled in wizard
  linkedLifecycleStage?: string; // Board-level lifecycle stage
}

// --- STEP 1: BOARD STRUCTURE ---
interface BoardStructureResult {
  boardName: string;
  description: string;
  stages: Array<{
    name: string;
    description: string;
    color: string;
    linkedLifecycleStage: string;
    estimatedDuration?: string;
  }>;
  automationSuggestions: string[];
}

export const generateBoardStructure = async (
  description: string,
  lifecycleStages: LifecycleStage[] = [],
  config?: AIConfig
): Promise<BoardStructureResult> => {
  const provider = config?.provider || 'google';
  const apiKey = config?.apiKey || import.meta.env.VITE_GEMINI_API_KEY || '';
  const modelId = config?.model || 'gemini-2.5-flash';

  if (!apiKey) throw new Error('API Key not configured');

  const model = getModel(provider, apiKey, modelId);

  const lifecycleStagesList = lifecycleStages.map(s => `- ${s.name} (ID: ${s.id})`).join('\n');

  const promptStructure = `
    Você é um Arquiteto de Processos.
    O usuário quer um board para: "${description}"

    Defina a ESTRUTURA do board (Fases do Processo).
    
    REGRAS DE LIFECYCLE STAGE (CRÍTICO):
    - Para CADA estágio, defina um 'linkedLifecycleStage' usando APENAS:
    ${lifecycleStagesList}
    - Se vazio, use: LEAD, MQL, PROSPECT, CUSTOMER, OTHER.
    
    REGRAS DE DESIGN:
    - "color": bg-blue-500, bg-yellow-500, bg-purple-500, bg-orange-500, bg-green-500.
    - "name": MÁXIMO 2 PALAVRAS. Ex: "Qualificação", "Fechamento".
    
    Retorne JSON:
    {
      "boardName": "...",
      "description": "...",
      "stages": [ 
        { "name": "...", "description": "...", "color": "...", "linkedLifecycleStage": "...", "estimatedDuration": "..." }
      ],
      "automationSuggestions": [ ... ]
    }
  `;

  try {
    const resultStructure = await generateText({ model, prompt: promptStructure });
    const jsonStr = resultStructure.text
      .replace(/```json/g, '')
      .replace(/```/g, '')
      .trim();
    return JSON.parse(jsonStr);
  } catch (error) {
    console.error('Error generating board structure:', error);
    throw error;
  }
};

interface BoardStrategyResult {
  goal: {
    description: string;
    kpi: string;
    targetValue: string;
  };
  agentPersona: {
    name: string;
    role: string;
    behavior: string;
  };
  entryTrigger: string;
}

// --- STEP 2: STRATEGY (Context-Aware) ---
export const generateBoardStrategy = async (
  boardData: BoardStructureResult,
  config?: AIConfig
): Promise<BoardStrategyResult> => {
  const provider = config?.provider || 'google';
  const apiKey = config?.apiKey || import.meta.env.VITE_GEMINI_API_KEY || '';
  const modelId = config?.model || 'gemini-2.5-flash';

  if (!apiKey) throw new Error('API Key not configured');

  const model = getModel(provider, apiKey, modelId);

  const promptStrategy = `
    Você é um Especialista em Estratégia de Negócios.
    
    Temos este Board desenhado:
    Nome: ${boardData.boardName}
    Descrição: ${boardData.description}
    Estágios: ${JSON.stringify(boardData.stages)}

    Agora, defina a ESTRATÉGIA para operar este board.

    1. META (Goal):
       - KPI: Qual a métrica principal? (Ex: Taxa de Conversão, MRR, Tempo de Resolução)
       - Target: Qual o alvo numérico? (Seja realista, não use 100% a menos que seja garantia).
       - Descrição: Por que essa meta importa?

    2. AGENTE (Persona):
       - Crie um especialista para operar ESTE processo específico.
       - Nome: Sugira um nome humano (Ex: "Ana", "Carlos").
       - Cargo: Ex: "SDR Senior", "Gerente de Onboarding".
       - Comportamento: Descreva COMO ele deve agir em cada fase deste board. Seja detalhado.

    3. GATILHO (Entry Trigger):
       - Quem entra na primeira fase (${boardData.stages[0]?.name})?

    Retorne JSON:
    {
      "goal": { "description": "...", "kpi": "...", "targetValue": "..." },
      "agentPersona": { "name": "...", "role": "...", "behavior": "..." },
      "entryTrigger": "..."
    }
  `;

  try {
    const resultStrategy = await generateText({ model, prompt: promptStrategy });
    const jsonStr = resultStrategy.text
      .replace(/```json/g, '')
      .replace(/```/g, '')
      .trim();
    return JSON.parse(jsonStr);
  } catch (error) {
    console.error('Error generating strategy:', error);
    // Return default strategy if step 2 fails
    return {
      goal: { description: 'Definir meta', kpi: 'N/A', targetValue: '0' },
      agentPersona: { name: 'Assistente', role: 'Operador', behavior: 'Ajudar no processo.' },
      entryTrigger: 'Novos itens',
    };
  }
};

export const generateBoardFromDescription = async (
  description: string,
  lifecycleStages: LifecycleStage[] = [],
  config?: AIConfig
): Promise<GeneratedBoard> => {
  // Step 1: Structure
  const boardData = await generateBoardStructure(description, lifecycleStages, config);

  // Step 2: Strategy
  const strategyData = await generateBoardStrategy(boardData, config);

  // Merge Results
  const finalBoard: GeneratedBoard = {
    ...boardData,
    ...strategyData,
    confidence: 0.9,
    name: boardData.boardName,
  };

  // Normalize is no longer needed since we explicitly set name
  // if (finalBoard.boardName && !finalBoard.name) finalBoard.name = finalBoard.boardName;

  return finalBoard;
};

export const refineBoardWithAI = async (
  currentBoard: GeneratedBoard,
  userInstruction: string,
  config?: AIConfig,
  chatHistory?: { role: 'user' | 'ai'; content: string }[]
): Promise<{ message: string; board: GeneratedBoard | null }> => {
  // Fallback to default if no config (legacy support)
  const provider = config?.provider || 'google';
  const apiKey = config?.apiKey || import.meta.env.VITE_GEMINI_API_KEY || '';
  const modelId = config?.model || 'gemini-2.5-flash';

  if (!apiKey) throw new Error('API Key not configured');

  const model = getModel(provider, apiKey, modelId);

  // Format chat history for context
  const historyContext = chatHistory
    ? chatHistory
        .map(msg => `${msg.role === 'user' ? 'Usuário' : 'Assistente'}: ${msg.content}`)
        .join('\n')
    : '';

  const prompt = `
    Você é um assistente de configuração de CRM.
    O usuário quer ajustar um board existente.

    Board Atual: ${JSON.stringify(currentBoard)}
    
    Histórico da Conversa:
    ${historyContext}

    Instrução Atual do Usuário: "${userInstruction}"

    Se a instrução do usuário for apenas uma conversa (ex: "olá", "qual meu nome", "obrigado") ou uma pergunta que NÃO requer alteração no board, retorne "board": null.

    Se a instrução requerer alteração no board, faça as alterações no JSON.
    Se o usuário pedir para mudar etapas, lembre-se de manter ou ajustar os 'linkedLifecycleStage' corretamente.
    
    REGRAS DE ESTRATÉGIA (CRÍTICO):
    - Você DEVE manter ou atualizar os campos: "goal", "agentPersona" e "entryTrigger".
    - Se a mudança no board afetar a estratégia (ex: mudou de Vendas para Suporte), ATUALIZE a estratégia (Meta, Agente, Gatilho) para combinar.
    - Se a mudança for apenas visual ou menor, MANTENHA os dados de estratégia existentes.
    - NUNCA remova esses campos do JSON.

    REGRAS DE DESIGN (IMPORTANTE):
    - Mantenha ou atribua cores ("color") para TODAS as etapas.
    - Use classes Tailwind de background: bg-blue-500, bg-yellow-500, bg-purple-500, bg-orange-500, bg-green-500, bg-teal-500, bg-indigo-500, bg-pink-500.
    - Tente seguir uma lógica de "esfriar" ou "esquentar" ou simplesmente diferenciar visualmente.
    
    IMPORTANTE:
    1. Se precisar buscar informações externas (ex: "como funciona funil de vendas para X"), USE A BUSCA (se disponível) antes de responder.
    2. CERTIFIQUE-SE de que o JSON retornado reflete EXATAMENTE as alterações que você descreveu na mensagem.
    3. Retorne APENAS um JSON válido com o seguinte formato, sem markdown:
    {
      "message": "Explicação curta do que foi feito ou resposta à pergunta",
      "board": { ...estrutura completa do board atualizada... } ou null
    }
    `;

  let tools: Record<string, unknown> | undefined = undefined;
  if (config?.search) {
    if (provider === 'google') {
      tools = { googleSearch: google.tools.googleSearch({}) };
    } else if (provider === 'anthropic') {
      tools = { web_search: anthropic.tools.webSearch_20250305({}) };
    }
  }

  interface GoogleProviderOptions {
    google?: {
      thinkingConfig?: {
        thinkingLevel?: 'high';
        thinkingBudget?: number;
        includeThoughts?: boolean;
      };
      useSearchGrounding?: boolean;
    };
  }

  let providerOptions: GoogleProviderOptions = {};

  // Google Provider Options
  if (provider === 'google') {
    providerOptions.google = {};

    // Thinking Config
    if (config?.thinking) {
      if (modelId.includes('gemini-3')) {
        providerOptions.google.thinkingConfig = { thinkingLevel: 'high', includeThoughts: true };
      } else {
        providerOptions.google.thinkingConfig = { thinkingBudget: 8192, includeThoughts: true };
      }
    }

    // Search Grounding Config
    if (config?.search) {
      providerOptions.google.useSearchGrounding = true;
    }
  }

  try {
    const result = await generateText({
      model,
      prompt,
      tools: tools as Parameters<typeof generateText>[0]['tools'],
      providerOptions: providerOptions as Parameters<typeof generateText>[0]['providerOptions'],
    });

    const text = result.text;
    // Extract JSON using regex to handle potential markdown or trailing text
    const jsonMatch = text.match(/\{[\s\S]*\}/);
    const jsonStr = jsonMatch
      ? jsonMatch[0]
      : text
          .replace(/```json/g, '')
          .replace(/```/g, '')
          .trim();
    const parsed = JSON.parse(jsonStr);

    // SAFETY MERGE: If AI returns a board but misses strategy fields, merge from currentBoard
    if (parsed.board) {
      parsed.board = {
        ...currentBoard, // Base on current to keep existing fields
        ...parsed.board, // Overwrite with AI changes
        // Ensure strategy fields exist (prioritize AI's if present, else keep current)
        goal: parsed.board.goal || currentBoard.goal,
        agentPersona: parsed.board.agentPersona || currentBoard.agentPersona,
        entryTrigger: parsed.board.entryTrigger || currentBoard.entryTrigger,
      };
    }

    return parsed;
  } catch (error) {
    console.error('Error refining board:', error);
    throw error;
  }
};

interface DealSummary {
  id: string;
  title: string;
  value: number;
  status: string;
  probability?: number;
  contactName?: string;
}

export const chatWithBoardAgent = async (
  message: string,
  boardContext: {
    agentName: string;
    agentRole: string;
    agentBehavior: string;
    goalDescription: string;
    goalKPI: string;
    goalTarget: string;
    goalCurrent: string;
    entryTrigger: string;
    dealsSummary: DealSummary[];
  },
  config?: AIConfig
): Promise<string> => {
  // Fallback to default if no config (legacy support)
  const provider = config?.provider || 'google';
  const apiKey = config?.apiKey || import.meta.env.VITE_GEMINI_API_KEY || '';
  const modelId = config?.model || 'gemini-2.5-flash';

  if (!apiKey) return 'Erro: API Key não configurada.';

  const model = getModel(provider, apiKey, modelId);

  const prompt = `
    Você é ${boardContext.agentName}, atuando como ${boardContext.agentRole}.
    
    SUA PERSONA:
    ${boardContext.agentBehavior}
    
    SEU OBJETIVO NO BOARD:
    ${boardContext.goalDescription}
    KPI Principal: ${boardContext.goalKPI}
    Meta: ${boardContext.goalTarget}
    Atual: ${boardContext.goalCurrent}

    CRITÉRIOS DE ENTRADA (QUEM DEVE ESTAR AQUI):
    ${boardContext.entryTrigger}

    CONTEXTO DOS NEGÓCIOS (Resumo):
    ${JSON.stringify(boardContext.dealsSummary, null, 2)}

    O USUÁRIO DISSE:
    "${message}"

    INSTRUÇÕES DE ESTILO:
    1. SEJA DIRETO E OBJETIVO. Evite "blablabla" corporativo.
    2. NÃO se apresente novamente (o usuário já sabe quem você é).
    3. NÃO repita a meta inteira a cada mensagem, apenas se for relevante para o contexto.
    4. Fale como um parceiro de trabalho, não como um robô ou um texto de marketing.
    5. Máximo de 2 parágrafos curtos, a menos que seja uma lista.

    INSTRUÇÕES DE CONTEÚDO:
    1. Responda à pergunta do usuário usando os dados dos negócios.
    2. Se o usuário perguntar "qual a boa?", destaque 1 ou 2 negócios que precisam de atenção imediata para bater a meta.
    3. Cite os negócios pelo nome.
  `;

  try {
    const result = await generateText({
      model,
      prompt,
    });
    return result.text;
  } catch (error) {
    console.error('Error in chatWithBoardAgent:', error);
    return 'Desculpe, estou tendo dificuldades para acessar os dados do board agora.';
  }
};
