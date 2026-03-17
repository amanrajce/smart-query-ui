import { useState, useRef, useEffect } from 'react';
import { sendMessageToAI, fetchModelComparison } from './services/api';
import ReactMarkdown from 'react-markdown';
import {
  PanelLeft, ArrowUp, ChevronDown, StopCircle, Paperclip,
  Check, Columns, Globe, Copy, ThumbsUp, ThumbsDown, RotateCw,
  Plus, MessageSquare, Trash2, X, FileText, CheckCheck, Sparkles,
  MoreHorizontal, Settings, LogOut, LayoutGrid, AppWindow
} from 'lucide-react';
import type { Message, ChatSession, ModelProvider, ModelResponse } from './types';
import { JudgeTable } from './components/JudgeTable';

// --- OFFICIAL META & BRAND VECTORS ---
const ModelVector = ({ id, size = 18 }: { id: string, size?: number }) => {
  switch (id) {
    case 'gemini':
      return <svg width={size} height={size} viewBox="0 0 24 24" fill="none"><path d="M12 2C12 7.52285 7.52285 12 2 12C7.52285 12 12 16.4772 12 22C12 16.4772 16.4772 12 22 12C16.4772 12 12 7.52285 12 2Z" fill="#60A5FA" /></svg>;
    case 'groq':
    case 'llama8b':
      return (
        <svg width={size} height={size} viewBox="0 0 28 28" fill="none">
          <path d="M20.2 7.14c-2.2 0-4.19 1.1-5.5 2.85-1.31-1.75-3.3-2.85-5.5-2.85-3.9 0-7.06 3.16-7.06 7.06s3.16 7.06 7.06 7.06c2.2 0 4.19-1.1 5.5-2.85 1.31 1.75 3.3 2.85 5.5 2.85 3.9 0 7.06-3.16 7.06-7.06s-3.16-7.06-7.06-7.06zm0 11.23c-2.3 0-4.17-1.87-4.17-4.17s1.87-4.17 4.17-4.17 4.17 1.87 4.17 4.17-1.87 4.17-4.17 4.17zm-11.01 0c-2.3 0-4.17-1.87-4.17-4.17s1.87-4.17 4.17-4.17 4.17 1.87 4.17 4.17-1.87 4.17-4.17 4.17z" fill="#06B6D4" />
        </svg>
      );
    case 'mistral':
      return <svg width={size} height={size} viewBox="0 0 24 24" fill="none"><path d="M4 20L12 4L20 20H16L12 12L8 20H4Z" fill="#F97316" /></svg>;
    case 'deepseek':
    case 'qwen3':
      return <svg width={size} height={size} viewBox="0 0 24 24" fill="none"><path d="M12 3L21 8.5V15.5L12 21L3 15.5V8.5L12 3Z" stroke="#4D6BFE" strokeWidth="2.5" strokeLinejoin="round" /><path d="M12 8L16.5 10.5V13.5L12 16L7.5 13.5V10.5L12 8Z" fill="#4D6BFE" /></svg>;
    case 'compare':
      return <Columns size={size} className="text-gray-400" />;
    default:
      return <div style={{ width: size, height: size }} className="bg-[#2F2F2F] rounded-full" />;
  }
};

const getIconIdFromName = (name: string): string => {
  if (name.includes('Llama')) return 'groq';
  if (name.includes('DeepSeek') || name.includes('Qwen')) return 'deepseek';
  if (name.includes('Mistral') || name.includes('Mixtral')) return 'mistral';
  if (name.includes('Gemini')) return 'gemini';
  return 'compare';
};

// 💎 SENIOR UI COMPONENT: The Comparison Viewer
// Abstracts away the complex logic for Tabs vs. Grid viewing
const ComparisonViewer = ({ 
  comparisons, 
  messageId, 
  onSelectWinner 
}: { 
  comparisons: ModelResponse[], 
  messageId: string, 
  onSelectWinner: (id: string, comp: ModelResponse) => void 
}) => {
  const [activeTab, setActiveTab] = useState(comparisons[0]?.modelName);
  const [viewMode, setViewMode] = useState<'tabs' | 'grid'>('tabs');
  const [copiedId, setCopiedId] = useState<string | null>(null);

  const handleCopy = (id: string, text: string) => {
    navigator.clipboard.writeText(text);
    setCopiedId(id);
    setTimeout(() => setCopiedId(null), 2000); 
  };

  const activeData = comparisons.find(c => c.modelName === activeTab);

  return (
    <div className="mt-4 w-full flex flex-col gap-3">
      {/* Control Bar: View Toggles */}
      <div className="flex items-center justify-end gap-2 mb-1">
        <div className="bg-[#2A2A2A] p-1 rounded-lg flex items-center border border-[#3E3E3E]">
          <button onClick={() => setViewMode('tabs')} className={`p-1.5 rounded-md transition-all ${viewMode === 'tabs' ? 'bg-[#3E3E3E] text-white shadow-sm' : 'text-gray-500 hover:text-gray-300'}`} title="Tab View">
            <AppWindow size={14} />
          </button>
          <button onClick={() => setViewMode('grid')} className={`p-1.5 rounded-md transition-all ${viewMode === 'grid' ? 'bg-[#3E3E3E] text-white shadow-sm' : 'text-gray-500 hover:text-gray-300'}`} title="Grid View">
            <LayoutGrid size={14} />
          </button>
        </div>
      </div>

      {viewMode === 'tabs' ? (
        // --- 🟢 TABBED VIEW (Zero Scroll Fatigue) ---
        <div className="bg-[#212121] rounded-2xl border border-[#3E3E3E] shadow-lg overflow-hidden flex flex-col">
          {/* Tab Header */}
          <div className="flex overflow-x-auto hide-scrollbar border-b border-[#3E3E3E] bg-[#1A1A1A]">
            {comparisons.map((comp) => {
              const isActive = activeTab === comp.modelName;
              return (
                <button
                  key={comp.modelName}
                  onClick={() => setActiveTab(comp.modelName)}
                  className={`flex items-center gap-2 px-5 py-3.5 text-[13px] font-medium whitespace-nowrap transition-all border-b-2 ${
                    isActive 
                      ? 'border-blue-500 text-blue-400 bg-blue-500/5' 
                      : 'border-transparent text-gray-500 hover:text-gray-300 hover:bg-[#2A2A2A]'
                  }`}
                >
                  <ModelVector id={getIconIdFromName(comp.modelName)} size={14} />
                  {comp.modelName}
                </button>
              )
            })}
          </div>
          
          {/* Active Tab Content */}
          {activeData && (
            <div className="relative flex flex-col h-[400px]">
              <div className="flex-1 p-6 prose prose-invert prose-sm max-w-none overflow-y-auto custom-scrollbar">
                <ReactMarkdown>{activeData.content}</ReactMarkdown>
              </div>
              
              {/* Tab Footer Actions */}
              <div className="px-6 py-3 border-t border-[#3E3E3E] bg-[#1A1A1A]/50 flex items-center justify-between">
                <button onClick={() => handleCopy(activeData.modelName, activeData.content)} className="flex items-center gap-2 px-3 py-1.5 text-[12px] font-medium text-gray-400 hover:text-white hover:bg-[#2A2A2A] rounded-lg transition-colors">
                  {copiedId === activeData.modelName ? <CheckCheck size={14} className="text-emerald-400" /> : <Copy size={14} />}
                  {copiedId === activeData.modelName ? 'Copied' : 'Copy Text'}
                </button>
                <button onClick={() => onSelectWinner(messageId, activeData)} className="flex items-center gap-2 text-[12px] font-bold text-black bg-white px-5 py-2 rounded-full hover:bg-gray-200 transition-all transform hover:scale-105 shadow-sm">
                  <Check size={14} /> Adopt This Answer
                </button>
              </div>
            </div>
          )}
        </div>
      ) : (
        // --- 🟢 GRID VIEW (Legacy Side-by-Side) ---
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 w-full">
          {comparisons.map((comp) => (
            <div key={comp.modelName} className="bg-[#212121] rounded-2xl flex flex-col overflow-hidden border border-[#3E3E3E] hover:border-[#555] transition-all duration-300 shadow-sm">
              <div className="px-5 py-3.5 border-b border-[#3E3E3E] flex justify-between items-center bg-[#1A1A1A]">
                <span className="font-semibold text-[13px] text-[#ECECEC] flex items-center gap-2.5">
                  <ModelVector id={getIconIdFromName(comp.modelName)} size={14} />
                  {comp.modelName}
                </span>
                <button onClick={() => onSelectWinner(messageId, comp)} className="text-[11px] font-bold text-black bg-white px-3 py-1.5 rounded-full hover:bg-gray-200 transition-all shadow-sm">
                  Select
                </button>
              </div>
              <div className="p-5 prose prose-invert prose-sm max-w-none overflow-y-auto h-[300px] custom-scrollbar relative group/copy">
                <button onClick={() => handleCopy(comp.modelName, comp.content)} className="absolute top-2 right-2 p-1.5 bg-[#212121] border border-[#3E3E3E] rounded-md opacity-0 group-hover/copy:opacity-100 transition-opacity hover:bg-[#2F2F2F]">
                  {copiedId === comp.modelName ? <CheckCheck size={14} className="text-emerald-400" /> : <Copy size={14} className="text-gray-400" />}
                </button>
                <ReactMarkdown>{comp.content}</ReactMarkdown>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
};


export default function App() {
  const [messages, setMessages] = useState<Message[]>([]);
  const [input, setInput] = useState('');
  const [provider, setProvider] = useState<ModelProvider>('groq');
  const [isLoading, setIsLoading] = useState(false);
  const [isSidebarOpen, setIsSidebarOpen] = useState(true);
  const [isModelMenuOpen, setIsModelMenuOpen] = useState(false);
  const [isAccountMenuOpen, setIsAccountMenuOpen] = useState(false);

  const [copiedId, setCopiedId] = useState<string | null>(null);
  const [feedbackState, setFeedbackState] = useState<Record<string, 'up' | 'down'>>({});

  const [attachedFile, setAttachedFile] = useState<{ name: string; content: string } | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const [chatHistory, setChatHistory] = useState<ChatSession[]>(() => {
    try {
      const saved = localStorage.getItem('smartquery_history');
      return saved ? JSON.parse(saved) : [];
    } catch (e) {
      return [];
    }
  });
  const [currentSessionId, setCurrentSessionId] = useState<string | null>(null);

  const messagesEndRef = useRef<HTMLDivElement>(null);
  const textareaRef = useRef<HTMLTextAreaElement>(null);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  useEffect(() => {
    if (messages.length > 0) {
      const sessionId = currentSessionId || Date.now().toString();
      if (!currentSessionId) setCurrentSessionId(sessionId);
      const firstUserMsg = messages.find(m => m.sender === 'user');
      const title = firstUserMsg ? (firstUserMsg.text.slice(0, 32) + (firstUserMsg.text.length > 32 ? '...' : '')) : 'New Conversation';
      setChatHistory(prev => {
        const existing = prev.filter(p => p.id !== sessionId);
        const updated = [{ id: sessionId, title, updatedAt: Date.now(), messages }, ...existing];
        return updated.slice(0, 10);
      });
    }
  }, [messages, currentSessionId]);

  useEffect(() => {
    localStorage.setItem('smartquery_history', JSON.stringify(chatHistory));
  }, [chatHistory]);

  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (file.size > 5 * 1024 * 1024) {
      alert("File is too large. Please upload files smaller than 5MB.");
      e.target.value = '';
      return;
    }

    const reader = new FileReader();
    reader.onload = (event) => {
      if (event.target?.result) {
        setAttachedFile({ name: file.name, content: event.target.result as string });
      }
    };
    reader.onerror = () => {
      alert("Error reading file. Please ensure it is a valid text or code document.");
    };
    
    reader.readAsText(file);
    e.target.value = ''; 
  };

  const handleSelectWinner = (messageId: string, winner: ModelResponse) => {
    setMessages(prev => prev.map(msg => msg.id === messageId ? {
      ...msg,
      text: `**Adopted: ${winner.modelName}**\n\n${winner.content}`,
      comparisons: undefined,
      evaluations: undefined
    } : msg));
  };

  const handleCopy = (id: string, text: string) => {
    navigator.clipboard.writeText(text);
    setCopiedId(id);
    setTimeout(() => setCopiedId(null), 2000); 
  };

  const handleFeedback = (id: string, type: 'up' | 'down') => {
    setFeedbackState(prev => ({
      ...prev,
      [id]: prev[id] === type ? null : type 
    }));
  };

  const handleRegenerate = async () => {
    const lastUserMsg = [...messages].reverse().find(m => m.sender === 'user');
    if (!lastUserMsg || isLoading) return;
    
    setMessages(prev => prev.slice(0, -1));
    await sendPromptToBackend(lastUserMsg.text, provider);
  };

  const sendPromptToBackend = async (promptText: string, currentProvider: ModelProvider) => {
    setIsLoading(true);
    try {
      if (currentProvider === 'compare') {
        const data = await fetchModelComparison(promptText);
        setMessages(prev => [...prev, {
          id: Date.now().toString(),
          text: "Multi-model evaluation complete. Explore the tabs below, or view the AI Judge's verdict at the bottom.",
          sender: 'bot',
          provider: 'compare', 
          comparisons: data.answers,
          evaluations: data.evaluation
        } as any]);
      } else {
        const data = await sendMessageToAI(promptText, currentProvider);
        setMessages(prev => [...prev, { 
            id: Date.now().toString(), 
            text: data.reply, 
            sender: 'bot',
            provider: currentProvider 
        } as any]);
      }
    } catch (error) {
      setMessages(prev => [...prev, { id: Date.now().toString(), text: "System connection failed. Please retry.", sender: 'bot', provider: currentProvider } as any]);
    } finally {
      setIsLoading(false);
    }
  };

  const handleSend = async (e?: React.FormEvent) => {
    e?.preventDefault();
    if ((!input.trim() && !attachedFile) || isLoading) return;

    const finalPrompt = attachedFile
      ? `[Context File: ${attachedFile.name}]\n\n${attachedFile.content}\n\nUser Question: ${input}`
      : input;

    const userMsg: Message = { id: Date.now().toString(), text: input.trim() || `Attached: ${attachedFile?.name}`, sender: 'user', fileName: attachedFile?.name };
    setMessages(prev => [...prev, userMsg]);
    setInput('');
    setAttachedFile(null);
    
    await sendPromptToBackend(finalPrompt, provider);
  };

  const getProviderName = (id: string) => {
    if (id === 'groq') return 'Llama 3.3 70B';
    if (id === 'qwen3') return 'Qwen 2.5 72B';
    if (id === 'llama8b') return 'Llama 3.1 8B';
    if (id === 'mistral') return 'Mistral AI';
    if (id === 'deepseek') return 'DeepSeek R1';
    if (id === 'gemini') return 'Google Gemini';
    if (id === 'compare') return 'Compare & Judge';
    return 'Unknown Model';
  };

  const ALL_PROVIDERS = ['compare', 'groq', 'gemini', 'deepseek', 'qwen3', 'mistral', 'llama8b'];

  return (
    <div className="flex h-screen bg-[#212121] text-[#ECECEC] font-sans antialiased selection:bg-white/10 overflow-hidden">

      <aside 
        className={`${isSidebarOpen ? 'w-[260px] border-[#2F2F2F] opacity-100' : 'w-0 border-transparent opacity-0 pointer-events-none'} 
        transition-all duration-300 ease-in-out bg-[#171717] flex-shrink-0 flex flex-col overflow-hidden z-30 absolute md:relative h-full border-r`}
      >
        <div className="w-[260px] flex flex-col h-full">
          
          <div className="h-14 flex items-center justify-between px-4">
            <span className="font-semibold text-[15px] text-gray-200 flex items-center gap-2">
              <Sparkles size={16} className="text-gray-400" />
              SmartQuery
            </span>
            <button 
              onClick={() => setIsSidebarOpen(false)} 
              className="p-1.5 text-gray-500 hover:text-gray-200 hover:bg-[#2A2A2A] rounded-md transition-colors"
            >
              <PanelLeft size={18} />
            </button>
          </div>

          <div className="px-3 pt-2 pb-1">
            <button onClick={() => { setMessages([]); setCurrentSessionId(null); }} className="w-full flex items-center justify-start gap-2.5 px-3 py-2 text-[14px] font-medium text-gray-200 bg-transparent hover:bg-[#2A2A2A] rounded-lg transition-colors group">
              <Plus size={16} className="text-gray-400 group-hover:text-white transition-colors" /> New Chat
            </button>
          </div>

          <div className="flex-1 overflow-y-auto px-3 pb-4 custom-scrollbar mt-4">
            <p className="text-[11px] font-bold text-gray-500 px-3 py-1 uppercase tracking-widest mb-1">Today</p>
            {chatHistory.map(session => (
              <div key={session.id} onClick={() => { setMessages(session.messages); setCurrentSessionId(session.id); }} className={`w-full group flex items-center justify-between px-3 py-2 rounded-lg cursor-pointer transition-colors ${currentSessionId === session.id ? 'bg-[#2A2A2A] text-gray-100' : 'text-gray-400 hover:bg-[#2A2A2A] hover:text-gray-200'}`}>
                <div className="flex items-center gap-3 overflow-hidden">
                  <span className="text-[13px] truncate">{session.title}</span>
                </div>
                <button onClick={(e) => { e.stopPropagation(); setChatHistory(prev => prev.filter(s => s.id !== session.id)); }} className="opacity-0 group-hover:opacity-100 p-1 hover:text-white transition-colors"><Trash2 size={13} /></button>
              </div>
            ))}
          </div>

          <div className="p-3 relative">
            <button 
              onClick={() => setIsAccountMenuOpen(!isAccountMenuOpen)} 
              className="w-full flex items-center justify-between p-2 hover:bg-[#2A2A2A] rounded-lg transition-colors group"
            >
              <div className="flex items-center gap-2.5">
                <div className="w-7 h-7 rounded-full bg-blue-500/20 text-blue-400 border border-blue-500/30 flex items-center justify-center text-[10px] font-bold">
                  KK
                </div>
                <span className="text-[14px] font-medium text-gray-300 group-hover:text-white transition-colors">Komal Kumari</span>
              </div>
              <MoreHorizontal size={16} className="text-gray-500 group-hover:text-gray-300" />
            </button>

            {isAccountMenuOpen && (
              <>
                <div className="fixed inset-0 z-40" onClick={() => setIsAccountMenuOpen(false)}></div>
                <div className="absolute bottom-14 left-3 w-[236px] bg-[#2F2F2F] border border-[#3E3E3E] rounded-xl shadow-2xl py-1 z-50 overflow-hidden">
                  <div className="px-3 py-2.5 border-b border-[#3E3E3E] mb-1">
                    <span className="block text-[13px] font-semibold text-gray-200">Komal Kumari</span>
                    <span className="block text-[12px] text-gray-400">Developer Plan</span>
                  </div>
                  <button className="w-full flex items-center gap-2.5 px-3 py-2.5 text-[13px] text-gray-300 hover:bg-[#3E3E3E] hover:text-white transition-colors">
                    <Settings size={15}/> Settings
                  </button>
                  <button className="w-full flex items-center gap-2.5 px-3 py-2.5 text-[13px] text-gray-300 hover:bg-[#3E3E3E] hover:text-white transition-colors">
                    <LogOut size={15}/> Log out
                  </button>
                </div>
              </>
            )}
          </div>
        </div>
      </aside>

      <main className="flex-1 flex flex-col h-full relative min-w-0 bg-[#212121]">
        <header className="h-14 flex items-center px-4 z-10 w-full sticky top-0 bg-[#212121]/90 backdrop-blur-md border-b border-transparent">
          {!isSidebarOpen && (
            <button 
              onClick={() => setIsSidebarOpen(true)} 
              className="p-2 mr-3 text-gray-400 hover:text-gray-200 hover:bg-[#2F2F2F] rounded-lg transition-colors"
            >
              <PanelLeft size={20} />
            </button>
          )}
          
          <div className="relative">
            <button onClick={() => setIsModelMenuOpen(!isModelMenuOpen)} className="flex items-center gap-2 px-3 py-1.5 rounded-lg hover:bg-[#2F2F2F] text-[15px] font-semibold text-gray-200 transition-colors">{getProviderName(provider)} <ChevronDown size={14} /></button>
            
            {isModelMenuOpen && (
              <>
                <div className="fixed inset-0 z-40" onClick={() => setIsModelMenuOpen(false)}></div>
                <div className="absolute top-full mt-1 left-0 w-64 bg-[#2F2F2F] border border-[#3E3E3E] rounded-xl shadow-2xl py-1.5 z-50">
                  {ALL_PROVIDERS.map((p) => (
                    <button key={p} onClick={() => { setProvider(p as ModelProvider); setIsModelMenuOpen(false); }} className={`w-full text-left px-4 py-2.5 text-[14px] flex items-center justify-between hover:bg-[#3E3E3E] transition-colors ${p === 'compare' ? 'border-b border-[#3E3E3E] mb-1 pb-2' : ''}`}>
                      <span className="flex items-center gap-3 font-medium text-gray-300"><ModelVector id={p} size={16} /> {getProviderName(p)}</span>
                      {provider === p && <Check size={16} className="text-white" />}
                    </button>
                  ))}
                </div>
              </>
            )}
          </div>
        </header>

        <div className="flex-1 overflow-y-auto w-full flex flex-col items-center">
          {messages.length === 0 ? (
            <div className="h-full flex flex-col items-center justify-center px-4 w-full max-w-[768px] pb-20">
              <div className="w-16 h-16 flex items-center justify-center mb-6 bg-[#212121] border border-[#3E3E3E] rounded-full shadow-sm"><ModelVector id={provider} size={28} /></div>
              <h2 className="text-2xl font-medium text-[#ECECEC]">What can I help with?</h2>
            </div>
          ) : (
            <div className="w-full max-w-[800px] px-4 py-6 flex flex-col gap-8 pb-48">
              {messages.map((msg, index) => {
                const isLastMsg = index === messages.length - 1;
                
                return (
                  <div key={msg.id} className={`flex w-full ${msg.sender === 'user' ? 'justify-end' : 'justify-start'}`}>
                    {msg.sender === 'user' ? (
                      <div className="flex flex-col items-end gap-2 max-w-[75%]">
                        {msg.fileName && <div className="flex items-center gap-2 px-3 py-1.5 bg-[#3E3E3E] rounded-lg text-[12px] text-gray-300 border border-white/5"><FileText size={14} className="text-blue-400" /> {msg.fileName}</div>}
                        <div className="bg-[#2F2F2F] px-5 py-3 rounded-3xl text-[#ECECEC] text-[15.5px] leading-relaxed shadow-sm break-words">{msg.text}</div>
                      </div>
                    ) : (
                      <div className="flex gap-4 w-full group">
                        <div className="w-8 h-8 flex items-center justify-center shrink-0 rounded-full border border-[#3E3E3E] bg-[#212121] mt-0.5 shadow-sm">
                          <ModelVector id={(msg as any).provider || 'gemini'} size={16} />
                        </div>
                        
                        <div className="w-full min-w-0">
                          <div className="prose prose-invert max-w-none text-[16px] text-[#ECECEC] leading-[1.7] pt-1"><ReactMarkdown>{msg.text}</ReactMarkdown></div>
                          
                          <div className="flex items-center gap-1 mt-3 text-gray-500 opacity-0 group-hover:opacity-100 transition-opacity">
                            <button onClick={() => handleCopy(msg.id, msg.text)} className="p-1.5 hover:text-gray-200 hover:bg-[#2F2F2F] rounded-lg transition-colors" title="Copy Message">
                              {copiedId === msg.id ? <CheckCheck size={15} className="text-emerald-400" /> : <Copy size={15} />}
                            </button>
                            {isLastMsg && !msg.comparisons && (
                              <button onClick={handleRegenerate} disabled={isLoading} className="p-1.5 hover:text-gray-200 hover:bg-[#2F2F2F] rounded-lg transition-colors" title="Regenerate Answer">
                                <RotateCw size={15} className={isLoading ? "animate-spin" : ""} />
                              </button>
                            )}
                            <button onClick={() => handleFeedback(msg.id, 'up')} className={`p-1.5 ml-1 rounded-lg transition-colors ${feedbackState[msg.id] === 'up' ? 'text-emerald-400 bg-[#2F2F2F]' : 'hover:text-gray-200 hover:bg-[#2F2F2F]'}`} title="Good Response">
                              <ThumbsUp size={15} />
                            </button>
                            <button onClick={() => handleFeedback(msg.id, 'down')} className={`p-1.5 rounded-lg transition-colors ${feedbackState[msg.id] === 'down' ? 'text-rose-400 bg-[#2F2F2F]' : 'hover:text-gray-200 hover:bg-[#2F2F2F]'}`} title="Bad Response">
                              <ThumbsDown size={15} />
                            </button>
                          </div>

                          {/* 💎 INJECTED THE SENIOR TABBED COMPONENT HERE */}
                          {msg.comparisons && (
                            <ComparisonViewer 
                              comparisons={msg.comparisons} 
                              messageId={msg.id} 
                              onSelectWinner={handleSelectWinner} 
                            />
                          )}

                          {msg.evaluations && (
                            <div className="mt-8 w-full">
                              <JudgeTable evaluations={msg.evaluations} />
                            </div>
                          )}

                        </div>
                      </div>
                    )}
                  </div>
                );
              })}
              <div ref={messagesEndRef} className="h-6" />
            </div>
          )}
        </div>

        {/* Input Area */}
        <div className="absolute bottom-0 left-0 w-full bg-gradient-to-t from-[#212121] via-[#212121] to-transparent pt-12 pb-6 px-4">
          <div className="max-w-[768px] mx-auto relative">
            <div className="relative flex flex-col w-full bg-[#2F2F2F] rounded-[24px] focus-within:bg-[#333333] transition-all shadow-lg border border-transparent focus-within:border-white/10">
              {attachedFile && (
                <div className="px-4 pt-4">
                  <div className="inline-flex items-center gap-2 px-3 py-1.5 bg-[#3E3E3E] rounded-xl text-[13px] text-white border border-white/10 shadow-md">
                    <FileText size={14} className="text-blue-400" />
                    <span className="max-w-[150px] truncate">{attachedFile.name}</span>
                    <button onClick={() => setAttachedFile(null)} className="ml-1 p-0.5 hover:bg-white/10 rounded-full transition-colors"><X size={14} /></button>
                  </div>
                </div>
              )}
              <textarea
                ref={textareaRef} value={input} onChange={(e) => {
                  setInput(e.target.value);
                  if (textareaRef.current) {
                    textareaRef.current.style.height = 'auto';
                    textareaRef.current.style.height = `${Math.min(textareaRef.current.scrollHeight, 200)}px`;
                  }
                }}
                onKeyDown={(e) => { if (e.key === 'Enter' && !e.shiftKey) { e.preventDefault(); handleSend(); } }}
                placeholder="Message SmartQuery..."
                className="w-full max-h-[200px] min-h-[52px] bg-transparent border-0 resize-none outline-none text-[16px] py-[14px] pl-5 pr-14 text-[#ECECEC] placeholder:text-gray-400 custom-scrollbar"
                rows={1} disabled={isLoading}
              />
              <div className="flex items-center justify-between px-3 pb-3">
                <div className="flex items-center gap-1">
                  <input type="file" ref={fileInputRef} onChange={handleFileUpload} className="hidden" accept=".txt,.js,.py,.md,.json,.ts,.csv,.html,.css" />
                  <button onClick={() => fileInputRef.current?.click()} className="p-2 text-gray-400 hover:text-[#ECECEC] rounded-full transition-colors"><Paperclip size={20} /></button>
                  <button className="p-2 text-gray-400 hover:text-[#ECECEC] rounded-full transition-colors"><Globe size={20} /></button>
                </div>
                <div className="absolute right-3 bottom-3">
                  <button onClick={() => handleSend()} disabled={isLoading || (!input.trim() && !attachedFile)} className={`w-8 h-8 rounded-full flex items-center justify-center transition-all ${input.trim() || attachedFile ? 'bg-white text-black' : 'bg-[#212121] text-gray-500'}`}>
                    {isLoading ? <StopCircle size={16} /> : <ArrowUp size={18} strokeWidth={3} />}
                  </button>
                </div>
              </div>
            </div>
          </div>
        </div>
      </main>
    </div>
  );
}