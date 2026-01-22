import React, { useState, useEffect, useRef } from 'react';
import { AppSettings, ThemeType, BubbleStyle } from '../types.ts';
import { CockatielLogo, AI_NAME } from '../constants.tsx';

interface SettingsModalProps {
  settings: AppSettings;
  onSave: (settings: AppSettings) => void;
  onClose: () => void;
  onExport: () => void;
  onImport: (file: File) => void;
}

const SettingsModal: React.FC<SettingsModalProps> = ({ settings, onSave, onClose, onExport, onImport }) => {
  const [form, setForm] = useState(settings);
  const [ollamaModels, setOllamaModels] = useState<string[]>([]);
  const [voices, setVoices] = useState<SpeechSynthesisVoice[]>([]);
  const [tab, setTab] = useState<'network' | 'appearance' | 'audio' | 'mcp' | 'data' | 'about'>('network');
  const dirInputRef = useRef<HTMLInputElement>(null);
  const importInputRef = useRef<HTMLInputElement>(null);

  const isAr = form.language === 'ar';

  const L = {
    network: isAr ? 'الشبكة' : 'Network',
    appearance: isAr ? 'المظهر' : 'Appearance',
    audio: isAr ? 'الصوت' : 'Audio',
    mcp: isAr ? 'ربط MCP (تجريبي)' : 'MCP Bridge (EXPERIMENTAL)',
    data: isAr ? 'البيانات' : 'Data',
    about: isAr ? 'حول' : 'About',
    apply: isAr ? 'تطبيق التغييرات' : 'APPLY_CHANGES',
    discard: isAr ? 'تجاهل' : 'DISCARD',
    ollamaHost: isAr ? 'مضيف Ollama' : 'Ollama Host',
    language: isAr ? 'اللغة' : 'Language',
    voiceProfile: isAr ? 'ملف الصوت' : 'Voice Profile',
    voicePitch: isAr ? 'درجة الصوت' : 'Voice Pitch',
    voiceRate: isAr ? 'سرعة الصوت' : 'Voice Rate',
    skipCode: isAr ? 'تجاهل الكود في القراءة' : 'Skip Code during TTS',
    autoSpeak: isAr ? 'نطق تلقائي' : 'Auto Speak Responses',
    continuousMic: isAr ? 'ميكروفون مستمر' : 'Continuous Mic',
    waitForFinish: isAr ? 'انتظار انتهاء النطق' : 'Wait for Finish',
    accentColor: isAr ? 'لون التميز' : 'Accent Color',
    fontSize: isAr ? 'حجم الخط' : 'Font Size',
    bubblePadding: isAr ? 'تباعد الفقاعات' : 'Bubble Padding',
    inputHeight: isAr ? 'ارتفاع الإدخال' : 'Input Height',
    export: isAr ? 'تصدير الجلسات' : 'Export Sessions',
    import: isAr ? 'استيراد نسخة' : 'Import Backup',
    download: isAr ? 'تحميل' : 'DOWNLOAD',
    upload: isAr ? 'رفع' : 'UPLOAD',
    madeInSaudi: isAr ? 'صنع في المملكة العربية السعودية' : 'Made in Saudi Arabia',
    createdBy: isAr ? 'بواسطة فهد العرشي' : 'Created by Fahd Alarashi',
    memorial1: isAr ? 'اللهم ارحم واغفر لوالدي عبدالله وادخله الجنة' : 'اللهم ارحم واغفر لوالدي عبدالله وادخله الجنة',
    memorial2: isAr ? 'اللهم اجعل كل علم انفع به صدقة لروحه' : 'اللهم اجعل كل علم انفع به صدقة لروحه',
    mcpHost: isAr ? 'عنوان الجسر (تجريبي)' : 'Bridge URL (EXPERIMENTAL)',
    mcpPaths: isAr ? 'مسارات المجلدات المشتركة' : 'Shared Folder Paths',
  };

  useEffect(() => {
    const fetchModels = async () => {
      if (form.fetchLocalModels) {
        try {
          const response = await fetch(`${form.ollamaUrl}/api/tags`);
          const d = await response.json();
          if (d.models) setOllamaModels(d.models.map((m: any) => m.name));
        } catch (e) { setOllamaModels([]); }
      }
    };
    fetchModels();
  }, [form.ollamaUrl, form.fetchLocalModels]);

  useEffect(() => {
    const loadVoices = () => setVoices(window.speechSynthesis.getVoices());
    loadVoices();
    window.speechSynthesis.onvoiceschanged = loadVoices;
  }, []);

  const handleSharedPathAdd = () => {
    const p = prompt(isAr ? 'أدخل مسار المجلد يدوياً:' : "Enter system folder path manually:");
    if (p) setForm({ ...form, sharedPaths: [...form.sharedPaths, p] });
  };

  const handleImportClick = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) { onImport(file); onClose(); }
  };

  const arabicFonts = ['Cairo', 'Amiri', 'Noto Sans Arabic'];

  return (
    <div className={`fixed inset-0 z-[200] flex items-center justify-center bg-black/98 backdrop-blur-2xl overflow-hidden text-white ${isAr ? 'rtl' : 'ltr'}`}>
      <div className="bg-[#050505] border border-white/5 w-full max-w-4xl md:rounded-[2.5rem] overflow-hidden flex flex-col md:flex-row h-full max-h-[720px]">
        
        <div className="w-full md:w-64 bg-black/40 border-b md:border-b-0 md:border-r border-white/5 flex flex-row md:flex-col p-4 md:p-8 shrink-0 overflow-x-auto custom-scrollbar">
          <div className="hidden md:flex items-center gap-4 mb-10 px-2">
            <CockatielLogo className="w-10 h-10 text-[var(--accent)]" />
            <div className="flex flex-col">
              <h2 className="text-lg font-black uppercase tracking-tighter italic">{AI_NAME}</h2>
              <span className="text-[0.5rem] text-[var(--accent)] font-bold">{isAr ? 'نسخة تجريبية' : 'BETA'}</span>
            </div>
          </div>
          
          <nav className="flex flex-row md:flex-col gap-1 flex-1 md:space-y-1">
            {[
              { id: 'network', icon: 'fa-network-wired', label: L.network },
              { id: 'appearance', icon: 'fa-palette', label: L.appearance },
              { id: 'audio', icon: 'fa-headset', label: L.audio },
              { id: 'mcp', icon: 'fa-microchip', label: L.mcp },
              { id: 'data', icon: 'fa-database', label: L.data },
              { id: 'about', icon: 'fa-circle-info', label: L.about },
            ].map(item => (
              <button key={item.id} onClick={() => setTab(item.id as any)} 
                className={`flex-shrink-0 flex items-center gap-4 px-4 py-3 rounded-xl text-[0.6rem] font-black uppercase tracking-[0.2em] transition-all ${tab === item.id ? 'bg-[var(--accent)] text-black shadow-lg shadow-[var(--accent)]/20' : 'text-zinc-600 hover:text-white'}`}>
                <i className={`fa-solid ${item.icon} w-4 text-center text-base`}></i>
                <span className="whitespace-nowrap">{item.label}</span>
              </button>
            ))}
          </nav>

          <div className="hidden md:flex flex-col gap-2 mt-auto pt-8">
            <button onClick={() => onSave(form)} className="w-full py-4 bg-[var(--accent)] text-black rounded-2xl text-[0.7rem] font-black uppercase tracking-widest hover:brightness-110 active:scale-95 transition-all">{L.apply}</button>
            <button onClick={onClose} className="w-full py-4 border border-white/5 text-zinc-600 rounded-2xl text-[0.7rem] font-black uppercase tracking-widest hover:text-white transition-colors">{L.discard}</button>
          </div>
        </div>

        <div className="flex-1 overflow-y-auto p-6 md:p-10 custom-scrollbar bg-black/20">
          {tab === 'network' && (
            <div className="space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-500">
              <div className="space-y-3">
                <label className="text-[0.6rem] font-black text-zinc-800 uppercase tracking-widest px-1">{L.ollamaHost}</label>
                <input type="text" value={form.ollamaUrl} onChange={e => setForm({...form, ollamaUrl: e.target.value})} className="w-full bg-black/40 border border-white/5 rounded-2xl px-6 py-4 text-[0.8rem] font-mono outline-none focus:border-[var(--accent)] transition-all" />
              </div>

              <div className="space-y-3">
                <div className="flex justify-between items-center px-1">
                  <label className="text-[0.6rem] font-black text-zinc-800 uppercase tracking-widest">{isAr ? 'الموديل المختار' : 'Selected Model'}</label>
                  <label className="flex items-center gap-2 cursor-pointer">
                    <span className="text-[0.5rem] font-bold text-zinc-600 uppercase">{isAr ? 'جلب الموديلات المحلية' : 'Auto Fetch'}</span>
                    <input type="checkbox" checked={form.fetchLocalModels} onChange={e => setForm({...form, fetchLocalModels: e.target.checked})} className="w-3.5 h-3.5 accent-[var(--accent)]" />
                  </label>
                </div>
                {form.fetchLocalModels && ollamaModels.length > 0 ? (
                  <select value={form.selectedModel} onChange={e => setForm({...form, selectedModel: e.target.value})} className="w-full bg-black/40 border border-white/5 rounded-2xl px-6 py-4 text-[0.8rem] outline-none cursor-pointer">
                    {ollamaModels.map(m => <option key={m} value={m} className="bg-zinc-900">{m}</option>)}
                  </select>
                ) : (
                  <input type="text" value={form.selectedModel} onChange={e => setForm({...form, selectedModel: e.target.value})} placeholder="llama3" className="w-full bg-black/40 border border-white/5 rounded-2xl px-6 py-4 text-[0.8rem] font-mono outline-none" />
                )}
                
                <label className="flex items-center justify-between cursor-pointer group mt-4 px-1 bg-white/[0.02] p-4 rounded-xl border border-white/5">
                   <div className="flex flex-col">
                     <span className="text-[0.7rem] font-black text-zinc-400 uppercase tracking-widest group-hover:text-white transition-colors">
                        {isAr ? 'تفعيل التفكير (نموذج 2.5/3)' : 'Enable Thinking (2.5/3 Models)'}
                     </span>
                     <span className="text-[0.5rem] font-bold text-zinc-700 uppercase mt-1">Experimental // Logic expansion</span>
                   </div>
                   <input type="checkbox" checked={form.thinkingEnabled} onChange={e => setForm({...form, thinkingEnabled: e.target.checked})} className="w-5 h-5 accent-[var(--accent)]" />
                </label>
              </div>

              <div className="space-y-3">
                <label className="text-[0.6rem] font-black text-zinc-800 uppercase tracking-widest px-1">{isAr ? 'نمط الشخصية' : 'Prompt Persona'}</label>
                <div className="grid grid-cols-3 gap-2">
                  {['default', 'mcp', 'custom'].map(p => (
                    <button key={p} onClick={() => setForm({...form, promptPreset: p as any})} className={`py-3 rounded-xl border text-[0.55rem] font-black uppercase tracking-widest transition-all ${form.promptPreset === p ? 'bg-[var(--accent)] text-black border-[var(--accent)] shadow-lg shadow-[var(--accent)]/10' : 'bg-white/5 text-zinc-600 border-white/5 hover:text-white'}`}>
                      {p === 'default' ? (isAr ? 'أساسي' : 'Basic AI') : p === 'mcp' ? (isAr ? 'جسر' : 'MCP Architect') : (isAr ? 'مخصص' : 'Custom System Prompt')}
                    </button>
                  ))}
                </div>
                {form.promptPreset === 'custom' && (
                  <textarea 
                    value={form.customSystemPrompt} 
                    onChange={e => setForm({...form, customSystemPrompt: e.target.value})} 
                    placeholder={isAr ? 'أدخل تعليمات النظام المخصصة هنا...' : "Type your custom system prompt architecture here..."} 
                    className="w-full bg-black/40 border border-white/5 rounded-2xl p-4 text-[0.75rem] font-mono outline-none h-32 mt-2 custom-scrollbar"
                  />
                )}
              </div>
            </div>
          )}

          {tab === 'appearance' && (
            <div className="space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-500">
               {/* Realtime Sample Preview */}
               <div className="p-6 rounded-[2.5rem] border border-white/5 space-y-4 mb-10 transition-all duration-300" style={{ backgroundColor: form.chatBgColor }} dir={isAr ? 'rtl' : 'ltr'}>
                  <div className="flex flex-col gap-4">
                     <div className="self-end px-5 py-3 rounded-[1.5rem] text-black shadow-lg" style={{ backgroundColor: form.userBubbleColor, fontSize: form.fontSize, padding: form.bubblePadding, fontFamily: isAr ? `'${form.arabicFontFamily}', sans-serif` : 'inherit' }}>
                        {isAr ? 'طلب استعلام من النظام.' : 'System Node Query.'}
                     </div>
                     <div className="self-start px-5 py-3 rounded-[1.5rem] text-white border border-white/5 shadow-lg" style={{ backgroundColor: form.aiBubbleColor, fontSize: isAr ? `${form.fontSize * 1.15}px` : `${form.fontSize}px`, padding: form.bubblePadding, fontFamily: isAr ? `'${form.arabicFontFamily}', sans-serif` : 'inherit' }}>
                        {isAr ? 'تم تفعيل تدفق التصميم. الاتصال قائم.' : 'Architect stream active. Connection established.'}
                     </div>
                  </div>
                  <div className="mt-4 flex items-center gap-2 border rounded-full px-5 transition-all" style={{ backgroundColor: form.inputBgColor, borderColor: form.inputBorderColor, height: `${form.inputHeight * 0.7}px` }}>
                     <div className="w-2 h-2 rounded-full animate-pulse" style={{ backgroundColor: form.accentColor }}></div>
                     <div className="flex-1 text-[0.7rem] opacity-20 uppercase tracking-widest font-black" style={{ color: form.inputTextColor }}>{isAr ? 'اسأل كروان...' : 'Ask Karawan...'}</div>
                     <div className="w-8 h-8 rounded-xl flex items-center justify-center shadow-lg" style={{ backgroundColor: form.accentColor, color: '#000' }}>
                        <i className={`fa-solid ${isAr ? 'fa-arrow-left' : 'fa-arrow-up'} text-[0.7rem]`}></i>
                     </div>
                  </div>
               </div>

               <div className="space-y-3">
                 <label className="text-[0.6rem] font-black text-zinc-800 uppercase tracking-widest px-1">{L.language}</label>
                 <div className="grid grid-cols-2 gap-2">
                   <button onClick={() => setForm({...form, language: 'en'})} className={`py-4 rounded-xl border text-[0.65rem] font-black uppercase tracking-widest transition-all ${form.language === 'en' ? 'bg-[var(--accent)] text-black border-[var(--accent)]' : 'bg-white/5 text-zinc-600 border-white/5 hover:text-white'}`}>English</button>
                   <button onClick={() => setForm({...form, language: 'ar'})} className={`py-4 rounded-xl border text-[0.65rem] font-black uppercase tracking-widest transition-all ${form.language === 'ar' ? 'bg-[var(--accent)] text-black border-[var(--accent)]' : 'bg-white/5 text-zinc-600 border-white/5 hover:text-white'}`}>العربية</button>
                 </div>
               </div>

               <div className="grid grid-cols-2 gap-6 pt-4 border-t border-white/5">
                  {[
                    { key: 'accentColor', label: L.accentColor },
                    { key: 'userBubbleColor', label: isAr ? 'لون فقاعة المستخدم' : 'User Bubble' },
                    { key: 'aiBubbleColor', label: isAr ? 'لون فقاعة الذكاء' : 'AI Bubble' },
                    { key: 'chatBgColor', label: isAr ? 'لون الخلفية' : 'Background Color' },
                    { key: 'inputBgColor', label: isAr ? 'خلفية الإدخال' : 'Input Background' },
                    { key: 'inputTextColor', label: isAr ? 'لون نص الإدخال' : 'Input Text' }
                  ].map(item => (
                    <div key={item.key} className="space-y-2">
                      <label className="text-[0.6rem] font-black text-zinc-800 uppercase tracking-widest px-1">{item.label}</label>
                      <div className="flex items-center gap-3 bg-white/5 p-2 rounded-xl border border-white/5">
                        <input type="color" value={(form as any)[item.key]} onChange={e => setForm({...form, [item.key]: e.target.value})} className="w-8 h-8 rounded-lg cursor-pointer bg-transparent border-none p-0" />
                        <span className="text-[0.55rem] font-mono text-zinc-600 uppercase tracking-tighter">{(form as any)[item.key]}</span>
                      </div>
                    </div>
                  ))}
               </div>

               <div className="space-y-6 pt-6 border-t border-white/5">
                 <div className="space-y-3">
                   <label className="text-[0.6rem] font-black text-zinc-800 uppercase tracking-widest px-1">{isAr ? 'اختيار الخط العربي' : 'Arabic Font Selector'}</label>
                   <div className="grid grid-cols-3 gap-2">
                     {arabicFonts.map(f => (
                       <button key={f} onClick={() => setForm({...form, arabicFontFamily: f})} className={`py-3 rounded-xl border text-[0.65rem] font-bold transition-all ${form.arabicFontFamily === f ? 'bg-[var(--accent)] text-black border-[var(--accent)]' : 'bg-white/5 text-zinc-600 border-white/5 hover:text-white'}`} style={{ fontFamily: f }}>
                         {f === 'Cairo' ? 'القاهرة' : f === 'Amiri' ? 'الأميري' : 'نوتو'}
                       </button>
                     ))}
                   </div>
                 </div>

                 {[
                   { key: 'fontSize', label: L.fontSize, min: 12, max: 24 },
                   { key: 'sidebarFontSize', label: isAr ? 'حجم خط الجانب' : 'Sidebar Font', min: 10, max: 22 },
                   { key: 'bubblePadding', label: L.bubblePadding, min: 8, max: 40 }
                 ].map(item => (
                   <div key={item.key} className="space-y-2">
                     <div className="flex justify-between px-1">
                       <label className="text-[0.6rem] font-black text-zinc-800 uppercase tracking-widest">{item.label}</label>
                       <span className="text-[0.6rem] font-mono text-[var(--accent)]">{(form as any)[item.key]}px</span>
                     </div>
                     <input type="range" min={item.min} max={item.max} value={(form as any)[item.key]} onChange={e => setForm({...form, [item.key]: parseInt(e.target.value)})} className="w-full h-1 accent-[var(--accent)] appearance-none bg-zinc-900 rounded-full" />
                   </div>
                 ))}
               </div>
            </div>
          )}

          {tab === 'audio' && (
            <div className="space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-500">
              <div className="space-y-6 p-8 bg-white/2 border border-white/5 rounded-3xl">
                <div className="space-y-4">
                  <label className="text-[0.6rem] font-black text-zinc-800 uppercase tracking-widest px-1">{L.voiceProfile}</label>
                  <select value={form.voiceId} onChange={e => setForm({...form, voiceId: e.target.value})} className="w-full bg-black/40 border border-white/5 rounded-2xl px-6 py-4 text-[0.8rem] outline-none cursor-pointer">
                    <option value="">SYSTEM_DEFAULT</option>
                    {voices.map(v => <option key={v.voiceURI} value={v.voiceURI} className="bg-zinc-900">{v.name}</option>)}
                  </select>
                </div>
                <div className="grid grid-cols-2 gap-6">
                  <div className="space-y-2">
                    <label className="text-[0.6rem] font-black text-zinc-800 uppercase tracking-widest px-1">{L.voicePitch}</label>
                    <input type="range" min="0.5" max="2" step="0.1" value={form.voicePitch} onChange={e => setForm({...form, voicePitch: parseFloat(e.target.value)})} className="w-full accent-[var(--accent)]" />
                  </div>
                  <div className="space-y-2">
                    <label className="text-[0.6rem] font-black text-zinc-800 uppercase tracking-widest px-1">{L.voiceRate}</label>
                    <input type="range" min="0.5" max="3" step="0.1" value={form.voiceRate} onChange={e => setForm({...form, voiceRate: parseFloat(e.target.value)})} className="w-full accent-[var(--accent)]" />
                  </div>
                </div>
                <div className="space-y-3 pt-4 border-t border-white/5">
                   {[
                     { key: 'voiceSkipCode', label: L.skipCode },
                     { key: 'autoSpeak', label: L.autoSpeak },
                     { key: 'continuousVoice', label: L.continuousMic },
                     { key: 'waitForFinish', label: L.waitForFinish }
                   ].map(item => (
                     <label key={item.key} className="flex items-center justify-between cursor-pointer group py-1">
                       <span className="text-[0.7rem] font-bold text-zinc-500 group-hover:text-white transition-colors">{item.label}</span>
                       <input type="checkbox" checked={(form as any)[item.key]} onChange={e => setForm({...form, [item.key]: e.target.checked})} className="w-5 h-5 accent-[var(--accent)]" />
                     </label>
                   ))}
                </div>
              </div>
            </div>
          )}

          {tab === 'mcp' && (
            <div className="space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-500">
              <div className="p-8 bg-black/40 border border-white/5 rounded-3xl space-y-6">
                <h3 className="text-[0.7rem] font-black text-[var(--accent)] uppercase tracking-[0.2em]">{L.mcp}</h3>
                
                <div className="space-y-3">
                  <label className="text-[0.6rem] font-black text-zinc-800 uppercase tracking-widest px-1">{L.mcpHost}</label>
                  <input type="text" value={form.mcpBackendUrl} onChange={e => setForm({...form, mcpBackendUrl: e.target.value})} className="w-full bg-black/20 border border-white/5 rounded-2xl px-6 py-4 text-[0.8rem] font-mono outline-none" />
                </div>

                <div className="space-y-3">
                  <label className="text-[0.6rem] font-black text-zinc-800 uppercase tracking-widest px-1">{L.mcpPaths}</label>
                  <div className="flex flex-wrap gap-2 mb-3">
                    {form.sharedPaths.map((p, i) => (
                      <div key={i} className="flex items-center gap-2 bg-white/5 px-4 py-2 rounded-xl border border-white/5 text-[0.65rem] font-mono group">
                        {p}
                        <button onClick={() => setForm({...form, sharedPaths: form.sharedPaths.filter((_, idx) => idx !== i)})} className="text-red-500/30 group-hover:text-red-500 transition-colors"><i className="fa-solid fa-xmark"></i></button>
                      </div>
                    ))}
                  </div>
                  <button onClick={handleSharedPathAdd} className="w-full py-4 bg-white/5 border border-dashed border-white/10 rounded-2xl text-[0.6rem] font-black uppercase tracking-widest hover:border-[var(--accent)]/50 hover:text-white transition-all">
                    {isAr ? 'إضافة مسار يدوي (تجريبي)' : 'ADD_PATH (EXPERIMENTAL)'}
                  </button>
                </div>
              </div>
            </div>
          )}

          {tab === 'about' && (
            <div className="space-y-8 text-center py-10 animate-in fade-in slide-in-from-bottom-4 duration-500">
               <CockatielLogo className="w-24 h-24 text-[var(--accent)] mx-auto opacity-50 mb-6" />
               <h2 className="text-3xl font-black italic uppercase">{AI_NAME} ({isAr ? 'تجريبي' : 'Beta'})</h2>
               <div className="space-y-2">
                 <p className="text-[0.7rem] text-zinc-500 font-bold uppercase tracking-widest">{L.madeInSaudi}</p>
                 <p className="text-[0.7rem] text-zinc-400 font-bold uppercase tracking-widest">{L.createdBy}</p>
                 <a href="https://github.com/falarashi" target="_blank" className="flex items-center justify-center gap-2 text-[var(--accent)] text-[0.8rem] hover:underline mt-4">
                   <i className="fa-brands fa-github text-xl"></i> github.com/falarashi
                 </a>
                 <div className="mt-8 space-y-2 border-t border-white/5 pt-8">
                    <p className="text-[1.2rem] font-bold text-white tracking-wide">{L.memorial1}</p>
                    <p className="text-[1.1rem] font-medium text-white/70">{L.memorial2}</p>
                 </div>
               </div>
            </div>
          )}

          <div className="md:hidden mt-8 grid grid-cols-2 gap-4 pb-8">
             <button onClick={() => onSave(form)} className="py-5 bg-[var(--accent)] text-black rounded-xl text-[0.7rem] font-black uppercase tracking-widest">{L.apply}</button>
             <button onClick={onClose} className="py-5 border border-white/5 text-zinc-600 rounded-xl text-[0.7rem] font-black uppercase tracking-widest">{L.discard}</button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default SettingsModal;