import React, { useState, useEffect, useCallback, useMemo, useRef } from 'react';
import { ThemeType, Message, ChatSession, AppSettings } from './types.ts';
import { OllamaService } from './services/ollamaService.ts';
import { McpService } from './services/mcpService.ts';
import Sidebar from './components/Sidebar.tsx';
import ChatWindow from './components/ChatWindow.tsx';
import McpTerminal from './components/McpTerminal.tsx';
import SettingsModal from './components/SettingsModal.tsx';
import { DEFAULT_OLLAMA_URL, DEFAULT_MODEL, AI_NAME } from './constants.tsx';

const App: React.FC = () => {
  const [settings, setSettings] = useState<AppSettings>(() => {
    const saved = localStorage.getItem('karawan_settings_v15_final');
    if (saved) return JSON.parse(saved);
    return {
      ollamaUrl: DEFAULT_OLLAMA_URL,
      selectedModel: DEFAULT_MODEL,
      voiceId: '',
      voicePitch: 1.0,
      voiceRate: 1.1,
      fontSize: 16,
      sidebarFontSize: 15,
      bubblePadding: 16,
      bubbleStyle: 'rounded',
      inputHeight: 64,
      inputBgColor: '#111111',
      inputBorderColor: 'rgba(255,255,255,0.05)',
      inputTextColor: '#ffffff',
      autoSpeak: false,
      continuousMic: false,
      voiceSkipCode: true,
      waitForFinish: true,
      theme: ThemeType.VOID,
      accentColor: '#00e5ff',
      userBubbleColor: '#ffffff',
      aiBubbleColor: '#111111',
      chatBgColor: '#050505',
      language: 'en',
      thinkingEnabled: false,
      fetchLocalModels: true,
      mcpEnabled: true,
      mcpRootPath: '/',
      mcpBackendUrl: 'http://localhost:3001',
      sharedPaths: [],
      aboutText: "Karawan AI Interface\nVersion Beta\nMCP System Integrated\nAI Architect Version v15",
      promptPreset: 'mcp',
      customSystemPrompt: '',
      arabicFontFamily: 'Cairo'
    };
  });

  const [sessions, setSessions] = useState<ChatSession[]>([]);
  const [activeSessionId, setActiveSessionId] = useState<string | null>(null);
  const [chatInput, setChatInput] = useState('');
  const [editingMessageId, setEditingMessageId] = useState<string | null>(null);
  const [mcpAlwaysAllow, setMcpAlwaysAllow] = useState(false);
  
  const [isSidebarCollapsed, setIsSidebarCollapsed] = useState(window.innerWidth < 1024);
  const [isRightSidebarOpen, setIsRightSidebarOpen] = useState(false);
  const [isGenerating, setIsGenerating] = useState(false);
  const [isSettingsOpen, setIsSettingsOpen] = useState(false);
  const [mcpHealth, setMcpHealth] = useState(false);
  const [speakingId, setSpeakingId] = useState<string | null>(null);
  const [shouldAutoListen, setShouldAutoListen] = useState(false);

  const abortControllerRef = useRef<AbortController | null>(null);
  const spokenTextRef = useRef<string>('');
  const fullResponseRef = useRef('');

  const stopGeneration = useCallback(() => {
    if (abortControllerRef.current) {
      abortControllerRef.current.abort();
    }
    setIsGenerating(false);
  }, []);
  
  const ollama = useMemo(() => new OllamaService(settings.ollamaUrl), [settings.ollamaUrl]);
  const mcp = useMemo(() => new McpService(settings.mcpBackendUrl), [settings.mcpBackendUrl]);

  const createNewSession = useCallback(() => {
    const newSession: ChatSession = {
      id: Date.now().toString(),
      title: settings.language === 'ar' ? 'تفاعل جديد' : 'New Interaction',
      messages: [],
      model: settings.selectedModel,
      createdAt: Date.now(),
    };
    setSessions(prev => {
      const updated = [newSession, ...prev];
      localStorage.setItem('karawan_sessions_v15_final', JSON.stringify(updated));
      return updated;
    });
    setActiveSessionId(newSession.id);
  }, [settings.language, settings.selectedModel]);

  useEffect(() => {
    const check = () => mcp.checkHealth().then(setMcpHealth);
    check();
    const timer = setInterval(check, 10000);
    return () => clearInterval(timer);
  }, [mcp]);

  useEffect(() => {
    localStorage.setItem('karawan_settings_v15_final', JSON.stringify(settings));
    const root = document.documentElement;
    root.style.setProperty('--accent', settings.accentColor);
    root.style.setProperty('--user-bubble', settings.userBubbleColor);
    root.style.setProperty('--ai-bubble', settings.aiBubbleColor);
    root.style.setProperty('--chat-bg', settings.chatBgColor);
    root.style.setProperty('--bg', settings.chatBgColor);
    root.style.setProperty('--font-size', `${settings.fontSize}px`);
    root.style.setProperty('--sidebar-font-size', `${settings.sidebarFontSize}px`);
    root.style.setProperty('--bubble-p', `${settings.bubblePadding}px`);
    root.style.setProperty('--input-h', `${settings.inputHeight}px`);
    root.style.setProperty('--input-bg', settings.inputBgColor);
    root.style.setProperty('--input-border', settings.inputBorderColor);
    root.style.setProperty('--input-text', settings.inputTextColor);
    root.style.setProperty('--arabic-font', `'${settings.arabicFontFamily}', sans-serif`);
    root.setAttribute('dir', settings.language === 'ar' ? 'rtl' : 'ltr');
  }, [settings]);

  useEffect(() => {
    const saved = localStorage.getItem('karawan_sessions_v15_final');
    if (saved) {
      const parsed = JSON.parse(saved);
      setSessions(parsed);
      if (parsed.length > 0) setActiveSessionId(parsed[0].id);
    } else {
      createNewSession();
    }
  }, [createNewSession]);

  const triggerContinuousListen = useCallback(() => {
    if (settings.continuousVoice && !isGenerating && !speakingId) {
      setTimeout(() => {
        setShouldAutoListen(true);
        setTimeout(() => setShouldAutoListen(false), 500);
      }, 300);
    }
  }, [settings.continuousVoice, isGenerating, speakingId]);

  const speakText = useCallback((text: string, id: string, stream: boolean = false) => {
    if (speakingId === id && !stream) {
      window.speechSynthesis.cancel();
      setSpeakingId(null);
      triggerContinuousListen();
      return;
    }

    const stripCodeBlocks = (str: string) => {
      if (settings.voiceSkipCode) {
        return str.replace(/```[\s\S]*?```/g, '').replace(/`.*?`/g, '').trim();
      }
      return str.trim();
    };

    if (stream) {
      const remaining = text.slice(spokenTextRef.current.length);
      const sentences = remaining.match(/[^.!?\n]+[.!?\n]+/g);
      
      if (sentences) {
        sentences.forEach(s => {
          const cleanText = stripCodeBlocks(s);
          if (!cleanText || cleanText.length < 1) {
             spokenTextRef.current += s;
             return;
          }
          const utterance = new SpeechSynthesisUtterance(cleanText);
          const voice = window.speechSynthesis.getVoices().find(v => v.voiceURI === settings.voiceId);
          if (voice) utterance.voice = voice;
          utterance.pitch = settings.voicePitch;
          utterance.rate = settings.voiceRate;
          utterance.lang = settings.language === 'ar' ? 'ar-SA' : 'en-US';
          utterance.onstart = () => setSpeakingId(id);
          utterance.onend = () => {
             if (!isGenerating && spokenTextRef.current.length >= fullResponseRef.current.length) {
                setSpeakingId(null);
                triggerContinuousListen();
             }
          };
          window.speechSynthesis.speak(utterance);
          spokenTextRef.current += s;
        });
      }
      return;
    }

    window.speechSynthesis.cancel();
    const cleanFullText = stripCodeBlocks(text);
    if (!cleanFullText) {
      triggerContinuousListen();
      return;
    }
    const utterance = new SpeechSynthesisUtterance(cleanFullText);
    const voice = window.speechSynthesis.getVoices().find(v => v.voiceURI === settings.voiceId);
    if (voice) utterance.voice = voice;
    utterance.pitch = settings.voicePitch;
    utterance.rate = settings.voiceRate;
    utterance.lang = settings.language === 'ar' ? 'ar-SA' : 'en-US';
    utterance.onstart = () => setSpeakingId(id);
    utterance.onend = () => {
      setSpeakingId(null);
      triggerContinuousListen();
    };
    window.speechSynthesis.speak(utterance);
  }, [settings, speakingId, triggerContinuousListen, isGenerating]);

  const handleSend = async (content: string, attachment?: { name: string, content: string }, resendId?: string) => {
    if (!activeSessionId || (!content.trim() && !attachment)) return;
    
    window.speechSynthesis.cancel();
    spokenTextRef.current = '';
    fullResponseRef.current = '';
    setIsGenerating(true);
    abortControllerRef.current = new AbortController();

    let updatedSessions = [...sessions];
    const sessionIndex = updatedSessions.findIndex(s => s.id === activeSessionId);
    
    if (resendId) {
      const msgIndex = updatedSessions[sessionIndex].messages.findIndex(m => m.id === resendId);
      if (msgIndex !== -1) {
        updatedSessions[sessionIndex].messages = updatedSessions[sessionIndex].messages.slice(0, msgIndex);
      }
    }

    let userContent = content.trim();
    if (attachment) {
      userContent = `Analyze this file content:\n\n[FILE: ${attachment.name}]\n\`\`\`\n${attachment.content}\n\`\`\`\n${userContent}`;
    }

    const userMsg: Message = { 
      id: Date.now().toString(), 
      role: 'user', 
      content: userContent, 
      timestamp: Date.now(),
      fileName: attachment?.name,
      fileSize: attachment ? `${(attachment.content.length / 1024).toFixed(1)} KB` : undefined,
      type: attachment ? 'file' : 'text'
    };

    updatedSessions[sessionIndex].messages.push(userMsg);
    
    if (updatedSessions[sessionIndex].messages.filter(m => m.role === 'user').length === 1) {
        updatedSessions[sessionIndex].title = content.slice(0, 30) + (content.length > 30 ? '...' : '');
    }

    setSessions(updatedSessions);
    localStorage.setItem('karawan_sessions_v15_final', JSON.stringify(updatedSessions));
    
    const assistantMsgId = (Date.now() + 1).toString();
    setSessions(prev => prev.map(s => s.id === activeSessionId ? { ...s, messages: [...s.messages, { id: assistantMsgId, role: 'assistant', content: '', thought: '', timestamp: Date.now() + 1 }] } : s));

    let fullResponse = '';
    let fullThought = '';
    const currentSession = updatedSessions[sessionIndex];
    const history = currentSession.messages;

    let systemPrompt = `You are Karawan, a high-performance AI Interface. Use technical terms. Analyze shared files automatically.`;
    if (settings.promptPreset === 'custom') {
      systemPrompt = settings.customSystemPrompt;
    }

    try {
      await ollama.generate(
        settings.selectedModel, 
        history, 
        (chunk, thoughtChunk) => {
            if (thoughtChunk) fullThought += thoughtChunk;
            if (chunk) fullResponse += chunk;
            
            fullResponseRef.current = fullResponse;
            setSessions(prev => prev.map(s => s.id === activeSessionId ? { 
              ...s, 
              messages: s.messages.map(m => m.id === assistantMsgId ? { 
                ...m, 
                content: fullResponse,
                thought: fullThought 
              } : m) 
            } : s));
            
            if (settings.autoSpeak && chunk) speakText(fullResponse, assistantMsgId, true);
        }, 
        abortControllerRef.current.signal, 
        systemPrompt,
        settings.thinkingEnabled ? 1000 : 0
      );
    } catch (e: any) {
      if (e.name === 'AbortError') return;
      console.error("Ollama generation failed:", e);
    } finally {
      setIsGenerating(false);
      setEditingMessageId(null);

      const mcpMatch = fullResponse.match(/MCP_RUN:\s*([^\n]+)/);
      if (mcpMatch && mcpMatch[1]) {
         triggerMcpCommand(mcpMatch[1].trim());
      }

      if (!settings.autoSpeak) {
        triggerContinuousListen();
      } else if (fullResponse.length <= spokenTextRef.current.length) {
        triggerContinuousListen();
      }
    }
  };

  const handleMcpPermission = async (id: string, command: string, allowed: boolean, always: boolean) => {
    if (always) setMcpAlwaysAllow(true);
    setSessions(prev => prev.map(s => s.id === activeSessionId ? { ...s, messages: s.messages.map(m => m.id === id ? { ...m, mcpStatus: allowed ? 'allowed' : 'denied' } : m) } : s));
    if (allowed) {
      const res = await mcp.runCommand(command);
      const output = res.output ? `[STDOUT] ${res.output}` : `[STDERR] ${res.error}`;
      handleSend(`Command result:\n\`\`\`\n${output}\n\`\`\``);
    }
  };

  const triggerMcpCommand = (command: string) => {
    if (mcpAlwaysAllow) {
      handleMcpPermission("perm-" + Date.now(), command, true, false);
      return;
    }
    const permId = "perm-" + Date.now();
    setSessions(prev => prev.map(s => s.id === activeSessionId ? { ...s, messages: [...s.messages, { id: permId, role: 'assistant', content: settings.language === 'ar' ? `مطلوب إذن لتنفيذ: \`${command}\`` : `Permission required for: \`${command}\``, type: 'mcp_permission', mcpCommand: command, mcpStatus: 'pending', timestamp: Date.now() }] } : s));
  };

  return (
    <div className="flex h-[100dvh] w-full overflow-hidden bg-[var(--bg)] relative">
      <Sidebar 
        width={280}
        sessions={sessions}
        activeId={activeSessionId}
        onSelect={setActiveSessionId}
        onNew={createNewSession}
        onDelete={(id) => setSessions(prev => prev.filter(s => s.id !== id))}
        onSettings={() => setIsSettingsOpen(true)}
        isCollapsed={isSidebarCollapsed}
        onToggleCollapse={() => setIsSidebarCollapsed(!isSidebarCollapsed)}
        mcpStatus={mcpHealth}
        language={settings.language}
        fontSize={settings.sidebarFontSize}
      />
      
      <main className="flex-1 flex flex-col min-w-0 bg-[var(--bg)] relative z-10 overflow-hidden h-full">
        <ChatWindow 
          session={sessions.find(s => s.id === activeSessionId)}
          onSend={(content, attachment) => handleSend(content, attachment, editingMessageId || undefined)}
          onStop={stopGeneration}
          isGenerating={isGenerating}
          mcpActive={mcpHealth}
          onMcpBrowser={() => setIsRightSidebarOpen(!isRightSidebarOpen)}
          onMcpCommand={() => {}}
          language={settings.language}
          speakingId={speakingId}
          onSpeak={speakText}
          settings={settings}
          onToggleSidebar={() => setIsSidebarCollapsed(!isSidebarCollapsed)}
          inputValue={chatInput}
          onInputChange={setChatInput}
          autoListenTrigger={shouldAutoListen}
          onAutoListenHandled={() => setShouldAutoListen(false)}
          onEditMessage={(id, content) => { 
            setChatInput(content); 
            setEditingMessageId(id); 
          }}
          editingMessageId={editingMessageId}
          onCancelEdit={() => {
            setChatInput('');
            setEditingMessageId(null);
          }}
          onMcpPermission={handleMcpPermission}
        />
      </main>

      <McpTerminal
        width={350}
        isOpen={isRightSidebarOpen}
        mcpService={mcp}
        mcpHealth={mcpHealth}
        onClose={() => setIsRightSidebarOpen(false)}
        onInject={(content, name) => {
          handleSend(settings.language === 'ar' ? `حلل محتويات الملف:\n\n[ملف: ${name}]\n\`\`\`\n${content}\n\`\`\`` : `Analyze this file content:\n\n[FILE: ${name}]\n\`\`\`\n${content}\n\`\`\``);
          setIsRightSidebarOpen(false);
        }}
      />

      {isSettingsOpen && (
        <SettingsModal 
          settings={settings}
          onSave={(newSettings) => { setSettings(newSettings); setIsSettingsOpen(false); }}
          onClose={() => setIsSettingsOpen(false)}
          onExport={() => {
            const data = { settings, sessions };
            const blob = new Blob([JSON.stringify(data)], { type: 'application/json' });
            const url = URL.createObjectURL(blob);
            const a = document.createElement('a'); a.href = url; a.download = 'karawan_backup.json'; a.click();
          }}
          onImport={(file) => {
            const reader = new FileReader();
            reader.onload = (e) => {
              try {
                const parsed = JSON.parse(e.target?.result as string);
                if (parsed.settings) setSettings(parsed.settings);
                if (parsed.sessions) setSessions(parsed.sessions);
                alert("Import successful.");
              } catch (err) { alert("Invalid backup."); }
            };
            reader.readAsText(file);
          }}
        />
      )}
    </div>
  );
};

export default App;