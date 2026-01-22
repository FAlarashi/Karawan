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
    mcp: isAr ? 'ربط MCP (تجريبي)' : 'MCP Bridge (Exp)',
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
    memorial1: isAr ? 'اللهم ارحم واغفر لوالدي عبدالله وادخله الجنة' : '',
    memorial2: isAr ? 'اللهم اجعل كل علم انفع به صدقة لروحه' : 'اللهم اجعل كل علم انفع به صدقة لروحه',
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

  return (
    <div className={`fixed inset-0 z-[200] flex items-center justify-center bg-black/98 backdrop-blur-2xl overflow-hidden text-white ${isAr ? 'rtl' : 'ltr'}`}>
      <div className="bg-[#050505] border border-white/5 w-full max-w-5xl md:rounded-[2.5rem] overflow-hidden flex flex-col md:flex-row h-full max-h-[800px]">
        
        <div className="w-full md:w-72 bg-black/40 border-b md:border-b-0 md:border-r border-white/5 flex flex-row md:flex-col p-4 md:p-8 shrink-0 overflow-x-auto custom-scrollbar">
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
                className={`flex-shrink-0 flex items-center gap-4 px-4 py-3 rounded-xl text-[0.6rem] font-black uppercase tracking-[0.2em] transition-all ${tab === item.id ? 'bg-[var(--accent)] text-black' : 'text-zinc-600 hover:text-white'}`}>
                <i className={`fa-solid ${item.icon} w-4 text-center text-base`}></i>
                <span className="whitespace-nowrap">{item.label}</span>
              </button>
            ))}
          </nav>

          <div className="hidden md:flex flex-col gap-2 mt-auto pt-8">
            <button onClick={() => onSave(form)} className="w-full py-4 bg-[var(--accent)] text-black rounded-2xl text-[0.7rem] font-black uppercase tracking-widest">{L.apply}</button>
            <button onClick={onClose} className="w-full py-4 border border-white/5 text-zinc-600 rounded-2xl text-[0.7rem] font-black uppercase tracking-widest">{L.discard}</button>
          </div>
        </div>

        <div className="flex-1 overflow-y-auto p-6 md:p-12 custom-scrollbar bg-black/20">
          {tab === 'network' && (
            <div className="space-y-8 animate-in fade-in slide-in-from-bottom-4">
              <div className="space-y-3">
                <label className="text-[0.6rem] font-black text-zinc-800 uppercase tracking-widest">{L.ollamaHost}</label>
                <input type="text" value={form.ollamaUrl} onChange={e => setForm({...form, ollamaUrl: e.target.value})} className="w-full bg-black/40 border border-white/5 rounded-2xl px-6 py-4 text-[0.8rem] font-mono outline-none" />
              </div>
              <div className="space-y-3">
                <label className="text-[0.6rem] font-black text-zinc-800 uppercase tracking-widest">{L.language}</label>
                <div className="grid grid-cols-2 gap-2">
                  <button onClick={() => setForm({...form, language: 'en'})} className={`py-3 rounded-xl border ${form.language === 'en' ? 'bg-[var(--accent)] text-black' : 'bg-white/5 text-zinc-600'}`}>English</button>
                  <button onClick={() => setForm({...form, language: 'ar'})} className={`py-3 rounded-xl border ${form.language === 'ar' ? 'bg-[var(--accent)] text-black' : 'bg-white/5 text-zinc-600'}`}>العربية</button>
                </div>
              </div>
            </div>
          )}

          {tab === 'appearance' && (
            <div className="space-y-8 animate-in fade-in slide-in-from-bottom-4">
               <div className="grid grid-cols-2 gap-6">
                 <div className="space-y-2">
                   <label className="text-[0.6rem] font-black text-zinc-800 uppercase tracking-widest">{L.accentColor}</label>
                   <input type="color" value={form.accentColor} onChange={e => setForm({...form, accentColor: e.target.value})} className="w-full h-12 rounded-xl bg-transparent border-none cursor-pointer" />
                 </div>
                 <div className="space-y-2">
                   <label className="text-[0.6rem] font-black text-zinc-800 uppercase tracking-widest">{L.fontSize}</label>
                   <input type="range" min="12" max="24" value={form.fontSize} onChange={e => setForm({...form, fontSize: parseInt(e.target.value)})} className="w-full h-1 accent-[var(--accent)]" />
                 </div>
               </div>
            </div>
          )}

          {tab === 'audio' && (
            <div className="space-y-8 animate-in fade-in slide-in-from-bottom-4">
              <div className="space-y-6 p-8 bg-white/2 border border-white/5 rounded-3xl">
                <div className="space-y-4">
                  <label className="text-[0.6rem] font-black text-zinc-800 uppercase tracking-widest">{L.voiceProfile}</label>
                  <select value={form.voiceId} onChange={e => setForm({...form, voiceId: e.target.value})} className="w-full bg-black/40 border border-white/5 rounded-2xl px-6 py-4 text-[0.8rem] outline-none">
                    <option value="">SYSTEM_DEFAULT</option>
                    {voices.map(v => <option key={v.voiceURI} value={v.voiceURI} className="bg-zinc-900">{v.name}</option>)}
                  </select>
                </div>
                <div className="grid grid-cols-2 gap-6">
                  <div className="space-y-2">
                    <label className="text-[0.6rem] font-black text-zinc-800 uppercase tracking-widest">{L.voicePitch}</label>
                    <input type="range" min="0.5" max="2" step="0.1" value={form.voicePitch} onChange={e => setForm({...form, voicePitch: parseFloat(e.target.value)})} className="w-full accent-[var(--accent)]" />
                  </div>
                  <div className="space-y-2">
                    <label className="text-[0.6rem] font-black text-zinc-800 uppercase tracking-widest">{L.voiceRate}</label>
                    <input type="range" min="0.5" max="3" step="0.1" value={form.voiceRate} onChange={e => setForm({...form, voiceRate: parseFloat(e.target.value)})} className="w-full accent-[var(--accent)]" />
                  </div>
                </div>
                <div className="space-y-3 pt-4 border-t border-white/5">
                   <label className="flex items-center justify-between cursor-pointer">
                     <span className="text-[0.7rem] font-bold text-zinc-400">{L.skipCode}</span>
                     <input type="checkbox" checked={form.voiceSkipCode} onChange={e => setForm({...form, voiceSkipCode: e.target.checked})} className="w-5 h-5 accent-[var(--accent)]" />
                   </label>
                   <label className="flex items-center justify-between cursor-pointer">
                     <span className="text-[0.7rem] font-bold text-zinc-400">{L.autoSpeak}</span>
                     <input type="checkbox" checked={form.autoSpeak} onChange={e => setForm({...form, autoSpeak: e.target.checked})} className="w-5 h-5 accent-[var(--accent)]" />
                   </label>
                   <label className="flex items-center justify-between cursor-pointer">
                     <span className="text-[0.7rem] font-bold text-zinc-400">{L.continuousMic}</span>
                     <input type="checkbox" checked={form.continuousVoice} onChange={e => setForm({...form, continuousVoice: e.target.checked})} className="w-5 h-5 accent-[var(--accent)]" />
                   </label>
                   <label className="flex items-center justify-between cursor-pointer">
                     <span className="text-[0.7rem] font-bold text-zinc-400">{L.waitForFinish}</span>
                     <input type="checkbox" checked={form.waitForFinish} onChange={e => setForm({...form, waitForFinish: e.target.checked})} className="w-5 h-5 accent-[var(--accent)]" />
                   </label>
                </div>
              </div>
            </div>
          )}

          {tab === 'mcp' && (
            <div className="space-y-8 animate-in fade-in slide-in-from-bottom-4">
              <div className="p-8 bg-black/40 border border-white/5 rounded-3xl space-y-4">
                <h3 className="text-[0.7rem] font-black text-[var(--accent)] uppercase">{L.mcp}</h3>
                <input type="text" value={form.mcpBackendUrl} onChange={e => setForm({...form, mcpBackendUrl: e.target.value})} className="w-full bg-black/20 border border-white/5 rounded-xl px-4 py-3 text-[0.8rem] font-mono outline-none" />
                <div className="flex flex-wrap gap-2">
                  {form.sharedPaths.map((p, i) => (
                    <div key={i} className="flex items-center gap-2 bg-white/5 px-3 py-1.5 rounded-lg border border-white/5 text-[0.6rem] font-mono">
                      {p}
                      <button onClick={() => setForm({...form, sharedPaths: form.sharedPaths.filter((_, idx) => idx !== i)})} className="text-red-500/50 hover:text-red-500"><i className="fa-solid fa-xmark"></i></button>
                    </div>
                  ))}
                  <button onClick={handleSharedPathAdd} className="px-4 py-1.5 bg-[var(--accent)] text-black rounded-lg text-[0.6rem] font-black uppercase tracking-widest">+</button>
                </div>
              </div>
            </div>
          )}

          {tab === 'data' && (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6 animate-in fade-in slide-in-from-bottom-4">
               <div className="p-8 bg-white/2 border border-white/5 rounded-[2rem] flex flex-col items-center justify-center text-center gap-4">
                   <i className="fa-solid fa-cloud-arrow-down text-3xl text-zinc-800"></i>
                   <h4 className="text-[0.7rem] font-black text-white uppercase tracking-widest">{L.export}</h4>
                   <button onClick={onExport} className="mt-2 px-8 py-4 bg-[var(--accent)] text-black rounded-xl text-[0.65rem] font-black uppercase tracking-widest">{L.download}</button>
               </div>
               <div className="p-8 bg-white/2 border border-white/5 rounded-[2rem] flex flex-col items-center justify-center text-center gap-4">
                   <i className="fa-solid fa-cloud-arrow-up text-3xl text-zinc-800"></i>
                   <h4 className="text-[0.7rem] font-black text-white uppercase tracking-widest">{L.import}</h4>
                   <button onClick={() => importInputRef.current?.click()} className="mt-2 px-8 py-4 border border-white/10 text-white rounded-xl text-[0.65rem] font-black uppercase tracking-widest">{L.upload}</button>
                   <input type="file" ref={importInputRef} className="hidden" accept=".json" onChange={handleImportClick} />
               </div>
            </div>
          )}

          {tab === 'about' && (
            <div className="space-y-8 text-center py-10 animate-in fade-in slide-in-from-bottom-4">
               <CockatielLogo className="w-24 h-24 text-[var(--accent)] mx-auto opacity-50 mb-6" />
               <h2 className="text-3xl font-black italic uppercase">{AI_NAME} (Beta)</h2>
               <div className="space-y-2">
                 <p className="text-[0.7rem] text-zinc-500 font-bold uppercase tracking-widest">{L.madeInSaudi}</p>
                 <p className="text-[0.7rem] text-zinc-400 font-bold uppercase tracking-widest">{L.createdBy}</p>
                 <a href="https://github.com/falarashi" target="_blank" className="flex items-center justify-center gap-2 text-[var(--accent)] text-[0.8rem] hover:underline mt-4">
                   <i className="fa-brands fa-github"></i> github.com/falarashi
                 </a>
               </div>
               <div className="mt-12 pt-8 border-t border-white/5 space-y-4">
                 <p className="text-xl font-bold text-white leading-relaxed">{L.memorial1}</p>
                 <p className="text-lg font-medium text-zinc-400 leading-relaxed">{L.memorial2}</p>
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
