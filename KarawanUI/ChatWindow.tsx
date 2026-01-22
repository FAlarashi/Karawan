import React, { useState, useRef, useEffect } from 'react';
import { ChatSession, AppSettings, BubbleStyle } from '../types.ts';
import { BirdLogo, AI_NAME } from '../constants.tsx';
import { marked } from 'marked';

interface ChatWindowProps {
  session?: ChatSession;
  onSend: (content: string, attachment?: { name: string, content: string }) => void;
  onStop: () => void;
  isGenerating?: boolean;
  onMcpBrowser: () => void;
  onMcpCommand: () => void;
  onSpeak: (text: string, id: string) => void;
  mcpActive: boolean;
  speakingId: string | null;
  language: 'en' | 'ar';
  settings: AppSettings;
  onToggleSidebar?: () => void;
  inputValue: string;
  onInputChange: (val: string) => void;
  autoListenTrigger?: boolean;
  onAutoListenHandled?: () => void;
  onEditMessage?: (id: string, content: string) => void;
  editingMessageId?: string | null;
  onMcpPermission?: (id: string, command: string, allowed: boolean, always: boolean) => void;
}

const ChatWindow: React.FC<ChatWindowProps> = ({ 
  session, onSend, onStop, isGenerating, onMcpBrowser, onMcpCommand, onSpeak, mcpActive, speakingId, language, settings, onToggleSidebar, inputValue, onInputChange, autoListenTrigger, onAutoListenHandled, onEditMessage, editingMessageId, onMcpPermission
}) => {
  const [isListening, setIsListening] = useState(false);
  const [pendingFile, setPendingFile] = useState<{ name: string, content: string } | null>(null);
  const endRef = useRef<HTMLDivElement>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const recognitionRef = useRef<any>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const audioContextRef = useRef<AudioContext | null>(null);
  const analyserRef = useRef<AnalyserNode | null>(null);
  const animationFrameRef = useRef<number | null>(null);

  useEffect(() => {
    const SpeechRecognition = (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition;
    if (SpeechRecognition) {
      recognitionRef.current = new SpeechRecognition();
      recognitionRef.current.continuous = false;
      recognitionRef.current.onresult = (event: any) => {
        const text = event.results[0][0].transcript;
        if (text.trim()) onSend(text.trim());
        setIsListening(false);
      };
      recognitionRef.current.onend = () => setIsListening(false);
    }
  }, [onSend]);

  useEffect(() => {
    if (autoListenTrigger && !isListening && !isGenerating && !speakingId) {
      toggleMic();
      onAutoListenHandled?.();
    }
  }, [autoListenTrigger, isListening, isGenerating, speakingId]);

  useEffect(() => {
    if (endRef.current) endRef.current.scrollIntoView({ behavior: 'smooth' });
  }, [session?.messages, isGenerating]);

  // Audio Visualizer
  useEffect(() => {
    if (isListening && canvasRef.current) {
      const startVisualizer = async () => {
        try {
          const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
          audioContextRef.current = new (window.AudioContext || (window as any).webkitAudioContext)();
          analyserRef.current = audioContextRef.current.createAnalyser();
          const source = audioContextRef.current.createMediaStreamSource(stream);
          source.connect(analyserRef.current);
          analyserRef.current.fftSize = 64;
          const bufferLength = analyserRef.current.frequencyBinCount;
          const dataArray = new Uint8Array(bufferLength);

          const canvas = canvasRef.current!;
          const ctx = canvas.getContext('2d')!;

          const draw = () => {
            animationFrameRef.current = requestAnimationFrame(draw);
            analyserRef.current!.getByteFrequencyData(dataArray);
            ctx.clearRect(0, 0, canvas.width, canvas.height);
            const barWidth = (canvas.width / bufferLength) * 2.5;
            let x = 0;
            for (let i = 0; i < bufferLength; i++) {
              const barHeight = (dataArray[i] / 255) * canvas.height;
              ctx.fillStyle = settings.accentColor;
              ctx.fillRect(x, canvas.height - barHeight, barWidth, barHeight);
              x += barWidth + 1;
            }
          };
          draw();
        } catch (e) { console.error("Mic viz fail", e); }
      };
      startVisualizer();
    } else {
      if (animationFrameRef.current) cancelAnimationFrame(animationFrameRef.current);
      audioContextRef.current?.close();
    }
    return () => {
      if (animationFrameRef.current) cancelAnimationFrame(animationFrameRef.current);
      audioContextRef.current?.close();
    };
  }, [isListening, settings.accentColor]);

  const toggleMic = () => {
    if (settings.waitForFinish && speakingId) return; 
    if (isListening) { recognitionRef.current?.stop(); setIsListening(false); }
    else { setIsListening(true); recognitionRef.current?.start(); }
  };

  const handleSend = () => {
    if (isGenerating) { onStop(); return; }
    if (!inputValue.trim() && !pendingFile) return;
    onSend(inputValue, pendingFile || undefined);
    onInputChange('');
    setPendingFile(null);
  };

  const renderContent = (content: string) => {
    try {
      const html = marked.parse(content, { async: false, breaks: true, gfm: true }) as string;
      return <div className="prose prose-invert max-w-none leading-relaxed prose-li:my-0" dangerouslySetInnerHTML={{ __html: html }} />;
    } catch (e) { return <div className="leading-relaxed whitespace-pre-wrap">{content}</div>; }
  };

  if (!session) return (
    <div className={`flex-1 flex flex-col items-center justify-center p-12 text-center bg-[var(--bg)] relative ${language === 'ar' ? 'rtl' : 'ltr'}`}>
      <button onClick={onToggleSidebar} className={`z-[100] md:hidden absolute top-6 ${language === 'ar' ? 'right-6' : 'left-6'} text-zinc-400 bg-white/5 w-10 h-10 rounded-xl flex items-center justify-center border border-white/10`}>
        <i className="fa-solid fa-bars-staggered text-xl"></i>
      </button>
      <BirdLogo className="w-24 h-24 mb-6 opacity-10 text-[var(--accent)]" />
      <div className="text-zinc-700 font-black tracking-widest uppercase text-xs">{language === 'ar' ? 'بانتظار المدخلات...' : 'Waiting for AI Stream...'}</div>
    </div>
  );

  return (
    <div className={`flex-1 flex flex-col h-full relative overflow-hidden bg-[var(--bg)] ${language === 'ar' ? 'rtl' : 'ltr'}`}>
      <div className="flex items-center justify-between px-6 md:px-10 pt-4 border-b border-[var(--border)] z-50 bg-[var(--bg)]/95 backdrop-blur sticky top-0 h-20">
        <div className="flex items-center gap-4">
          <div className="flex items-center gap-3">
             <BirdLogo className="w-8 h-8 text-[var(--accent)]" />
             <div className="flex flex-col">
               <div className="flex items-center gap-2">
                 <span className="text-[0.75rem] font-black text-white uppercase tracking-widest">{AI_NAME}</span>
                 <span className="text-[0.55rem] font-bold text-[var(--accent)] uppercase">{language === 'ar' ? '(تجريبي)' : '(Beta)'}</span>
               </div>
               <span className="text-[0.5rem] font-bold text-zinc-700 uppercase">{language === 'ar' ? 'صنع في السعودية' : 'Made in Saudi'}</span>
             </div>
          </div>
          <span className={`hidden lg:block text-[0.6rem] font-bold text-zinc-600 uppercase tracking-widest truncate ${language === 'ar' ? 'mr-4 border-r pr-4' : 'ml-4 border-l pl-4'} border-white/5`}>{session.title}</span>
        </div>
        <div className="flex items-center gap-3">
           <button onClick={onMcpCommand} className="w-11 h-9 flex flex-col items-center justify-center text-zinc-500 hover:text-white transition-colors bg-white/5 rounded-xl border border-white/10 relative">
             <i className="fa-solid fa-terminal text-[0.9rem]"></i>
             <span className="text-[0.4rem] font-bold opacity-40 uppercase">{language === 'ar' ? 'تجريبي' : 'EXP'}</span>
           </button>
        </div>
      </div>

      <button onClick={onToggleSidebar} className={`md:hidden fixed top-24 ${language === 'ar' ? 'right-5' : 'left-5'} z-[55] w-10 h-10 rounded-xl bg-[var(--surface)] border border-[var(--border)] flex items-center justify-center text-zinc-400 shadow-2xl active:scale-90`}>
        <i className="fa-solid fa-bars-staggered text-base"></i>
      </button>

      <div className="flex-1 overflow-y-auto px-4 md:px-24 py-10 md:py-16 space-y-12 custom-scrollbar pb-80">
        {session.messages.map((m) => (
          <div key={m.id} className={`flex flex-col ${m.role === 'user' ? 'items-end' : 'items-start'} group`}>
            <div className={`flex items-center gap-3 mb-2 w-full ${m.role === 'user' ? 'justify-end' : 'justify-start'}`}>
              <span className={`text-[0.55rem] font-black uppercase tracking-[0.3em] ${m.role === 'user' ? 'text-zinc-700' : 'text-[var(--accent)]'}`}>
                {m.role === 'user' ? (language === 'ar' ? 'المشغل' : 'Operator') : AI_NAME}
              </span>
              {m.fileName && <span className="text-[0.5rem] font-black text-blue-500/50 uppercase">{language === 'ar' ? 'مرفق' : 'ATTACHED'}</span>}
              {m.role === 'assistant' && (
                <button onClick={() => onSpeak(m.content, m.id)} className={`p-1 transition-all rounded-lg w-8 h-8 ${speakingId === m.id ? 'bg-[#3b82f6] text-white shadow-lg' : 'opacity-0 group-hover:opacity-100 text-zinc-600 hover:text-white'}`}>
                  <i className={`fa-solid ${speakingId === m.id ? 'fa-square' : 'fa-volume-high'} text-xs`}></i>
                </button>
              )}
            </div>
            
            <div className="relative max-w-full md:max-w-[85%] space-y-3" style={{ padding: settings.bubblePadding, fontSize: settings.fontSize, backgroundColor: m.role === 'user' ? settings.userBubbleColor : settings.aiBubbleColor, color: m.role === 'user' ? '#000' : '#fff', borderRadius: '24px' }}>
              {m.type === 'mcp_permission' && m.mcpStatus === 'pending' ? (
                <div className="p-4 bg-black/40 rounded-2xl border border-[var(--accent)]/30 space-y-4">
                  <div className="text-[0.7rem] font-bold text-[var(--accent)] uppercase">{language === 'ar' ? 'طلب إذن نظام (تجريبي)' : 'System Permission Request (Exp)'}</div>
                  <div className="text-[0.65rem] font-mono text-zinc-400">CMD: {m.mcpCommand}</div>
                  <div className="flex gap-2 flex-wrap">
                    <button onClick={() => onMcpPermission?.(m.id, m.mcpCommand!, true, false)} className="px-4 py-2 bg-emerald-600 text-white rounded-lg text-[0.6rem] font-black uppercase">{language === 'ar' ? 'موافق' : 'Agree'}</button>
                    <button onClick={() => onMcpPermission?.(m.id, m.mcpCommand!, true, true)} className="px-4 py-2 border border-emerald-600 text-emerald-500 rounded-lg text-[0.6rem] font-black uppercase">{language === 'ar' ? 'السماح دائماً لهذه الجلسة' : 'Always Allow for this session'}</button>
                    <button onClick={() => onMcpPermission?.(m.id, m.mcpCommand!, false, false)} className="px-4 py-2 bg-red-600 text-white rounded-lg text-[0.6rem] font-black uppercase">{language === 'ar' ? 'رفض' : 'Disagree'}</button>
                  </div>
                </div>
              ) : (
                <>
                  {m.fileName && (
                    <div className="mb-2 p-2 bg-black/20 rounded-xl border border-white/5 flex items-center gap-2">
                       <i className="fa-solid fa-file-code text-blue-500/50"></i>
                       <span className="text-[0.6rem] font-bold truncate">{m.fileName} ({m.fileSize})</span>
                    </div>
                  )}
                  {m.role === 'assistant' ? renderContent(m.content) : <div className="leading-relaxed whitespace-pre-wrap">{m.content}</div>}
                </>
              )}
            </div>
          </div>
        ))}
        {isGenerating && <div className="p-6 bg-[var(--ai-bubble)] border border-[var(--border)] rounded-3xl w-max animate-pulse text-[var(--accent)]">...</div>}
        <div ref={endRef} className="h-24" />
      </div>

      <div className="absolute bottom-0 left-0 right-0 p-4 md:p-10 z-40 bg-gradient-to-t from-[var(--bg)] via-[var(--bg)]/98 to-transparent">
        <div className="max-w-4xl mx-auto">
          {isListening && (
            <div className="mb-4 h-12 bg-black/60 rounded-2xl border border-white/5 overflow-hidden">
               <canvas ref={canvasRef} width={800} height={48} className="w-full h-full opacity-60" />
            </div>
          )}
          
          <div className="relative border rounded-[2rem] overflow-hidden flex items-center" style={{ minHeight: `${settings.inputHeight}px`, backgroundColor: settings.inputBgColor, borderColor: settings.inputBorderColor }}>
            <button onClick={() => fileInputRef.current?.click()} className={`flex-shrink-0 h-11 w-11 ${language === 'ar' ? 'mr-4' : 'ml-4'} text-zinc-600 hover:text-[var(--accent)] flex items-center justify-center`}>
              <i className="fa-solid fa-paperclip text-[1.2rem]"></i>
              <input type="file" ref={fileInputRef} className="hidden" onChange={(e) => {
                 const f = e.target.files?.[0];
                 if (!f) return;
                 const reader = new FileReader();
                 reader.onload = (ev) => setPendingFile({ name: f.name, content: ev.target?.result as string });
                 reader.readAsText(f);
              }} />
            </button>
            <textarea value={inputValue} onChange={(e) => onInputChange(e.target.value)} onKeyDown={(e) => { if (e.key === 'Enter' && !e.shiftKey) { e.preventDefault(); handleSend(); } }} placeholder={language === 'ar' ? 'اسأل كروان...' : `Ask ${AI_NAME}...`} rows={1} style={{ color: settings.inputTextColor }} className="flex-1 bg-transparent px-4 py-5 text-[1rem] focus:outline-none resize-none" />
            <div className={`flex-shrink-0 ${language === 'ar' ? 'ml-5' : 'mr-5'} flex items-center gap-3`}>
              <button onClick={onMcpBrowser} className="hidden sm:flex flex-col w-11 h-11 rounded-xl text-zinc-600 hover:text-[var(--accent)] items-center justify-center border border-white/5 relative">
                <i className="fa-solid fa-microchip text-[1.1rem]"></i>
                <span className="text-[0.4rem] font-bold absolute -top-1 -right-1 opacity-40">{language === 'ar' ? 'تجريبي' : 'EXP'}</span>
              </button>
              <button onClick={toggleMic} className={`w-11 h-11 rounded-xl transition-all flex items-center justify-center border border-white/5 ${isListening ? 'bg-[var(--accent)] text-black shadow-[0_0_15px_var(--accent)]' : 'text-zinc-600 hover:text-[var(--accent)]'}`}><i className={`fa-solid ${isListening ? 'fa-stop' : 'fa-microphone'} text-[1.1rem]`}></i></button>
              <button onClick={handleSend} className={`w-11 h-11 rounded-2xl flex items-center justify-center ${isGenerating ? 'bg-red-500' : 'bg-[var(--accent)] text-black shadow-[0_0_10px_var(--accent)]'}`}><i className={`fa-solid ${isGenerating ? 'fa-square' : 'fa-arrow-up'} text-[1.1rem]`}></i></button>
            </div>
          </div>
          {pendingFile && (
            <div className="mt-3 flex items-center gap-2 p-2 bg-white/5 rounded-xl border border-white/10 animate-in slide-in-from-bottom-2">
              <i className="fa-solid fa-file-lines text-blue-500/50 ml-2"></i>
              <span className="text-[0.7rem] text-zinc-400 font-bold truncate flex-1">{pendingFile.name}</span>
              <button onClick={() => setPendingFile(null)} className="p-1 hover:text-red-500"><i className="fa-solid fa-xmark"></i></button>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default ChatWindow;
