import React, { useState, useRef, useEffect } from 'react';
import { sendMessageToAI, fetchModelComparison } from './services/api';
import ReactMarkdown from 'react-markdown';
import ayulexLogo from './assets/ayulex-logo.png'; 
import { SignedIn, SignedOut, SignInButton, UserButton, useUser } from "@clerk/clerk-react";
import {
  Menu, ArrowUp, ChevronDown, StopCircle, Paperclip,
  Check, Columns, Globe, Copy, ThumbsUp, ThumbsDown, RotateCw,
  Plus, Trash2, X, FileText, CheckCheck,
  LayoutGrid, AppWindow, Stethoscope, GraduationCap, User,
  MessageSquare, ActivitySquare
} from 'lucide-react';
import { JudgeTable } from './components/JudgeTable';
import { ClinicalCard } from './components/ClinicalCard';

// 🧰 SENIOR FIX 1: Inlined types so the component is completely self-sufficient and error-free
export type ModelProvider = 'groq' | 'gemini' | 'deepseek' | 'qwen3' | 'mistral' | 'llama8b' | 'compare';

export interface ModelResponse {
  modelName: string;
  content: string;
}

export interface Message {
  id: string;
  text: string;
  sender: 'user' | 'bot';
  provider?: string;
  fileName?: string;
  comparisons?: ModelResponse[];
  evaluations?: any[];
}

interface Patient {
  id: string;
  displayId: string; 
  lastUpdated: number;
  messages: Message[];
}

// 🧰 SENIOR FIX 2: Relaxed the strict generic Ref type to accept React.RefObject<any> to prevent nullability errors
function useOnClickOutside(ref: React.RefObject<any>, handler: () => void) {
  useEffect(() => {
    const listener = (event: MouseEvent | TouchEvent) => {
      if (!ref.current || ref.current.contains(event.target as Node)) return;
      handler();
    };
    document.addEventListener('mousedown', listener);
    document.addEventListener('touchstart', listener);
    return () => {
      document.removeEventListener('mousedown', listener);
      document.removeEventListener('touchstart', listener);
    };
  }, [ref, handler]);
}

const ModelVector = ({ id, size = 18 }: { id: string, size?: number }) => {
  switch (id) {
    case 'gemini': return <svg width={size} height={size} viewBox="0 0 24 24" fill="none"><path d="M12 2C12 7.52285 7.52285 12 2 12C7.52285 12 12 16.4772 12 22C12 16.4772 16.4772 12 22 12C16.4772 12 12 7.52285 12 2Z" fill="#8AB4F8" /></svg>;
    case 'groq':
    case 'llama8b': return <svg width={size} height={size} viewBox="0 0 28 28" fill="none"><path d="M20.2 7.14c-2.2 0-4.19 1.1-5.5 2.85-1.31-1.75-3.3-2.85-5.5-2.85-3.9 0-7.06 3.16-7.06 7.06s3.16 7.06 7.06 7.06c2.2 0 4.19-1.1 5.5-2.85 1.31 1.75 3.3 2.85 5.5 2.85 3.9 0 7.06-3.16 7.06-7.06s-3.16-7.06-7.06-7.06zm0 11.23c-2.3 0-4.17-1.87-4.17-4.17s1.87-4.17 4.17-4.17 4.17 1.87 4.17 4.17-1.87 4.17-4.17 4.17zm-11.01 0c-2.3 0-4.17-1.87-4.17-4.17s1.87-4.17 4.17-4.17 4.17 1.87 4.17 4.17-1.87 4.17-4.17 4.17z" fill="#06B6D4" /></svg>;
    case 'mistral': return <svg width={size} height={size} viewBox="0 0 24 24" fill="none"><path d="M4 20L12 4L20 20H16L12 12L8 20H4Z" fill="#F97316" /></svg>;
    case 'deepseek':
    case 'qwen3': return <svg width={size} height={size} viewBox="0 0 24 24" fill="none"><path d="M12 3L21 8.5V15.5L12 21L3 15.5V8.5L12 3Z" stroke="#4D6BFE" strokeWidth="2.5" strokeLinejoin="round" /><path d="M12 8L16.5 10.5V13.5L12 16L7.5 13.5V10.5L12 8Z" fill="#4D6BFE" /></svg>;
    case 'compare': return <Columns size={size} className="text-[#C4C7C5]" />;
    default: return <div style={{ width: size, height: size }} className="bg-[#1E1F20] rounded-full" />;
  }
};

const getIconIdFromName = (name: string): string => {
  if (name.includes('Llama')) return 'groq';
  if (name.includes('DeepSeek') || name.includes('Qwen')) return 'deepseek';
  if (name.includes('Mistral') || name.includes('Mixtral')) return 'mistral';
  if (name.includes('Gemini')) return 'gemini';
  return 'compare';
};

const UserGreeting = () => {
  const { user } = useUser();
  return <>{user?.fullName || user?.firstName || 'Ayulex Member'}</>;
};

const ComparisonViewer = ({ comparisons, messageId, onSelectWinner }: { comparisons: ModelResponse[], messageId: string, onSelectWinner: (id: string, comp: ModelResponse) => void }) => {
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
      <div className="flex items-center justify-end gap-2 mb-1">
        <div className="bg-[#1E1F20] p-1 rounded-lg flex items-center border border-white/5">
          <button onClick={() => setViewMode('tabs')} className={`p-1.5 rounded-md transition-all ${viewMode === 'tabs' ? 'bg-[#333537] text-[#E3E3E3]' : 'text-[#C4C7C5] hover:text-white'}`}><AppWindow size={14} /></button>
          <button onClick={() => setViewMode('grid')} className={`p-1.5 rounded-md transition-all ${viewMode === 'grid' ? 'bg-[#333537] text-[#E3E3E3]' : 'text-[#C4C7C5] hover:text-white'}`}><LayoutGrid size={14} /></button>
        </div>
      </div>

      {viewMode === 'tabs' ? (
        <div className="bg-[#1E1F20] rounded-2xl border border-white/5 overflow-hidden flex flex-col">
          <div className="flex overflow-x-auto hide-scrollbar border-b border-white/5 bg-[#131314]/50">
            {comparisons.map((comp) => {
              const isActive = activeTab === comp.modelName;
              return (
                <button key={comp.modelName} onClick={() => setActiveTab(comp.modelName)} className={`flex items-center gap-2 px-5 py-3.5 text-[13px] font-medium whitespace-nowrap transition-all border-b-2 ${isActive ? 'border-[#8AB4F8] text-[#8AB4F8] bg-[#8AB4F8]/5' : 'border-transparent text-[#C4C7C5] hover:text-white hover:bg-white/5'}`}>
                  <ModelVector id={getIconIdFromName(comp.modelName)} size={14} />{comp.modelName}
                </button>
              )
            })}
          </div>
          {activeData && (
            <div className="relative flex flex-col min-h-[400px]">
              <div className="flex-1 p-6 overflow-y-auto custom-scrollbar">
                {activeData.content.trim().startsWith('{') ? <ClinicalCard rawResponse={activeData.content} /> : <div className="prose prose-invert prose-sm max-w-none text-[#E3E3E3]"><ReactMarkdown>{activeData.content}</ReactMarkdown></div>}
              </div>
              <div className="px-6 py-3 border-t border-white/5 bg-[#131314]/30 flex items-center justify-between">
                <button onClick={() => handleCopy(activeData.modelName, activeData.content)} className="flex items-center gap-2 px-3 py-1.5 text-[12px] font-medium text-[#C4C7C5] hover:text-white hover:bg-white/5 rounded-lg transition-colors">
                  {copiedId === activeData.modelName ? <CheckCheck size={14} className="text-emerald-400" /> : <Copy size={14} />} {copiedId === activeData.modelName ? 'Copied' : 'Copy Text'}
                </button>
                <button onClick={() => onSelectWinner(messageId, activeData)} className="flex items-center gap-2 text-[12px] font-bold text-[#131314] bg-[#8AB4F8] px-5 py-2 rounded-full hover:bg-[#9EBEFA] transition-colors">
                  <Check size={14} /> Adopt Diagnosis
                </button>
              </div>
            </div>
          )}
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 w-full">
          {comparisons.map((comp) => (
            <div key={comp.modelName} className="bg-[#1E1F20] rounded-2xl flex flex-col overflow-hidden border border-white/5 transition-all hover:border-white/10 shadow-sm">
              <div className="px-5 py-3.5 border-b border-white/5 flex justify-between items-center bg-[#131314]/50">
                <span className="font-medium text-[13px] text-[#E3E3E3] flex items-center gap-2.5"><ModelVector id={getIconIdFromName(comp.modelName)} size={14} />{comp.modelName}</span>
                <button onClick={() => onSelectWinner(messageId, comp)} className="text-[11px] font-bold text-[#131314] bg-[#8AB4F8] px-3 py-1.5 rounded-full hover:bg-[#9EBEFA] transition-colors">Select</button>
              </div>
              <div className="p-5 overflow-y-auto h-[400px] custom-scrollbar relative group/copy">
                <button onClick={() => handleCopy(comp.modelName, comp.content)} className="absolute top-2 right-2 p-1.5 bg-[#131314] border border-white/10 rounded-md opacity-0 group-hover/copy:opacity-100 transition-opacity hover:bg-[#282A2C] z-10">
                  {copiedId === comp.modelName ? <CheckCheck size={14} className="text-emerald-400" /> : <Copy size={14} className="text-[#C4C7C5]" />}
                </button>
                {comp.content.trim().startsWith('{') ? <ClinicalCard rawResponse={comp.content} /> : <div className="prose prose-invert prose-sm max-w-none text-[#E3E3E3]"><ReactMarkdown>{comp.content}</ReactMarkdown></div>}
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
};


export default function App() {
  const [userRole, setUserRole] = useState<'doctor' | 'student' | 'patient'>('doctor'); 
  const [isRoleMenuOpen, setIsRoleMenuOpen] = useState(false);
  const [isModelMenuOpen, setIsModelMenuOpen] = useState(false);
  
  const roleMenuRef = useRef<HTMLDivElement>(null);
  const modelMenuRef = useRef<HTMLDivElement>(null);
  
  useOnClickOutside(roleMenuRef, () => setIsRoleMenuOpen(false));
  useOnClickOutside(modelMenuRef, () => setIsModelMenuOpen(false));

  const [patients, setPatients] = useState<Patient[]>(() => {
    try {
      const saved = localStorage.getItem('ayulex_patients');
      return saved ? JSON.parse(saved) : [];
    } catch (e) {
      return [];
    }
  });
  const [activePatientId, setActivePatientId] = useState<string | null>(null);

  const [input, setInput] = useState('');
  const [provider, setProvider] = useState<ModelProvider>('groq');
  const [isLoading, setIsLoading] = useState(false);
  const [isSidebarOpen, setIsSidebarOpen] = useState(true);

  const [copiedId, setCopiedId] = useState<string | null>(null);
  const [feedbackState, setFeedbackState] = useState<Record<string, 'up' | 'down' | null>>({});

  const [attachedFile, setAttachedFile] = useState<{ name: string; content: string } | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const textareaRef = useRef<HTMLTextAreaElement>(null);

  const activePatient = patients.find(p => p.id === activePatientId);
  const messages = activePatient ? activePatient.messages : [];

  useEffect(() => {
    if (activePatientId && textareaRef.current) {
      textareaRef.current.focus();
    }
  }, [activePatientId]);

  useEffect(() => {
    const handleResize = () => {
      if (window.innerWidth < 768) {
        setIsSidebarOpen(false);
      } else {
        setIsSidebarOpen(true);
      }
    };
    handleResize(); 
    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, []);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  useEffect(() => {
    localStorage.setItem('ayulex_patients', JSON.stringify(patients));
  }, [patients]);

  const handleNewPatient = () => {
    const newId = `MRN-${Math.floor(100000 + Math.random() * 900000)}`;
    const newPatient: Patient = {
      id: Date.now().toString(),
      displayId: newId,
      lastUpdated: Date.now(),
      messages: []
    };
    setPatients(prev => [newPatient, ...prev]);
    setActivePatientId(newPatient.id);
    if (window.innerWidth < 768) setIsSidebarOpen(false); 
  };

  const updateActivePatientMessages = (updater: (prevMsgs: Message[]) => Message[]) => {
    if (!activePatientId) return;
    setPatients(prev => prev.map(p => {
      if (p.id === activePatientId) {
        return { ...p, messages: updater(p.messages), lastUpdated: Date.now() };
      }
      return p;
    }).sort((a, b) => b.lastUpdated - a.lastUpdated)); 
  };

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
      if (event.target?.result) setAttachedFile({ name: file.name, content: event.target.result as string });
    };
    reader.readAsText(file);
    e.target.value = '';
  };

  const handleSelectWinner = (messageId: string, winner: ModelResponse) => {
    updateActivePatientMessages(prev => prev.map(msg => msg.id === messageId ? {
      ...msg,
      text: `**Adopted Diagnosis: ${winner.modelName}**\n\n${winner.content}`,
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
    setFeedbackState(prev => ({ ...prev, [id]: prev[id] === type ? null : type }));
  };

  const handleRegenerate = async () => {
    const lastUserMsg = [...messages].reverse().find(m => m.sender === 'user');
    if (!lastUserMsg || isLoading) return;

    updateActivePatientMessages(prev => prev.slice(0, -1));
    await sendPromptToBackend(lastUserMsg.text, provider, userRole);
  };

  const sendPromptToBackend = async (promptText: string, currentProvider: ModelProvider, role: string) => {
    setIsLoading(true);
    try {
      if (currentProvider === 'compare') {
        const data = await fetchModelComparison(promptText, role); 
        updateActivePatientMessages(prev => [...prev, {
          id: Date.now().toString(),
          text: "Multi-model evaluation complete. Explore the tabs below, or view the AI Judge's verdict at the bottom.",
          sender: 'bot',
          provider: 'compare',
          comparisons: data.answers,
          evaluations: data.evaluation
        }]);
      } else {
        const data = await sendMessageToAI(promptText, currentProvider as any, role);
        updateActivePatientMessages(prev => [...prev, {
          id: Date.now().toString(),
          text: data.reply,
          sender: 'bot',
          provider: currentProvider
        }]);
      }
    } catch (error) {
      updateActivePatientMessages(prev => [...prev, { 
        id: Date.now().toString(), 
        text: "System connection failed. Please retry.", 
        sender: 'bot', 
        provider: currentProvider 
      }]);
    } finally {
      setIsLoading(false);
    }
  };

  const handleSend = async (e?: React.FormEvent) => {
    e?.preventDefault();
    if ((!input.trim() && !attachedFile) || isLoading || !activePatientId) return;

    let longitudinalContext = "";
    if (activePatient && activePatient.messages.length > 0) {
      const priorHistory = activePatient.messages
        .filter(m => m.sender === 'user')
        .map(m => `- Past Log: ${m.text}`)
        .join('\n');
      if (priorHistory) {
        longitudinalContext = `[LONGITUDINAL EMR CONTEXT]\nThis is an ongoing patient chart. The patient's historical symptoms are:\n${priorHistory}\n\n`;
      }
    }

    const currentSymptoms = attachedFile
      ? `[Context File: ${attachedFile.name}]\n\n${attachedFile.content}\n\n[NEW PRESENTATION]: ${input}`
      : `[NEW PRESENTATION]: ${input}`;

    const finalPrompt = `${longitudinalContext}${currentSymptoms}`;

    const userMsg: Message = { id: Date.now().toString(), text: input.trim() || `Attached: ${attachedFile?.name}`, sender: 'user', fileName: attachedFile?.name };
    updateActivePatientMessages(prev => [...prev, userMsg]);
    setInput('');
    setAttachedFile(null);

    await sendPromptToBackend(finalPrompt, provider, userRole);
  };

  const getProviderName = (id: string) => {
    if (id === 'groq') return 'Llama 3.3 70B';
    if (id === 'qwen3') return 'Qwen 2.5 72B';
    if (id === 'llama8b') return 'Llama 3.1 8B';
    if (id === 'mistral') return 'Mistral AI';
    if (id === 'deepseek') return 'DeepSeek R1';
    if (id === 'gemini') return 'Google Gemini';
    if (id === 'compare') return 'Diagnostic Consensus';
    return 'Unknown Model';
  };

  const ALL_PROVIDERS = ['compare', 'groq', 'gemini', 'deepseek', 'qwen3', 'mistral', 'llama8b'];

  const ROLE_CONFIG = {
    doctor: { label: 'Clinical Mode', icon: <Stethoscope size={15} /> },
    student: { label: 'Student Mode', icon: <GraduationCap size={15} /> },
    patient: { label: 'Patient Mode', icon: <User size={15} /> },
  };

  return (
    <div className="flex h-screen bg-[#131314] text-[#E3E3E3] font-sans antialiased selection:bg-white/10 overflow-hidden">

      {/* 📱 Mobile Backdrop Overlay */}
      {isSidebarOpen && (
        <div 
          className="fixed inset-0 bg-black/60 backdrop-blur-sm z-40 md:hidden animate-in fade-in duration-300"
          onClick={() => setIsSidebarOpen(false)}
        />
      )}

      {/* 📁 SIDEBAR - GEMINI STYLE */}
      <aside 
        className={`fixed md:relative z-50 h-full transition-all duration-300 ease-[cubic-bezier(0.4,0,0.2,1)] overflow-hidden bg-[#1E1F20] ${isSidebarOpen ? 'w-[280px] translate-x-0' : 'w-0 -translate-x-full md:translate-x-0'}`}
      >
        <div className="w-[280px] flex flex-col h-full">

          <div className="h-[60px] flex items-center justify-between px-4">
            <span className="font-medium text-[16px] text-[#E3E3E3] flex items-center gap-3 tracking-wide pl-2">
              <img src={ayulexLogo} alt="Ayulex" className="w-5 h-5 object-contain" />
              Ayulex
            </span>
          </div>

          <div className="px-3 pt-2">
            <button onClick={handleNewPatient} className="flex items-center gap-3 px-4 py-3 text-[14px] font-medium text-[#E3E3E3] bg-[#131314] hover:bg-[#333537] rounded-full transition-all border border-transparent hover:border-white/5">
              <Plus size={18} className="text-[#C4C7C5]" /> New Medical Record
            </button>
          </div>

          <div className="flex-1 overflow-y-auto px-3 pb-4 custom-scrollbar mt-6">
            <p className="text-[12px] font-medium text-[#C4C7C5] px-4 py-1 mb-2">Recent Charts</p>
            {patients.map(patient => (
              <div 
                key={patient.id} 
                onClick={() => {
                  setActivePatientId(patient.id);
                  if (window.innerWidth < 768) setIsSidebarOpen(false);
                }} 
                className={`w-full group flex items-center justify-between px-4 py-2.5 rounded-full cursor-pointer transition-colors ${activePatientId === patient.id ? 'bg-[#333537] text-[#E3E3E3]' : 'text-[#E3E3E3] hover:bg-[#333537]/50'}`}
              >
                <div className="flex items-center gap-3 overflow-hidden">
                  <MessageSquare size={16} className="text-[#C4C7C5] shrink-0" />
                  <span className="text-[14px] font-medium tracking-wide truncate">{patient.displayId}</span>
                </div>
                <button onClick={(e) => { e.stopPropagation(); setPatients(prev => prev.filter(p => p.id !== patient.id)); if (activePatientId === patient.id) setActivePatientId(null); }} className="opacity-0 group-hover:opacity-100 p-1.5 hover:text-white rounded-md transition-all shrink-0"><Trash2 size={14} /></button>
              </div>
            ))}
          </div>

          <div className="p-3 mt-auto">
            <SignedOut>
              <SignInButton mode="modal">
                <button className="w-full py-3 bg-white text-black text-[14px] font-medium rounded-full transition-all hover:bg-gray-200">Sign In</button>
              </SignInButton>
            </SignedOut>
            <SignedIn>
              <div className="flex items-center gap-3 p-3 hover:bg-[#333537] rounded-2xl transition-colors cursor-pointer border border-transparent">
                <UserButton appearance={{ elements: { userButtonAvatarBox: "w-8 h-8 rounded-full border border-white/10", userButtonPopoverCard: "bg-[#1E1F20] border border-white/10 text-[#E3E3E3]"} }} />
                <div className="flex flex-col min-w-0">
                  <span className="text-[14px] font-medium text-[#E3E3E3] truncate"><UserGreeting /></span>
                  <span className="text-[12px] text-[#C4C7C5]">Clinical Access</span>
                </div>
              </div>
            </SignedIn>
          </div>
        </div>
      </aside>

      <main className="flex-1 flex flex-col h-full relative min-w-0 bg-[#131314]">
        
        {/* 🏥 TOP HEADER - GEMINI STYLE */}
        <header className="h-[60px] flex items-center px-4 z-10 w-full sticky top-0 bg-[#131314] text-[#E3E3E3]">
          
          <button 
            onClick={() => setIsSidebarOpen(!isSidebarOpen)} 
            className="p-2.5 mr-2 text-[#C4C7C5] hover:text-[#E3E3E3] hover:bg-[#1E1F20] rounded-full transition-colors"
          >
            <Menu size={22} />
          </button>

          {activePatient && (
            <div className="hidden sm:flex items-center gap-2 px-3 py-1 bg-[#1E1F20] rounded-full border border-white/5">
               <span className="text-[14px] font-medium text-[#E3E3E3]">{activePatient.displayId}</span>
            </div>
          )}

          {/* MODEL SELECTOR */}
          <div className="relative ml-auto" ref={modelMenuRef}>
            <button onClick={() => setIsModelMenuOpen(!isModelMenuOpen)} className="flex items-center gap-2 px-3 py-2 rounded-lg hover:bg-[#1E1F20] text-[14px] font-medium text-[#E3E3E3] transition-colors">
              {getProviderName(provider)} <ChevronDown size={16} className="text-[#C4C7C5]" />
            </button>
            {isModelMenuOpen && (
              <div className="absolute top-full right-0 mt-2 w-56 sm:w-64 bg-[#1E1F20] border border-white/5 rounded-2xl shadow-2xl py-2 z-50 animate-in fade-in zoom-in duration-150">
                {ALL_PROVIDERS.map((p) => (
                  <button key={p} onClick={() => { setProvider(p as ModelProvider); setIsModelMenuOpen(false); }} className={`w-full text-left px-4 py-2.5 text-[14px] flex items-center justify-between hover:bg-[#333537] transition-colors ${p === 'compare' ? 'border-b border-white/5 mb-1 pb-3' : ''}`}>
                    <span className="flex items-center gap-3 font-medium text-[#E3E3E3]"><ModelVector id={p} size={16} /> {getProviderName(p)}</span>
                    {provider === p && <Check size={16} className="text-white" />}
                  </button>
                ))}
              </div>
            )}
          </div>

          {/* CUSTOM ROLE SELECTOR */}
          <div className="relative ml-1" ref={roleMenuRef}>
            <button 
              onClick={() => setIsRoleMenuOpen(!isRoleMenuOpen)} 
              className="flex items-center gap-2 px-3 py-2 rounded-lg hover:bg-[#1E1F20] text-[14px] font-medium text-[#E3E3E3] transition-colors"
            >
              <span className="text-[#C4C7C5]">{ROLE_CONFIG[userRole].icon}</span>
              <span className="hidden sm:inline">{ROLE_CONFIG[userRole].label}</span>
              <ChevronDown size={16} className="text-[#C4C7C5]" />
            </button>
            {isRoleMenuOpen && (
              <div className="absolute top-full right-0 mt-2 w-48 bg-[#1E1F20] border border-white/5 rounded-2xl shadow-2xl py-2 z-50 animate-in fade-in zoom-in duration-150">
                {(Object.keys(ROLE_CONFIG) as Array<keyof typeof ROLE_CONFIG>).map((roleKey) => (
                  <button key={roleKey} onClick={() => { setUserRole(roleKey as any); setIsRoleMenuOpen(false); }} className="w-full text-left px-4 py-2.5 text-[14px] flex items-center justify-between hover:bg-[#333537] transition-colors">
                    <span className="flex items-center gap-3 font-medium text-[#E3E3E3]"><span className="text-[#C4C7C5]">{ROLE_CONFIG[roleKey as keyof typeof ROLE_CONFIG].icon}</span> {ROLE_CONFIG[roleKey as keyof typeof ROLE_CONFIG].label}</span>
                    {userRole === roleKey && <Check size={16} className="text-white" />}
                  </button>
                ))}
              </div>
            )}
          </div>
        </header>

        <div className="flex-1 overflow-y-auto w-full flex flex-col items-center">
          
          {!activePatientId ? (
            <div className="h-full flex flex-col items-center justify-center px-6 w-full max-w-[768px] pb-20">
              <img src={ayulexLogo} alt="Ayulex" className="w-14 h-14 object-contain mb-6 opacity-90" />
              <h2 className="text-[28px] font-medium text-[#E3E3E3] tracking-tight text-center">Ayulex Clinical Workspace</h2>
              <p className="text-[#C4C7C5] mt-2 text-[15px] text-center max-w-md leading-relaxed">
                Initialize a new Medical Record or select an existing chart from the directory to begin diagnosis.
              </p>
              <button onClick={handleNewPatient} className="mt-8 px-6 py-3 bg-[#1E1F20] hover:bg-[#333537] text-[#E3E3E3] rounded-full font-medium flex items-center gap-2 transition-all border border-white/5 hover:border-white/10">
                <Plus size={18} className="text-[#C4C7C5]"/> Initialize Record
              </button>
            </div>
          ) : 
          messages.length === 0 ? (
            <div className="h-full flex flex-col items-center justify-center px-6 w-full max-w-[768px] pb-20 animate-in fade-in duration-500">
              <h2 className="text-[28px] font-medium text-[#E3E3E3] tracking-tight text-center">Ready for Assessment</h2>
              <p className="text-[#C4C7C5] mt-2 text-[15px] max-w-md text-center leading-relaxed">
                Log the patient's presentation below. Ayulex retains this context for the entirety of their chart history.
              </p>
            </div>
          ) : (
            <div className="w-full max-w-3xl px-4 sm:px-6 py-6 flex flex-col gap-8">
              {messages.map((msg, index) => {
                const isLastMsg = index === messages.length - 1;
                return (
                  <div key={msg.id} className={`flex w-full ${msg.sender === 'user' ? 'justify-end' : 'justify-start'}`}>
                    {msg.sender === 'user' ? (
                      <div className="flex flex-col items-end gap-2 max-w-[85%] sm:max-w-[75%]">
                        {msg.fileName && <div className="flex items-center gap-2 px-3 py-1.5 bg-[#1E1F20] rounded-lg text-[12px] text-[#C4C7C5] border border-white/5"><FileText size={14} className="text-white" /> {msg.fileName}</div>}
                        <div className="bg-[#1E1F20] px-6 py-3.5 rounded-3xl text-[#E3E3E3] text-[15px] sm:text-[16px] leading-relaxed break-words border border-white/5">{msg.text}</div>
                      </div>
                    ) : (
                      <div className="flex gap-4 sm:gap-5 w-full group">
                        <div className="w-8 h-8 flex items-center justify-center shrink-0 rounded-full border border-white/5 bg-[#1E1F20] mt-1 shadow-sm">
                          <img src={ayulexLogo} alt="Ayulex" className="w-4 h-4 object-contain" />
                        </div>

                        <div className="w-full min-w-0">
                          {msg.text && (
                            <div className="w-full pt-1">
                              {msg.text.trim().startsWith('{') ? <div className="w-full"><ClinicalCard rawResponse={msg.text} /></div> : <div className="prose prose-invert max-w-none text-[15px] sm:text-[16px] text-[#E3E3E3] leading-[1.7]"><ReactMarkdown>{msg.text}</ReactMarkdown></div>}
                            </div>
                          )}

                          <div className="flex items-center gap-1 mt-4 text-[#C4C7C5] sm:opacity-0 group-hover:opacity-100 transition-opacity">
                            <button onClick={() => handleCopy(msg.id, msg.text)} className="p-1.5 hover:text-white hover:bg-[#1E1F20] rounded-full transition-colors">{copiedId === msg.id ? <CheckCheck size={16} className="text-emerald-400" /> : <Copy size={16} />}</button>
                            {isLastMsg && !msg.comparisons && <button onClick={handleRegenerate} disabled={isLoading} className="p-1.5 hover:text-white hover:bg-[#1E1F20] rounded-full transition-colors"><RotateCw size={16} className={isLoading ? "animate-spin" : ""} /></button>}
                            <button onClick={() => handleFeedback(msg.id, 'up')} className={`p-1.5 ml-2 rounded-full transition-colors ${feedbackState[msg.id] === 'up' ? 'text-emerald-400 bg-[#1E1F20]' : 'hover:text-white hover:bg-[#1E1F20]'}`}><ThumbsUp size={16} /></button>
                            <button onClick={() => handleFeedback(msg.id, 'down')} className={`p-1.5 rounded-full transition-colors ${feedbackState[msg.id] === 'down' ? 'text-rose-400 bg-[#1E1F20]' : 'hover:text-white hover:bg-[#1E1F20]'}`}><ThumbsDown size={16} /></button>
                          </div>

                          {msg.comparisons && <ComparisonViewer comparisons={msg.comparisons} messageId={msg.id} onSelectWinner={handleSelectWinner} />}
                          {msg.evaluations && <div className="mt-8 w-full"><JudgeTable evaluations={msg.evaluations} /></div>}
                        </div>
                      </div>
                    )}
                  </div>
                );
              })}
              
              {isLoading && (
                <div className="flex w-full justify-start mt-2">
                  <div className="flex gap-4 sm:gap-5 w-full">
                    <div className="w-8 h-8 flex items-center justify-center shrink-0 rounded-full border border-white/5 bg-[#1E1F20] mt-1 relative overflow-hidden">
                      <div className="absolute inset-0 bg-white/5 animate-pulse"></div>
                      <img src={ayulexLogo} alt="Ayulex" className="w-4 h-4 object-contain animate-pulse" />
                    </div>
                    <div className="bg-transparent py-1 flex flex-col justify-center">
                      <div className="flex items-center gap-3">
                        <span className="text-[14px] font-medium text-[#E3E3E3]">Processing clinical data</span>
                        <div className="flex gap-1.5 mt-0.5">
                          <div className="w-1.5 h-1.5 rounded-full bg-[#E3E3E3] animate-bounce" style={{ animationDelay: '0ms' }}></div>
                          <div className="w-1.5 h-1.5 rounded-full bg-[#E3E3E3] animate-bounce" style={{ animationDelay: '150ms' }}></div>
                          <div className="w-1.5 h-1.5 rounded-full bg-[#E3E3E3] animate-bounce" style={{ animationDelay: '300ms' }}></div>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              )}
              <div ref={messagesEndRef} className="h-56 md:h-64 shrink-0 w-full" />
            </div>
          )}
        </div>

        {/* ⌨️ GEMINI-STYLE FLOATING INPUT */}
        <div className="absolute bottom-0 left-0 w-full bg-gradient-to-t from-[#131314] via-[#131314] to-transparent pt-12 pb-6 px-4 sm:px-8 pointer-events-none">
          <div className="max-w-3xl mx-auto relative pointer-events-auto">
            <div className={`relative flex flex-col w-full bg-[#1E1F20] rounded-[24px] transition-all ${activePatientId ? 'opacity-100 border border-white/10 focus-within:border-white/20' : 'opacity-50 border border-transparent'}`}>
              {attachedFile && (
                <div className="px-4 pt-4">
                  <div className="inline-flex items-center gap-2 px-3 py-1.5 bg-[#131314] rounded-lg text-[13px] text-[#E3E3E3] border border-white/5">
                    <FileText size={14} className="text-white" />
                    <span className="max-w-[150px] truncate">{attachedFile.name}</span>
                    <button onClick={() => setAttachedFile(null)} className="ml-1 p-0.5 hover:bg-[#333537] rounded-md transition-colors"><X size={14} /></button>
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
                placeholder={activePatientId ? `Enter clinical notes...` : "Select a chart to begin..."}
                className="w-full max-h-[200px] min-h-[60px] bg-transparent border-0 resize-none outline-none text-[15px] sm:text-[16px] py-[18px] pl-6 pr-16 text-[#E3E3E3] placeholder:text-[#C4C7C5] custom-scrollbar"
                rows={1} disabled={isLoading || !activePatientId}
              />
              <div className="absolute right-3 bottom-3 flex items-center gap-2">
                <input type="file" ref={fileInputRef} onChange={handleFileUpload} className="hidden" accept=".txt,.js,.py,.md,.json,.ts,.csv,.html,.css" disabled={!activePatientId} />
                <button onClick={() => fileInputRef.current?.click()} className="p-2 text-[#C4C7C5] hover:text-[#E3E3E3] hover:bg-[#333537] rounded-full transition-colors" disabled={!activePatientId}><Paperclip size={20} /></button>
                <button onClick={() => handleSend()} disabled={isLoading || (!input.trim() && !attachedFile) || !activePatientId} className={`w-10 h-10 rounded-full flex items-center justify-center transition-all ${input.trim() || attachedFile ? 'bg-white text-black hover:bg-gray-200 shadow-md' : 'bg-[#131314] text-[#64748B]'}`}>
                  {isLoading ? <StopCircle size={20} /> : <ArrowUp size={22} strokeWidth={2.5} />}
                </button>
              </div>
            </div>
            <p className="text-center text-[11px] text-[#5F6368] mt-3 tracking-wide pointer-events-auto">Ayulex can make mistakes. Verify important information.</p>
          </div>
        </div>
      </main>
    </div>
  );
}