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
  onCancelEdit?: () => void;
  onMcpPermission?: (id: string, command: string, allowed: boolean, always: boolean) => void;
}

const RandomCasingLoading: React.FC = () => {
  const [text, setText] = useState("Loading");
  useEffect(() => {
    const interval = setInterval(() => {
      const chars = "Loading".split("");
      const scrambled = chars.map(c => Math.random() > 0.5 ? c.toUpperCase() : c.toLowerCase()).join("");
      setText(scrambled);
    }, 150);
    return () => clearInterval(interval);
  }, []);
  return <>{text}</>;
};

const ChatWindow: React.FC<ChatWindowProps> = ({ 
  session, onSend, onStop, isGenerating, onMcpBrowser, onSpeak, mcpActive, speakingId, language, settings, onToggleSidebar, inputValue, onInputChange, autoListenTrigger, onAutoListenHandled, onEditMessage, editingMessageId, onCancelEdit, onMcpPermission
}) => {
  const [isListening, setIsListening] = useState(false);
  const [pendingFile, setPendingFile] = useState<{ name: string, content: string } | null>(null);
  const [showScrollTop, setShowScrollTop] = useState(false);
  const [showScrollBottom, setShowScrollBottom] = useState(false);
  
  const scrollContainerRef = useRef<HTMLDivElement>(null);
  const endRef = useRef<HTMLDivElement>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const recognitionRef = useRef<any>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const audioContextRef = useRef<AudioContext | null>(null);
  const analyserRef = useRef<AnalyserNode | null>(null);
  const animationFrameRef = useRef<number | null>(null);

  const isAr = language === 'ar';
  const hasInput = inputValue.trim().length > 0 || pendingFile !== null;

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

  const handleScroll = () => {
    if (!scrollContainerRef.current) return;
    const { scrollTop, scrollHeight, clientHeight } = scrollContainerRef.current;
    setShowScrollTop(scrollTop > 300);
    const isAtBottom = scrollHeight - scrollTop - clientHeight < 100;
    setShowScrollBottom(!isAtBottom && scrollHeight > clientHeight);
  };

  const scrollToTop = () => {
    scrollContainerRef.current?.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const scrollToBottom = () => {
    endRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

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
            if (analyserRef.current) {
              analyserRef.current.getByteFrequencyData(dataArray);
              ctx.clearRect(0, 0, canvas.width, canvas.height);
              const barWidth = (canvas.width / bufferLength) * 2.5;
              let x = 0;
              for (let i = 0; i < bufferLength; i++) {
                const barHeight = (dataArray[i] / 255) * canvas.height;
                ctx.fillStyle = settings.accentColor;
                ctx.fillRect(x, canvas.height - barHeight, barWidth, barHeight);
                x += barWidth + 1;
              }
            }
          };
          draw();
        } catch (e) { console.error("Mic viz fail", e); }
      };
      startVisualizer();
    } else {
      if (animationFrameRef.current) cancelAnimationFrame(animationFrameRef.current);
      if (audioContextRef.current && audioContextRef.current.state !== 'closed') {
        audioContextRef.current.close().catch(() => {});
      }
    }
    return () => {
      if (animationFrameRef.current) cancelAnimationFrame(animationFrameRef.current);
      if (audioContextRef.current && audioContextRef.current.state !== 'closed') {
        audioContextRef.current.close().catch(() => {});
      }
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
    <div className={`flex-1 flex flex-col items-center justify-center p-12 text-center bg-[var(--bg)] relative ${isAr ? 'rtl' : 'ltr'}`}>
      <button onClick={onToggleSidebar} className={`z-[100] md:hidden absolute top-6 ${isAr ? 'right-6' : 'left-6'} text-zinc-400 bg-white/5 w-10 h-10 rounded-xl flex items-center justify-center border border-white/10`}>
        <i className="fa-solid fa-bars-staggered text-xl"></i>
      </button>
      <BirdLogo className="w-24 h-24 mb-6 opacity-10 text-[var(--accent)]" />
      <div className="text-zinc-700 font-black tracking-widest uppercase text-xs">{isAr ? 'بانتظار المدخلات...' : 'Waiting for AI Stream...'}</div>
    </div>
  );

  return (
    <div className={`flex-1 flex flex-col h-full relative overflow-hidden bg-[var(--bg)] ${isAr ? 'rtl' : 'ltr'}`}>
      <div className="flex items-center justify-between px-6 md:px-10 pt-4 border-b border-[var(--border)] z-50 bg-[var(--bg)]/95 backdrop-blur sticky top-0 h-20">
        <div className="flex items-center gap-4">
          <div className="flex items-center gap-3">
             <BirdLogo className="w-8 h-8 text-[var(--accent)]" />
             <div className="flex flex-col">
               <div className="flex items-center gap-2">
                 <span className="text-[0.75rem] font-black text-white uppercase tracking-widest">{AI_NAME}</span>
                 <span className="text-[0.55rem] font-bold text-[var(--accent)] uppercase shrink-0">({isAr ? 'تجريبي' : 'Beta'})</span>
               </div>
               <span className="text-[0.5rem] font-bold text-zinc-700 uppercase leading-none">{isAr ? 'صنع في السعودية' : 'Made in Saudi'}</span>
             </div>
          </div>
          <span className={`hidden lg:block text-[0.6rem] font-bold text-zinc-600 uppercase tracking-widest truncate ${isAr ? 'mr-4 border-r pr-4' : 'ml-4 border-l pl-4'} border-white/5`}>{session.title}</span>
        </div>
      </div>

      <button onClick={onToggleSidebar} className={`md:hidden fixed top-24 ${isAr ? 'right-5' : 'left-5'} z-[55] w-10 h-10 rounded-xl bg-[var(--surface)] border border-[var(--border)] flex items-center justify-center text-zinc-400 shadow-2xl active:scale-90`}>
        <i className="fa-solid fa-bars-staggered text-base"></i>
      </button>

      <div 
        ref={scrollContainerRef}
        onScroll={handleScroll}
        className="flex-1 overflow-y-auto px-4 md:px-24 py-10 md:py-16 space-y-12 custom-scrollbar pb-80 relative"
      >
        {session.messages.map((m) => (
          <div key={m.id} className={`flex flex-col ${m.role === 'user' ? 'items-end' : 'items-start'} group`}>
            <div className={`flex items-center gap-3 mb-2 w-full ${m.role === 'user' ? 'justify-end' : 'justify-start'}`}>
              <span className={`text-[0.55rem] font-black uppercase tracking-[0.3em] ${m.role === 'user' ? 'text-zinc-700' : 'text-[var(--accent)]'}`}>
                {m.role === 'user' ? (isAr ? 'المشغل' : 'Operator') : AI_NAME}
              </span>
              {m.fileName && <span className="text-[0.5rem] font-black text-blue-500/50 uppercase">{isAr ? 'مرفق' : 'ATTACHED'}</span>}
              
              {m.role === 'user' && (
                <button 
                  onClick={() => onEditMessage?.(m.id, m.content)}
                  className="opacity-0 group-hover:opacity-100 p-1 text-zinc-600 hover:text-white transition-all"
                  title={isAr ? 'تعديل وإعادة إرسال' : 'Edit & Resend'}
                >
                  <i className="fa-solid fa-pen-to-square text-xs"></i>
                </button>
              )}

              {m.role === 'assistant' && (
                <button 
                  onClick={() => onSpeak(m.content, m.id)} 
                  className={`p-1 transition-all rounded-lg w-8 h-8 flex items-center justify-center ${speakingId === m.id ? 'text-black shadow-lg' : 'opacity-0 group-hover:opacity-100 text-zinc-600 hover:text-white'}`}
                  style={{ backgroundColor: speakingId === m.id ? settings.accentColor : 'transparent' }}
                >
                  <i className={`fa-solid ${speakingId === m.id ? 'fa-square' : 'fa-volume-high'} text-xs`}></i>
                </button>
              )}
            </div>
            
            {m.thought && (
              <div className="mb-4 w-full md:max-w-[80%] p-5 rounded-[1.5rem] bg-white/[0.02] border border-dashed border-white/5 opacity-60">
                 <div className="flex items-center gap-2 mb-2 text-[0.55rem] font-black text-zinc-500 uppercase tracking-widest">
                   <i className="fa-solid fa-microchip text-[0.7rem] text-[var(--accent)] animate-pulse"></i>
                   Architect Cognition Loop
                 </div>
                 <div className="text-[0.75rem] font-mono leading-relaxed italic text-zinc-400">
                    {m.thought}
                 </div>
              </div>
            )}

            <div 
              className={`relative max-w-full md:max-w-[85%] space-y-3 transition-all duration-500 ${speakingId === m.id ? 'speaking-active' : ''}`} 
              style={{ 
                padding: settings.bubblePadding, 
                fontSize: isAr ? `${settings.fontSize * 1.15}px` : `${settings.fontSize}px`, 
                backgroundColor: m.role === 'user' ? settings.userBubbleColor : settings.aiBubbleColor, 
                color: m.role === 'user' ? '#000' : '#fff', 
                borderRadius: '24px',
                fontFamily: isAr ? `'${settings.arabicFontFamily}', sans-serif` : 'inherit'
              }}
            >
              {m.type === 'mcp_permission' && m.mcpStatus === 'pending' ? (
                <div className="p-4 bg-black/40 rounded-2xl border border-[var(--accent)]/30 space-y-4">
                  <div className="text-[0.7rem] font-bold text-[var(--accent)] uppercase">{isAr ? 'طلب إذن نظام (تجريبي)' : 'System Permission Request (EXPERIMENTAL)'}</div>
                  <div className="text-[0.65rem] font-mono text-zinc-400">CMD: {m.mcpCommand}</div>
                  <div className="flex gap-2 flex-wrap">
                    <button onClick={() => onMcpPermission?.(m.id, m.mcpCommand!, true, false)} className="px-4 py-2 bg-emerald-600 text-white rounded-lg text-[0.6rem] font-black uppercase">{isAr ? 'موافق' : 'Agree'}</button>
                    <button onClick={() => onMcpPermission?.(m.id, m.mcpCommand!, true, true)} className="px-4 py-2 border border-emerald-600 text-emerald-500 rounded-lg text-[0.6rem] font-black uppercase">{isAr ? 'السماح دائماً لهذه الجلسة' : 'Always Allow for this session'}</button>
                    <button onClick={() => onMcpPermission?.(m.id, m.mcpCommand!, false, false)} className="px-4 py-2 bg-red-600 text-white rounded-lg text-[0.6rem] font-black uppercase">{isAr ? 'رفض' : 'Disagree'}</button>
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
        <div ref={endRef} className="h-24" />

        {/* Floating Scroll Buttons */}
        <div className={`fixed bottom-32 ${isAr ? 'left-6' : 'right-6'} flex flex-col gap-2 transition-all duration-300 z-50`}>
          {showScrollTop && (
            <button 
              onClick={scrollToTop} 
              className="w-10 h-10 rounded-full bg-white/5 backdrop-blur-md border border-white/10 text-white/50 hover:text-white hover:bg-white/10 flex items-center justify-center transition-all shadow-xl active:scale-90"
              title={isAr ? 'إلى الأعلى' : 'Go to Top'}
            >
              <i className="fa-solid fa-arrow-up"></i>
            </button>
          )}
          {showScrollBottom && (
            <button 
              onClick={scrollToBottom} 
              className="w-10 h-10 rounded-full bg-white/5 backdrop-blur-md border border-white/10 text-white/50 hover:text-white hover:bg-white/10 flex items-center justify-center transition-all shadow-xl active:scale-90"
              title={isAr ? 'إلى الأسفل' : 'Go to Bottom'}
            >
              <i className="fa-solid fa-arrow-down"></i>
            </button>
          )}
        </div>
      </div>

      <div className="absolute bottom-0 left-0 right-0 p-4 md:p-10 z-40 bg-gradient-to-t from-[var(--bg)] via-[var(--bg)]/98 to-transparent">
        <div className="max-w-4xl mx-auto relative">
          
          {/* Animated Loading Tab */}
          <div className={`absolute -top-6 left-10 h-8 px-5 bg-[#0a0a0a] border border-white/10 border-b-0 rounded-t-xl z-[-1] flex items-center gap-2 transform transition-all duration-500 ${isGenerating ? 'translate-y-0 opacity-100' : 'translate-y-full opacity-0'}`}>
             <div className="w-1.5 h-1.5 rounded-full bg-[var(--accent)] animate-pulse"></div>
             <span className="text-[0.55rem] font-black uppercase tracking-[0.2em] text-zinc-500 italic">
                <RandomCasingLoading />
             </span>
          </div>

          {editingMessageId && (
            <div className="mb-3 px-4 py-2 bg-[var(--accent)]/10 border border-[var(--accent)]/20 rounded-xl flex items-center justify-between animate-in slide-in-from-bottom-2">
               <div className="flex items-center gap-2">
                 <i className="fa-solid fa-pen-to-square text-[var(--accent)] text-xs"></i>
                 <span className="text-[0.6rem] font-black uppercase text-[var(--accent)] tracking-widest">{isAr ? 'تعديل التفاعل' : 'Editing Interaction'}</span>
               </div>
               <button onClick={onCancelEdit} className="text-[0.55rem] font-black uppercase bg-white/5 px-2 py-1 rounded-lg hover:bg-white/10 text-white/60">{isAr ? 'إلغاء' : 'Cancel'}</button>
            </div>
          )}

          {isListening && (
            <div className="mb-4 h-12 bg-black/60 rounded-2xl border border-white/5 overflow-hidden">
               <canvas ref={canvasRef} width={800} height={48} className="w-full h-full opacity-60" />
            </div>
          )}
          
          <div className="relative border rounded-[2rem] overflow-hidden flex items-center shadow-2xl" style={{ minHeight: `${settings.inputHeight}px`, backgroundColor: settings.inputBgColor, borderColor: settings.inputBorderColor }}>
            <button onClick={() => fileInputRef.current?.click()} className={`flex-shrink-0 h-11 w-11 ${isAr ? 'mr-4' : 'ml-4'} text-zinc-600 hover:text-[var(--accent)] flex items-center justify-center`}>
              <i className="fa-solid fa-paperclip text-[1.2rem]"></i>
              <input type="file" ref={fileInputRef} className="hidden" onChange={(e) => {
                 const f = e.target.files?.[0];
                 if (!f) return;
                 const reader = new FileReader();
                 reader.onload = (ev) => {
                    setPendingFile({ name: f.name, content: ev.target?.result as string });
                 };
                 reader.readAsText(f);
              }} />
            </button>
            <textarea 
              value={inputValue} 
              onChange={(e) => onInputChange(e.target.value)} 
              onKeyDown={(e) => { if (e.key === 'Enter' && !e.shiftKey) { e.preventDefault(); handleSend(); } }} 
              placeholder={isAr ? 'اسأل كروان...' : `Ask ${AI_NAME}...`} 
              rows={1} 
              style={{ color: settings.inputTextColor }} 
              className="flex-1 bg-transparent px-4 py-5 text-[1rem] focus:outline-none resize-none placeholder-low-opacity" 
            />
            <div className={`flex-shrink-0 ${isAr ? 'ml-5' : 'mr-5'} flex items-center gap-3`}>
              <button onClick={onMcpBrowser} className="hidden sm:flex flex-col w-11 h-11 rounded-xl text-zinc-600 hover:text-[var(--accent)] items-center justify-center border border-white/5 relative">
                <i className="fa-solid fa-microchip text-[1.1rem]"></i>
                <span className="text-[0.35rem] font-black absolute -top-1 -right-1 opacity-40 tracking-tighter uppercase">{isAr ? 'تجريبي' : 'EXP'}</span>
              </button>
              <button onClick={toggleMic} className={`w-11 h-11 rounded-xl transition-all flex items-center justify-center border border-white/5 ${isListening ? 'bg-[var(--accent)] text-black shadow-[0_0_15px_var(--accent)]' : 'text-zinc-600 hover:text-[var(--accent)]'}`}><i className={`fa-solid ${isListening ? 'fa-stop' : 'fa-microphone'} text-[1.1rem]`}></i></button>
              
              {/* Dynamic Stop/Send Button */}
              <button 
                onClick={handleSend} 
                className={`w-11 h-11 rounded-2xl flex items-center justify-center transition-all ${
                  isGenerating 
                    ? 'bg-red-500 text-white shadow-[0_0_15px_rgba(239,68,68,0.4)]' 
                    : (hasInput ? 'bg-[var(--accent)] text-black shadow-[0_0_10px_var(--accent)]' : 'opacity-0 pointer-events-none')
                }`}
              >
                <i className={`fa-solid ${isGenerating ? 'fa-square' : 'fa-arrow-up'} text-[1.1rem]`}></i>
              </button>
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