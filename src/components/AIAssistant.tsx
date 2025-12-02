import React, { useState, useRef, useEffect, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  X,
  Send,
  Bot,
  ChevronDown,
  Paperclip,
  Mic,
  Image as ImageIcon,
  Trash2,
  StopCircle,
  Settings,
  Sparkles,
} from 'lucide-react';
import { useCRM } from '../context/CRMContext';
import { Board } from '@/types';
import { useAgent, Message, Attachment } from '@/hooks/useAgent';
import AudioPlayer from '@/components/ui/AudioPlayer';

interface AIAssistantProps {
  isOpen: boolean;
  onClose: () => void;
  variant?: 'overlay' | 'sidebar';
  activeBoard?: Board | null;
}

type AgentMode = 'global' | 'board';

const AIAssistant: React.FC<AIAssistantProps> = ({
  isOpen,
  onClose,
  variant = 'overlay',
  activeBoard,
}) => {
  const navigate = useNavigate();
  const { deals, contacts, boards, aiApiKey } = useCRM();
  const [mode, setMode] = useState<AgentMode>('global');
  const hasApiKey = Boolean(aiApiKey && aiApiKey.trim());
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Attachments State
  const [attachments, setAttachments] = useState<Attachment[]>([]);
  const [isRecording, setIsRecording] = useState(false);
  const mediaRecorderRef = useRef<MediaRecorder | null>(null);
  const audioChunksRef = useRef<Blob[]>([]);

  // Determine active agent details
  const activeAgentName =
    mode === 'board' && activeBoard
      ? activeBoard.agentPersona?.name || 'Agente do Board'
      : 'Flow AI';
  const activeAgentRole =
    mode === 'board' && activeBoard
      ? activeBoard.agentPersona?.role || 'Especialista'
      : 'Assistente Global';

  // Construct System Prompt based on Mode
  const systemPrompt = useMemo(() => {
    if (mode === 'board' && activeBoard) {
      const boardDeals = deals.filter(d => d.boardId === activeBoard.id);
      const dealsSummary = boardDeals
        .map(d => `- ${d.title}: $${d.value} (${d.status})`)
        .join('\n');

      // Find connections
      const currentBoardIndex = boards.findIndex(b => b.id === activeBoard.id);
      const prevBoard = currentBoardIndex > 0 ? boards[currentBoardIndex - 1] : null;
      const nextBoard =
        currentBoardIndex < boards.length - 1 ? boards[currentBoardIndex + 1] : null;

      return `
        Você é ${activeBoard.agentPersona?.name || 'o Agente'}, ${activeBoard.agentPersona?.role || 'Especialista'}.
        Seu comportamento deve ser: ${activeBoard.agentPersona?.behavior || 'Profissional'}.
        
        CONTEXTO DO BOARD:
        - Nome: ${activeBoard.name}
        - Meta: ${activeBoard.goal?.kpi || 'Vendas'} (Alvo: ${activeBoard.goal?.targetValue}, Atual: ${activeBoard.goal?.currentValue})
        - Descrição da Meta: ${activeBoard.goal?.description}
        
        CONEXÕES (FLUXO):
        - Board Anterior (Origem): ${prevBoard ? prevBoard.name : 'Nenhum (Início do Funil)'}
        - Próximo Board (Destino): ${nextBoard ? nextBoard.name : 'Nenhum (Fim do Funil)'}

        CRITÉRIOS DE ENTRADA (GATILHO):
        ${activeBoard.entryTrigger || 'Não definido. Use seu julgamento.'}
        
        NEGÓCIOS NESTE BOARD:
        ${dealsSummary}
        
        Responda de forma concisa e focada em ajudar a atingir a meta.
      `;
    } else {
      return `
        Você é o Flow AI, o assistente central deste CRM.
        
        DADOS GERAIS:
        - Total de Negócios: ${deals.length}
        - Valor em Pipeline: $${deals.reduce((acc, d) => acc + d.value, 0)}
        - Total de Contatos: ${contacts.length}
        
        Ajude o usuário a navegar, encontrar informações e ter insights sobre suas vendas.
      `;
    }
  }, [mode, activeBoard, deals, contacts]);

  // Initialize AI Agent Hook with Persistence ID
  const persistenceId = mode === 'board' && activeBoard ? `board_${activeBoard.id}` : 'global_chat';

  const { messages, input, setInput, append, isLoading, setMessages } = useAgent({
    system: systemPrompt,
    id: persistenceId,
  });

  // Handle Mode Switching & Welcome Messages
  useEffect(() => {
    // Se não tem API key, mostra mensagem de boas vindas diferente
    if (!hasApiKey && messages.length === 0) {
      setMessages([
        {
          id: 'welcome-setup',
          role: 'assistant',
          content: 'Olá! 👋 Para começar a usar a inteligência artificial, você precisa configurar uma chave de API. Use o botão abaixo para ir às configurações.',
        },
      ]);
      return;
    }
    
    if (activeBoard) {
      setMode('board');
      // Only set welcome message if history is empty
      if (messages.length === 0) {
        setMessages([
          {
            id: 'welcome-board',
            role: 'assistant',
            content: `Olá! Sou ${activeBoard.agentPersona?.name || 'seu Assistente'}. Como posso ajudar com a meta de ${activeBoard.goal?.kpi || 'vendas'}?`,
          },
        ]);
      }
    } else {
      setMode('global');
      if (messages.length === 0) {
        setMessages([
          {
            id: 'welcome-global',
            role: 'assistant',
            content: 'Olá! Sou o Flow. Como posso ajudar com seus negócios hoje?',
          },
        ]);
      }
    }
  }, [activeBoard, setMessages, hasApiKey]); // Removed messages dependency to avoid loop

  // Auto-scroll
  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages, isOpen, attachments]);

  const handleSend = async () => {
    if ((!input.trim() && attachments.length === 0) || isLoading) return;

    const currentAttachments = [...attachments];
    setAttachments([]); // Clear attachments immediately
    await append(input, currentAttachments);
  };

  // --- Attachment Handlers ---

  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      const file = e.target.files[0];
      const reader = new FileReader();
      reader.onload = event => {
        if (event.target?.result) {
          setAttachments(prev => [
            ...prev,
            {
              id: crypto.randomUUID(),
              type: file.type.startsWith('image/') ? 'image' : 'file',
              url: event.target.result as string,
              name: file.name,
              mimeType: file.type,
            },
          ]);
        }
      };
      reader.readAsDataURL(file);
    }
    // Reset input
    if (fileInputRef.current) fileInputRef.current.value = '';
  };

  const handlePaste = (e: React.ClipboardEvent) => {
    const items = e.clipboardData.items;
    for (let i = 0; i < items.length; i++) {
      if (items[i].type.indexOf('image') !== -1) {
        const file = items[i].getAsFile();
        if (file) {
          const reader = new FileReader();
          reader.onload = event => {
            if (event.target?.result) {
              setAttachments(prev => [
                ...prev,
                {
                  id: crypto.randomUUID(),
                  type: 'image',
                  url: event.target.result as string,
                  name: 'Pasted Image',
                  mimeType: file.type,
                },
              ]);
            }
          };
          reader.readAsDataURL(file);
          e.preventDefault(); // Prevent double paste if input is focused
        }
      }
    }
  };

  interface SpeechRecognitionInstance {
    start: () => void;
    stop: () => void;
    lang: string;
    continuous: boolean;
    interimResults: boolean;
    onresult: ((event: SpeechRecognitionEvent) => void) | null;
    onerror: ((event: SpeechRecognitionErrorEvent) => void) | null;
  }

  interface SpeechRecognitionEvent {
    resultIndex: number;
    results: {
      length: number;
      [index: number]: {
        [index: number]: {
          transcript: string;
        };
      };
    };
  }

  interface SpeechRecognitionErrorEvent {
    error: string;
  }

  // Speech Recognition Ref
  const recognitionRef = useRef<SpeechRecognitionInstance | null>(null);

  const startRecording = async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      const mediaRecorder = new MediaRecorder(stream);
      mediaRecorderRef.current = mediaRecorder;
      audioChunksRef.current = [];

      mediaRecorder.ondataavailable = event => {
        if (event.data.size > 0) {
          audioChunksRef.current.push(event.data);
        }
      };

      mediaRecorder.onstop = () => {
        const audioBlob = new Blob(audioChunksRef.current, { type: 'audio/webm' });
        const reader = new FileReader();
        reader.onloadend = () => {
          const base64Audio = reader.result as string;
          setAttachments(prev => [
            ...prev,
            {
              id: crypto.randomUUID(),
              type: 'audio',
              url: base64Audio,
              name: 'Audio Message',
              mimeType: 'audio/webm',
            },
          ]);
        };
        reader.readAsDataURL(audioBlob);

        // Stop all tracks
        stream.getTracks().forEach(track => track.stop());
      };

      mediaRecorder.start();
      setIsRecording(true);

      // Start Speech Recognition (Transcription)
      if ('webkitSpeechRecognition' in window || 'SpeechRecognition' in window) {
        interface WindowWithSpeechRecognition extends Window {
          SpeechRecognition?: new () => SpeechRecognitionInstance;
          webkitSpeechRecognition?: new () => SpeechRecognitionInstance;
        }

        const win = window as WindowWithSpeechRecognition;
        const SpeechRecognition = win.SpeechRecognition || win.webkitSpeechRecognition;

        if (!SpeechRecognition) {
          console.warn('Speech recognition constructor not available');
          return;
        }

        const recognition = new SpeechRecognition();
        recognition.lang = 'pt-BR';
        recognition.continuous = true;
        recognition.interimResults = true;

        recognition.onresult = (event: SpeechRecognitionEvent) => {
          let transcript = '';
          for (let i = event.resultIndex; i < event.results.length; ++i) {
            transcript += event.results[i][0].transcript;
          }
          // Update input with transcript
          if (transcript) {
            setInput(prev => {
              // Avoid duplicating if already present (basic check)
              if (prev.endsWith(transcript)) return prev;
              return transcript;
            });
          }
        };

        recognition.onerror = (event: SpeechRecognitionErrorEvent) => {
          console.error('Speech recognition error', event.error);
        };

        recognition.start();
        recognitionRef.current = recognition;
      }
    } catch (err) {
      console.error('Error accessing microphone:', err);
      alert('Erro ao acessar microfone. Verifique as permissões.');
    }
  };

  const stopRecording = () => {
    if (mediaRecorderRef.current && isRecording) {
      mediaRecorderRef.current.stop();
      setIsRecording(false);
    }
    if (recognitionRef.current) {
      recognitionRef.current.stop();
      recognitionRef.current = null;
    }
  };

  const removeAttachment = (id: string) => {
    setAttachments(prev => prev.filter(a => a.id !== id));
  };

  if (!isOpen && variant === 'overlay') return null;

  const baseClasses =
    variant === 'overlay'
      ? 'fixed inset-y-0 right-0 w-96 bg-white dark:bg-slate-900 border-l border-slate-200 dark:border-white/10 shadow-2xl z-50 flex flex-col animate-in slide-in-from-right duration-300'
      : 'w-full h-full flex flex-col';

  return (
    <div className={baseClasses} onPaste={handlePaste}>
      {/* Header */}
      <div className="h-16 flex justify-between items-center px-6 shrink-0 bg-white/80 dark:bg-slate-900/80 backdrop-blur-xl border-b border-slate-200 dark:border-white/5 z-10">
        <div className="flex items-center gap-3">
          <div
            className={`w-8 h-8 rounded-full flex items-center justify-center shadow-lg ${mode === 'board' ? 'bg-gradient-to-tr from-purple-500 to-indigo-500 shadow-purple-500/20' : 'bg-gradient-to-tr from-blue-500 to-cyan-500 shadow-blue-500/20'}`}
          >
            <Bot className="text-white" size={16} />
          </div>
          <div className="flex flex-col">
            {/* Agent Selector / Display */}
            {activeBoard ? (
              <button
                onClick={() => {
                  const newMode = mode === 'global' ? 'board' : 'global';
                  setMode(newMode);
                  // Reset chat when switching manually (optional, maybe keep history?)
                  // For now, we rely on persistence ID change to switch history
                }}
                className="flex items-center gap-1 hover:bg-slate-100 dark:hover:bg-white/5 -ml-1 px-1 rounded transition-colors text-left"
              >
                <div>
                  <h3 className="font-semibold text-slate-900 dark:text-white font-display text-sm leading-tight">
                    {activeAgentName}
                  </h3>
                  <p className="text-[10px] text-slate-500 dark:text-slate-400 font-medium leading-tight">
                    {activeAgentRole}
                  </p>
                </div>
                <ChevronDown size={12} className="text-slate-400" />
              </button>
            ) : (
              <div>
                <h3 className="font-semibold text-slate-900 dark:text-white font-display text-sm leading-tight">
                  {activeAgentName}
                </h3>
                <p className="text-[10px] text-slate-500 dark:text-slate-400 font-medium leading-tight">
                  {activeAgentRole}
                </p>
              </div>
            )}
          </div>
        </div>
        <button
          onClick={onClose}
          className="p-2 -mr-2 text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 transition-colors rounded-full hover:bg-slate-100 dark:hover:bg-white/5"
        >
          <X size={18} />
        </button>
      </div>

      {/* Messages */}
      <div className="flex-1 overflow-y-auto p-5 space-y-6 bg-slate-50 dark:bg-[#0B0F17]">
        {messages.map(msg => (
          <div
            key={msg.id}
            className={`flex flex-col ${msg.role === 'user' ? 'items-end' : 'items-start'} animate-in fade-in slide-in-from-bottom-2 duration-300`}
          >
            <div
              className={`max-w-[85%] px-4 py-3 rounded-2xl text-sm leading-relaxed shadow-sm ${
                msg.role === 'user'
                  ? (mode === 'board'
                      ? 'bg-purple-600 shadow-purple-600/10'
                      : 'bg-blue-600 shadow-blue-600/10') + ' text-white rounded-br-sm'
                  : 'bg-white dark:bg-slate-800/80 text-slate-700 dark:text-slate-200 border border-slate-200/50 dark:border-white/5 rounded-bl-sm backdrop-blur-sm'
              } whitespace-pre-wrap`}
            >
              {/* Attachments Display */}
              {msg.attachments && msg.attachments.length > 0 && (
                <div className="mb-3 space-y-2">
                  {msg.attachments.map(att => (
                    <div key={att.id} className="rounded-xl overflow-hidden">
                      {att.type === 'image' ? (
                        <img
                          src={att.url}
                          alt="Attachment"
                          className="max-w-full h-auto rounded-lg"
                        />
                      ) : att.type === 'audio' ? (
                        <AudioPlayer
                          src={att.url}
                          variant={msg.role === 'user' ? 'sent' : 'received'}
                        />
                      ) : null}
                    </div>
                  ))}
                </div>
              )}

              {msg.content && (
                <div
                  className={msg.attachments?.length ? 'mt-2 pt-2 border-t border-white/10' : ''}
                >
                  {msg.content.split(/(\*\*.*?\*\*)/).map((part, i) =>
                    part.startsWith('**') && part.endsWith('**') ? (
                      <strong key={i} className="font-semibold">
                        {part.slice(2, -2)}
                      </strong>
                    ) : (
                      part
                    )
                  )}
                </div>
              )}
            </div>
            <span className="text-[10px] text-slate-400 mt-1.5 px-1 opacity-60">
              {msg.role === 'user' ? 'Você' : mode === 'board' ? activeAgentName : 'Flow AI'}
            </span>
          </div>
        ))}
        {isLoading && (
          <div className="flex justify-start animate-in fade-in duration-300">
            <div className="bg-white dark:bg-slate-800/80 px-4 py-3 rounded-2xl rounded-bl-sm border border-slate-200/50 dark:border-white/5 shadow-sm">
              <div className="flex gap-1.5">
                <span className="w-1.5 h-1.5 bg-slate-400 rounded-full animate-[bounce_1s_infinite_0ms]"></span>
                <span className="w-1.5 h-1.5 bg-slate-400 rounded-full animate-[bounce_1s_infinite_200ms]"></span>
                <span className="w-1.5 h-1.5 bg-slate-400 rounded-full animate-[bounce_1s_infinite_400ms]"></span>
              </div>
            </div>
          </div>
        )}
        <div ref={messagesEndRef} />
      </div>

      {/* Input Area - ou Onboarding se não tem API key */}
      {!hasApiKey ? (
        /* Onboarding Card - Sem API Key */
        <div className="p-5 bg-gradient-to-t from-slate-50 to-white dark:from-slate-900 dark:to-slate-900/50 border-t border-slate-200 dark:border-white/5 shrink-0 z-10">
          <div className="bg-gradient-to-br from-blue-50 to-indigo-50 dark:from-blue-900/20 dark:to-indigo-900/20 rounded-2xl p-5 border border-blue-100 dark:border-blue-800/30">
            <div className="flex items-start gap-4">
              <div className="p-3 bg-gradient-to-br from-blue-500 to-indigo-600 rounded-xl text-white shadow-lg shadow-blue-500/20">
                <Sparkles size={24} />
              </div>
              <div className="flex-1">
                <h3 className="font-bold text-slate-900 dark:text-white text-base mb-1">
                  Configure a Inteligência Artificial
                </h3>
                <p className="text-sm text-slate-600 dark:text-slate-400 mb-4 leading-relaxed">
                  Para usar o assistente de IA, você precisa configurar uma chave de API. 
                  Suportamos <strong>Google Gemini</strong>, <strong>OpenAI</strong> e <strong>Anthropic</strong>.
                </p>
                <button
                  onClick={() => {
                    onClose();
                    navigate('/settings#ai-config');
                  }}
                  className="inline-flex items-center gap-2 px-4 py-2.5 bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-500 hover:to-indigo-500 text-white text-sm font-bold rounded-xl shadow-lg shadow-blue-500/20 transition-all active:scale-95"
                >
                  <Settings size={16} />
                  Ir para Configurações
                </button>
              </div>
            </div>
          </div>
        </div>
      ) : (
      /* Input Area Normal */
      <div className="p-4 bg-white/80 dark:bg-slate-900/80 backdrop-blur-xl border-t border-slate-200 dark:border-white/5 shrink-0 z-10">
        {/* Attachment Previews */}
        {attachments.length > 0 && (
          <div className="flex gap-2 mb-2 overflow-x-auto pb-2 items-center">
            {attachments.map(att => (
              <div
                key={att.id}
                className={`relative group shrink-0 ${att.type === 'audio' ? 'min-w-[260px]' : ''}`}
              >
                {att.type === 'image' ? (
                  <img
                    src={att.url}
                    alt="Preview"
                    className="w-16 h-16 object-cover rounded-lg border border-slate-200 dark:border-white/10"
                  />
                ) : att.type === 'audio' ? (
                  <div className="pr-6">
                    <AudioPlayer src={att.url} variant="preview" />
                  </div>
                ) : (
                  <div className="w-16 h-16 flex items-center justify-center bg-slate-100 dark:bg-white/5 rounded-lg border border-slate-200 dark:border-white/10">
                    <Paperclip size={20} />
                  </div>
                )}
                <button
                  onClick={() => removeAttachment(att.id)}
                  className="absolute -top-2 -right-2 bg-white dark:bg-slate-800 text-red-500 border border-slate-200 dark:border-white/10 rounded-full p-1 shadow-sm opacity-0 group-hover:opacity-100 transition-opacity z-10 hover:bg-red-50"
                >
                  <X size={12} />
                </button>
              </div>
            ))}
          </div>
        )}

        <div className="flex items-center gap-2 bg-slate-100 dark:bg-slate-800/50 p-1.5 rounded-full border border-slate-200/50 dark:border-white/5 focus-within:ring-2 focus-within:ring-blue-500/20 focus-within:border-blue-500/50 transition-all">
          {/* File Input (Hidden) */}
          <input
            type="file"
            ref={fileInputRef}
            className="hidden"
            accept="image/*"
            onChange={handleFileSelect}
          />

          {/* Attachment Button */}
          <button
            onClick={() => fileInputRef.current?.click()}
            className="p-2 text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 transition-colors rounded-full hover:bg-slate-200 dark:hover:bg-white/10"
            title="Anexar imagem"
          >
            <Paperclip size={18} />
          </button>

          {/* Audio Recording Button */}
          <button
            onClick={isRecording ? stopRecording : startRecording}
            className={`p-2 transition-colors rounded-full ${
              isRecording
                ? 'text-red-500 bg-red-100 dark:bg-red-900/20 animate-pulse'
                : 'text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 hover:bg-slate-200 dark:hover:bg-white/10'
            }`}
            title={isRecording ? 'Parar gravação' : 'Gravar áudio'}
          >
            {isRecording ? <StopCircle size={18} /> : <Mic size={18} />}
          </button>

          <input
            type="text"
            className="flex-1 bg-transparent border-0 px-2 py-2 text-sm text-slate-900 dark:text-white focus:ring-0 outline-none placeholder:text-slate-400"
            placeholder={
              isRecording
                ? 'Gravando...'
                : `Pergunte para ${mode === 'board' ? activeAgentName.split(' ')[0] : 'Flow AI'}...`
            }
            value={input}
            onChange={e => setInput(e.target.value)}
            onKeyDown={e => e.key === 'Enter' && handleSend()}
            disabled={isRecording}
          />

          <button
            onClick={handleSend}
            disabled={(!input.trim() && attachments.length === 0) || isLoading || isRecording}
            className={`p-2 text-white rounded-full disabled:opacity-50 disabled:cursor-not-allowed transition-all shadow-lg active:scale-95 ${mode === 'board' ? 'bg-purple-600 hover:bg-purple-500 shadow-purple-600/20' : 'bg-blue-600 hover:bg-blue-500 shadow-blue-600/20'}`}
          >
            <Send size={16} className={input.trim() || attachments.length > 0 ? 'ml-0.5' : ''} />
          </button>
        </div>
        <div className="text-center mt-2">
          <p className="text-[10px] text-slate-400 dark:text-slate-500">
            IA pode cometer erros. Verifique as informações.
          </p>
        </div>
      </div>
      )}
    </div>
  );
};

export default AIAssistant;
