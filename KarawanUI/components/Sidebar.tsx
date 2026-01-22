import React, { useState } from 'react';
import { ChatSession } from '../types';
import { BirdLogo, AI_NAME } from '../constants';

interface SidebarProps {
  width: number;
  sessions: ChatSession[];
  activeId: string | null;
  onSelect: (id: string) => void;
  onNew: () => void;
  onDelete: (id: string) => void;
  onSettings: () => void;
  isCollapsed: boolean;
  onToggleCollapse: () => void;
  mcpStatus: boolean;
  language: 'en' | 'ar';
  fontSize: number;
}

const Sidebar: React.FC<SidebarProps> = ({ 
  width, sessions, activeId, onSelect, onNew, onDelete, onSettings, isCollapsed, onToggleCollapse, mcpStatus, language, fontSize
}) => {
  const [search, setSearch] = useState('');
  const filtered = sessions.filter(s => s.title.toLowerCase().includes(search.toLowerCase()));
  const isMobile = typeof window !== 'undefined' && window.innerWidth < 768;

  const isAr = language === 'ar';

  const sidebarStyle: React.CSSProperties = isMobile 
    ? {
        position: 'fixed',
        top: 0,
        left: isAr ? 'auto' : 0,
        right: isAr ? 0 : 'auto',
        zIndex: 100,
        width: '280px',
        transform: isCollapsed ? (isAr ? 'translateX(100%)' : 'translateX(-100%)') : 'translateX(0)',
        transition: 'transform 0.3s cubic-bezier(0.4, 0, 0.2, 1)',
        fontSize: `${fontSize}px`
      }
    : {
        width: isCollapsed ? '80px' : `${width}px`,
        fontSize: `${fontSize}px`
      };

  const Backdrop = isMobile && !isCollapsed ? (
    <div className="fixed inset-0 bg-black/80 backdrop-blur-sm z-[95] animate-in fade-in duration-300" onClick={onToggleCollapse} />
  ) : null;

  if (isCollapsed && !isMobile) {
    return (
      <div className="h-full flex flex-col items-center py-6 bg-[var(--sidebar)] border-r border-[var(--border)] cursor-pointer" onClick={onToggleCollapse}>
        <div className="flex-1 flex flex-col items-center justify-start pt-4 opacity-20">
           <i className={`fa-solid ${isAr ? 'fa-chevron-left' : 'fa-chevron-right'} text-[0.6rem]`}></i>
        </div>
        <div className="flex-1 flex items-center justify-center">
           <BirdLogo className="w-8 h-8 text-[var(--accent)] opacity-40 hover:opacity-100 transition-opacity" />
        </div>
        <div className="flex-1 flex flex-col items-center justify-end pb-4">
           <button onClick={(e) => { e.stopPropagation(); onSettings(); }} className="p-2 text-zinc-600 hover:text-[var(--accent)]">
              <i className="fa-solid fa-gear text-lg"></i>
           </button>
        </div>
      </div>
    );
  }

  return (
    <>
      {Backdrop}
      <div className={`h-full flex flex-col shrink-0 bg-[var(--sidebar)] border-r border-[var(--border)] relative overflow-hidden transition-all duration-300 ${isAr ? 'rtl' : 'ltr'}`} style={sidebarStyle}>
        <div className="p-6 flex items-center justify-between">
           <button onClick={() => { onNew(); if(isMobile) onToggleCollapse(); }} className="flex items-center gap-2 group">
              <div className="w-8 h-8 rounded-lg bg-white flex items-center justify-center text-black">
                <i className="fa-solid fa-plus text-[0.7rem]"></i>
              </div>
              <span className="text-[0.7rem] font-black uppercase tracking-widest text-white group-hover:text-[var(--accent)] transition-colors">
                 {isAr ? 'تفاعل جديد' : 'New Interaction'}
              </span>
           </button>
           <button onClick={onToggleCollapse} className="text-zinc-600 hover:text-white p-2">
            <i className={`fa-solid ${isAr ? 'fa-chevron-right' : 'fa-chevron-left'} text-[0.7rem]`}></i>
          </button>
        </div>

        <div className="px-6 py-2 space-y-4">
          <div className="relative">
            <i className={`fa-solid fa-magnifying-glass absolute ${isAr ? 'right-3.5' : 'left-3.5'} top-1/2 -translate-y-1/2 text-[0.6rem] text-zinc-600`}></i>
            <input type="text" style={{ fontSize: `${fontSize * 0.9}px` }} placeholder={isAr ? 'بحث...' : 'Search chat...'} value={search} onChange={(e) => setSearch(e.target.value)}
              className={`w-full bg-[var(--surface)] border border-[var(--border)] rounded-lg py-2 ${isAr ? 'pr-9 pl-3' : 'pl-9 pr-3'} text-white outline-none placeholder:text-zinc-600`} />
          </div>
        </div>

        <div className="flex-1 overflow-y-auto px-4 py-6 space-y-1.5 custom-scrollbar">
          {filtered.map(s => (
            <div key={s.id} onClick={() => { onSelect(s.id); if(isMobile) onToggleCollapse(); }}
              className={`group p-3 rounded-lg cursor-pointer transition-all border relative flex items-center gap-3 ${activeId === s.id ? 'bg-[var(--surface)] border-[var(--border)]' : 'bg-transparent border-transparent hover:bg-white/[0.02]'}`}>
              <div className={`w-1 h-3 rounded-full shrink-0 ${activeId === s.id ? 'bg-[var(--accent)] shadow-[0_0_5px_var(--accent)]' : 'bg-zinc-800'}`}></div>
              <div className="flex-1 min-w-0">
                <div className={`font-bold truncate ${activeId === s.id ? 'text-white' : 'text-zinc-500'}`} style={{ fontSize: `${fontSize}px` }}>{s.title}</div>
                <div className="text-[0.7rem] text-zinc-600 mt-1 font-mono uppercase font-bold">
                  {new Date(s.createdAt).toLocaleDateString(isAr ? 'ar-SA' : 'en-US')}
                </div>
              </div>
              <button onClick={(e) => { e.stopPropagation(); onDelete(s.id); }} className="opacity-0 group-hover:opacity-100 p-1.5 text-zinc-800 hover:text-red-500 transition-all">
                <i className="fa-solid fa-trash-can text-[0.6rem]"></i>
              </button>
            </div>
          ))}
        </div>

        <div className="p-4 border-t border-[var(--border)] bg-[var(--surface)]/10 flex flex-col gap-4">
          <div className="flex items-center gap-3 py-2 px-1">
            <BirdLogo className="w-9 h-9 text-[var(--accent)] opacity-50 shrink-0" />
            <div className="flex flex-col min-w-0">
               <div className="flex items-center gap-1.5">
                  <span className="text-[0.8rem] font-black text-white uppercase italic truncate tracking-tight">{AI_NAME}</span>
                  <span className="text-[0.5rem] font-bold text-[var(--accent)] uppercase shrink-0">({isAr ? 'تجريبي' : 'Beta'})</span>
               </div>
               <div className="flex items-center gap-2">
                 <div className={`w-1 h-1 rounded-full ${mcpStatus ? 'bg-[var(--accent)] pulse-accent' : 'bg-red-500'}`}></div>
                 <span className="text-[0.45rem] text-zinc-600 font-bold uppercase tracking-tight truncate leading-none">
                   {isAr ? 'بواسطة فهد' : 'Made in Saudi, By Fahd'}
                 </span>
               </div>
            </div>
          </div>
          <button onClick={() => { onSettings(); if(isMobile) onToggleCollapse(); }} className="w-full py-3 bg-transparent border border-[var(--border)] rounded-lg font-black text-zinc-400 flex items-center justify-center gap-3 hover:bg-[var(--surface)] hover:text-white transition-all" style={{ fontSize: `${fontSize * 0.8}px` }}>
            <i className="fa-solid fa-gear text-lg"></i>
            <span className="text-sm uppercase tracking-widest">{isAr ? 'الإعدادات' : 'Settings'}</span>
          </button>
        </div>
      </div>
    </>
  );
};

export default Sidebar;