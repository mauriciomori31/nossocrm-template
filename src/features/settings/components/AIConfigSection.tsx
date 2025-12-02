import React from 'react';
import { useCRM } from '@/context/CRMContext';
import { Bot, Key, Cpu, CheckCircle, AlertCircle } from 'lucide-react';

export const AIConfigSection: React.FC = () => {
    const {
        aiProvider, setAiProvider,
        aiApiKey, setAiApiKey,
        aiModel, setAiModel,
        aiThinking, setAiThinking,
        aiSearch, setAiSearch,
        aiAnthropicCaching, setAiAnthropicCaching
    } = useCRM();

    const providers = [
        {
            id: 'google',
            name: 'Google Gemini',
            models: [
                { id: 'gemini-2.5-flash', name: 'Gemini 2.5 Flash', description: 'Recomendado - Best value', price: '$0.15 / $0.60' },
                { id: 'gemini-2.5-flash-lite', name: 'Gemini 2.5 Flash Lite', description: 'Ultra fast', price: '$0.05 / $0.20' },
                { id: 'gemini-2.5-pro', name: 'Gemini 2.5 Pro', description: 'Thinking model', price: '$2.50 / $10' },
                { id: 'gemini-3-pro-preview', name: 'Gemini 3.0 Pro', description: 'Most intelligent', price: '$7 / $21' },
            ]
        },
        {
            id: 'anthropic',
            name: 'Anthropic Claude',
            models: [
                { id: 'claude-sonnet-4-5', name: 'Claude Sonnet 4.5', description: 'Recomendado - Best balance', price: '$3 / $15' },
                { id: 'claude-haiku-4-5', name: 'Claude Haiku 4.5', description: 'Fastest', price: '$1 / $5' },
                { id: 'claude-opus-4-5', name: 'Claude Opus 4.5', description: 'Premium intelligence', price: '$5 / $25' },
            ]
        },
        {
            id: 'openai',
            name: 'OpenAI',
            models: [
                { id: 'gpt-4o', name: 'GPT-4o', description: 'Flagship model', price: '$5 / $15' },
                { id: 'gpt-4-turbo', name: 'GPT-4 Turbo', description: 'High intelligence', price: '$10 / $30' },
                { id: 'gpt-3.5-turbo', name: 'GPT-3.5 Turbo', description: 'Fast & cheap', price: '$0.50 / $1.50' },
            ]
        },
    ];

    const currentProvider = providers.find(p => p.id === aiProvider);

    const handleProviderChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
        const newProviderId = e.target.value as 'google' | 'openai' | 'anthropic';
        setAiProvider(newProviderId);

        // Auto-set recommended model (first one in list usually, or one marked recommended)
        const providerData = providers.find(p => p.id === newProviderId);
        if (providerData && providerData.models.length > 0) {
            // Prefer models with "Recomendado" in description, else first one
            const recommended = providerData.models.find(m => m.description.includes('Recomendado')) || providerData.models[0];
            setAiModel(recommended.id);
        }
    };

    return (
        <div id="ai-config" className="mt-8 border-t border-slate-200 dark:border-white/10 pt-8 scroll-mt-8">
            <div className="flex items-center gap-3 mb-6">
                <div className="p-2 bg-purple-100 dark:bg-purple-900/20 rounded-lg text-purple-600 dark:text-purple-400">
                    <Bot size={24} />
                </div>
                <div>
                    <h2 className="text-xl font-bold text-slate-900 dark:text-white font-display">Inteligência Artificial</h2>
                    <p className="text-sm text-slate-500 dark:text-slate-400">Configure qual cérebro vai alimentar seu CRM.</p>
                </div>
            </div>

            <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-white/5 rounded-xl p-6 shadow-sm space-y-6">

                {/* Provider Selection */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <div className="space-y-2">
                        <label className="text-sm font-medium text-slate-700 dark:text-slate-300 flex items-center gap-2">
                            <Cpu size={14} /> Provedor de IA
                        </label>
                        <div className="relative">
                            <select
                                value={aiProvider}
                                onChange={handleProviderChange}
                                className="w-full appearance-none bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-white/10 rounded-lg px-4 py-2.5 text-sm text-slate-900 dark:text-white focus:ring-2 focus:ring-purple-500/20 focus:border-purple-500 outline-none transition-all"
                            >
                                {providers.map(p => (
                                    <option key={p.id} value={p.id}>{p.name}</option>
                                ))}
                            </select>
                            <div className="absolute right-3 top-1/2 -translate-y-1/2 pointer-events-none text-slate-400">
                                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 9l-7 7-7-7"></path></svg>
                            </div>
                        </div>
                    </div>

                    {/* Model Selection */}
                    <div className="space-y-2">
                        <label className="text-sm font-medium text-slate-700 dark:text-slate-300 flex items-center gap-2">
                            <Bot size={14} /> Modelo
                        </label>
                        <div className="relative">
                            <select
                                value={providers.some(p => p.models.some(m => m.id === aiModel)) ? aiModel : 'custom'}
                                onChange={(e) => {
                                    if (e.target.value === 'custom') {
                                        setAiModel('');
                                    } else {
                                        setAiModel(e.target.value);
                                    }
                                }}
                                className="w-full appearance-none bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-white/10 rounded-lg px-4 py-2.5 text-sm text-slate-900 dark:text-white focus:ring-2 focus:ring-purple-500/20 focus:border-purple-500 outline-none transition-all"
                            >
                                {currentProvider?.models.map(m => (
                                    <option key={m.id} value={m.id}>
                                        {m.name} - {m.description} ({m.price})
                                    </option>
                                ))}
                                <option value="custom">Outro (Digitar ID)</option>
                            </select>
                            <div className="absolute right-3 top-1/2 -translate-y-1/2 pointer-events-none text-slate-400">
                                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 9l-7 7-7-7"></path></svg>
                            </div>
                        </div>

                        {(!currentProvider?.models.some(m => m.id === aiModel) || aiModel === '') && (
                            <div className="mt-2 animate-in fade-in slide-in-from-top-2">
                                <input
                                    type="text"
                                    value={aiModel}
                                    onChange={(e) => setAiModel(e.target.value)}
                                    placeholder="Digite o ID do modelo (ex: gemini-1.5-pro-latest)"
                                    className="w-full bg-white dark:bg-slate-900 border border-slate-200 dark:border-white/10 rounded-lg px-4 py-2.5 text-sm text-slate-900 dark:text-white focus:ring-2 focus:ring-purple-500/20 focus:border-purple-500 outline-none transition-all"
                                />
                                <p className="text-xs text-slate-500 mt-1">
                                    Consulte a documentação do provedor para obter o ID correto.
                                </p>
                            </div>
                        )}
                    </div>
                </div>

                {/* Google Thinking Config */}
                {aiProvider === 'google' && (
                    <div className="bg-blue-50 dark:bg-blue-900/10 border border-blue-100 dark:border-blue-500/20 rounded-lg p-4 animate-in fade-in slide-in-from-top-2">
                        <div className="flex items-center justify-between">
                            <div>
                                <h4 className="font-medium text-blue-900 dark:text-blue-100 flex items-center gap-2">
                                    <span className="text-lg">🧠</span> Modo Pensamento (Thinking)
                                </h4>
                                <p className="text-sm text-blue-700 dark:text-blue-300 mt-1">
                                    Permite que o modelo "pense" antes de responder, melhorando o raciocínio.
                                </p>
                            </div>
                            <label className="relative inline-flex items-center cursor-pointer">
                                <input
                                    type="checkbox"
                                    checked={aiThinking}
                                    onChange={(e) => setAiThinking(e.target.checked)}
                                    className="sr-only peer"
                                />
                                <div className="w-11 h-6 bg-slate-200 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-blue-300 dark:peer-focus:ring-blue-800 rounded-full peer dark:bg-slate-700 peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all dark:border-gray-600 peer-checked:bg-blue-600"></div>
                            </label>
                        </div>
                    </div>
                )}

                {/* Anthropic Prompt Caching Config */}
                {aiProvider === 'anthropic' && (
                    <div className="bg-orange-50 dark:bg-orange-900/10 border border-orange-100 dark:border-orange-500/20 rounded-lg p-4 animate-in fade-in slide-in-from-top-2">
                        <div className="flex items-center justify-between">
                            <div>
                                <h4 className="font-medium text-orange-900 dark:text-orange-100 flex items-center gap-2">
                                    <span className="text-lg">⚡</span> Prompt Caching
                                </h4>
                                <p className="text-sm text-orange-700 dark:text-orange-300 mt-1">
                                    Cacheia o contexto para economizar tokens e acelerar respostas (ideal para conversas longas).
                                </p>
                            </div>
                            <label className="relative inline-flex items-center cursor-pointer">
                                <input
                                    type="checkbox"
                                    checked={aiAnthropicCaching}
                                    onChange={(e) => setAiAnthropicCaching(e.target.checked)}
                                    className="sr-only peer"
                                />
                                <div className="w-11 h-6 bg-slate-200 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-orange-300 dark:peer-focus:ring-orange-800 rounded-full peer dark:bg-slate-700 peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all dark:border-gray-600 peer-checked:bg-orange-600"></div>
                            </label>
                        </div>
                    </div>
                )}

                {/* Search Config (Google & Anthropic) */}
                {(aiProvider === 'google' || aiProvider === 'anthropic') && (
                    <div className="bg-green-50 dark:bg-green-900/10 border border-green-100 dark:border-green-500/20 rounded-lg p-4 animate-in fade-in slide-in-from-top-2">
                        <div className="flex items-center justify-between">
                            <div>
                                <h4 className="font-medium text-green-900 dark:text-green-100 flex items-center gap-2">
                                    <span className="text-lg">🌍</span> {aiProvider === 'google' ? 'Google Search Grounding' : 'Web Search'}
                                </h4>
                                <p className="text-sm text-green-700 dark:text-green-300 mt-1">
                                    Conecta o modelo à internet para buscar informações atualizadas.
                                </p>
                            </div>
                            <label className="relative inline-flex items-center cursor-pointer">
                                <input
                                    type="checkbox"
                                    checked={aiSearch}
                                    onChange={(e) => setAiSearch(e.target.checked)}
                                    className="sr-only peer"
                                />
                                <div className="w-11 h-6 bg-slate-200 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-green-300 dark:peer-focus:ring-green-800 rounded-full peer dark:bg-slate-700 peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all dark:border-gray-600 peer-checked:bg-green-600"></div>
                            </label>
                        </div>
                    </div>
                )}

                {/* API Key */}
                <div className="space-y-2">
                    <label className="text-sm font-medium text-slate-700 dark:text-slate-300 flex items-center gap-2">
                        <Key size={14} /> Chave de API ({providers.find(p => p.id === aiProvider)?.name})
                    </label>
                    <div className="relative">
                        <input
                            type="password"
                            value={aiApiKey}
                            onChange={(e) => setAiApiKey(e.target.value)}
                            placeholder={`Cole sua chave ${aiProvider === 'google' ? 'AIza...' : 'sk-...'}`}
                            className="w-full bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-white/10 rounded-lg px-4 py-2.5 text-sm text-slate-900 dark:text-white focus:ring-2 focus:ring-purple-500/20 focus:border-purple-500 outline-none transition-all font-mono"
                        />
                        <div className="absolute right-3 top-1/2 -translate-y-1/2">
                            {aiApiKey ? (
                                <CheckCircle size={16} className="text-green-500" />
                            ) : (
                                <AlertCircle size={16} className="text-amber-500" />
                            )}
                        </div>
                    </div>
                    <p className="text-xs text-slate-500 dark:text-slate-400">
                        Sua chave é salva apenas no navegador (LocalStorage). Nunca compartilhamos com ninguém.
                    </p>
                </div>

                {/* Status Banner */}
                <div className={`rounded-lg p-4 flex items-start gap-3 ${aiApiKey ? 'bg-green-50 dark:bg-green-900/10 text-green-800 dark:text-green-200' : 'bg-amber-50 dark:bg-amber-900/10 text-amber-800 dark:text-amber-200'}`}>
                    {aiApiKey ? <CheckCircle className="shrink-0 mt-0.5" size={18} /> : <AlertCircle className="shrink-0 mt-0.5" size={18} />}
                    <div className="text-sm">
                        <p className="font-semibold">{aiApiKey ? 'Pronto para uso' : 'Configuração Pendente'}</p>
                        <p className="opacity-90 mt-1">
                            {aiApiKey
                                ? `O sistema está configurado para usar o ${providers.find(p => p.id === aiProvider)?.name} (${aiModel}).`
                                : 'Você precisa inserir uma chave de API válida para usar o assistente.'}
                        </p>
                    </div>
                </div>

            </div>
        </div>
    );
};
