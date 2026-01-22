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

  const sidebarStyle: React.CSSProperties = isMobile 
    ? {
        position: 'fixed',
        top: 0,
        left: language === 'ar' ? 'auto' : 0,
        right: language === 'ar' ? 0 : 'auto',
        zIndex: 100,
        width: '280px',
        transform: isCollapsed ? (language === 'ar' ? 'translateX(100%)' : 'translateX(-100%)') : 'translateX(0)',
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
        <i className={`fa-solid ${language === 'ar' ? 'fa-chevron-left' : 'fa-chevron-right'} text-[0.6rem] opacity-20 mb-4`}></i>
        <div className="flex-1" />
        <BirdLogo className="w-8 h-8 text-[var(--accent)] opacity-40 hover:opacity-100 transition-opacity" />
        <div className="flex-1" />
        <button onClick={(e) => { e.stopPropagation(); onSettings(); }} className="p-2 text-zinc-600 hover:text-[var(--accent)] mt-auto">
          <i className="fa-solid fa-gear text-lg"></i>
        </button>
      </div>
    );
  }

  return (
    <>
      {Backdrop}
      <div className={`h-full flex flex-col shrink-0 bg-[var(--sidebar)] border-r border-[var(--border)] relative overflow-hidden transition-all duration-300 ${language === 'ar' ? 'rtl' : 'ltr'}`} style={sidebarStyle}>
        <div className="p-6 flex items-center justify-between">
          <div className="flex flex-col">
            <div className="flex items-center gap-2">
              <h1 className="text-sm font-extrabold tracking-tight text-white uppercase italic">{AI_NAME}</h1>
              <span className="text-[0.55rem] font-bold text-[var(--accent)] uppercase">{language === 'ar' ? '(تجريبي)' : '(Beta)'}</span>
            </div>
            <div className="flex items-center gap-2 mt-1">
                <div className={`w-1 h-1 rounded-full ${mcpStatus ? 'bg-[var(--accent)] pulse-accent' : 'bg-red-500'}`}></div>
                <span className="text-[0.5rem] text-[var(--text-dim)] font-bold uppercase tracking-widest">{language === 'ar' ? 'صنع في السعودية، بواسطة فهد' : 'Made in Saudi, By Fahd'}</span>
            </div>
          </div>
          <button onClick={onToggleCollapse} className="text-zinc-600 hover:text-white p-2">
            <i className={`fa-solid ${language === 'ar' ? 'fa-chevron-right' : 'fa-chevron-left'} text-[0.7rem]`}></i>
          </button>
        </div>

        <div className="px-6 py-2 space-y-4">
          <button onClick={() => { onNew(); if(isMobile) onToggleCollapse(); }} className="w-full py-3 bg-white text-black rounded-lg flex items-center justify-center gap-2 font-extrabold text-[0.75rem] uppercase tracking-widest hover:opacity-90">
            <i className="fa-solid fa-plus text-[0.7rem]"></i>
            {language === 'ar' ? 'بدء تفاعل' : 'New Interaction'}
          </button>
          <div className="relative">
            <i className={`fa-solid fa-magnifying-glass absolute ${language === 'ar' ? 'right-3.5' : 'left-3.5'} top-1/2 -translate-y-1/2 text-[0.6rem] text-zinc-600`}></i>
            <input type="text" style={{ fontSize: `${fontSize * 0.9}px` }} placeholder={language === 'ar' ? 'بحث...' : 'Search chat...'} value={search} onChange={(e) => setSearch(e.target.value)}
              className={`w-full bg-[var(--surface)] border border-[var(--border)] rounded-lg py-2 ${language === 'ar' ? 'pr-9 pl-3' : 'pl-9 pr-3'} text-white outline-none placeholder:text-zinc-600`} />
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
                  {new Date(s.createdAt).toLocaleDateString(language === 'ar' ? 'ar-SA' : 'en-US')}
                </div>
              </div>
              <button onClick={(e) => { e.stopPropagation(); onDelete(s.id); }} className="opacity-0 group-hover:opacity-100 p-1.5 text-zinc-800 hover:text-red-500 transition-all">
                <i className="fa-solid fa-trash-can text-[0.6rem]"></i>
              </button>
            </div>
          ))}
        </div>

        <div className="p-4 border-t border-[var(--border)] bg-[var(--surface)]/10 flex flex-col gap-4">
          <div className="flex items-center justify-center py-2">
            <BirdLogo className="w-8 h-8 text-[var(--accent)] opacity-40" />
          </div>
          <button onClick={() => { onSettings(); if(isMobile) onToggleCollapse(); }} className="w-full py-3 bg-transparent border border-[var(--border)] rounded-lg font-black text-zinc-400 flex items-center justify-center gap-3 hover:bg-[var(--surface)] hover:text-white transition-all" style={{ fontSize: `${fontSize * 0.8}px` }}>
            <i className="fa-solid fa-gear text-lg"></i>
            <span className="text-sm uppercase tracking-widest">{language === 'ar' ? 'الإعدادات' : 'Settings'}</span>
          </button>
        </div>
      </div>
    </>
  );
};

export default Sidebar;
