import React from 'react';

/** 
 * ============================================================
 * 🛠️ USER CONFIGURATION
 * ============================================================
 */
export const AI_NAME = "Karawan"; 
export const AI_DESCRIPTION = "AI_ARCHITECT // CREST_VERSION_v15";
export const DEFAULT_OLLAMA_URL = "http://localhost:11434"; 
export const DEFAULT_MODEL = "llama3";

/**
 * Cockatiel Logo SVG - Simplified shadow/silhouette version.
 */
export const CockatielLogo: React.FC<{ className?: string }> = ({ className }) => (
  <div className={className}>
    <svg viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg" className="w-full h-full">
      {/* Simple Crest (Shadow) */}
      <path d="M10 6C10 6 9 2 12 1.5M10 7C10 4 11.5 3 14.5 3" stroke="currentColor" strokeWidth="1.2" strokeLinecap="round" />
      
      {/* Head Silhouette Profile */}
      <path d="M4 16C4 11 6 8 10 8C14 8 18 10 18 14C18 18 15 21 10 22" stroke="currentColor" strokeWidth="1.2" fill="none" strokeLinecap="round" />
      
      {/* Eye (Shadow Highlight) */}
      <circle cx="9" cy="13" r="0.6" fill="currentColor" />
      
      {/* Orange Cheek Patch - The defining feature */}
      <circle cx="13.5" cy="15" r="2.2" fill="#f97316" fillOpacity="0.95" />
      
      {/* Simple Beak Profile */}
      <path d="M18 14L21 15.5L18.5 17.5" fill="currentColor" fillOpacity="0.6" />
    </svg>
  </div>
);

export const BirdLogo = CockatielLogo;
export const SkullLogo = CockatielLogo;
export const BirdWingsLogo = CockatielLogo;

export const MortisStatus: React.FC<{ running: boolean; lang?: string }> = ({ running, lang }) => (
  <div className="flex items-center gap-3 px-4 py-2 bg-white/2 border border-white/5 rounded-sm">
    <div className={`w-1.5 h-1.5 ${running ? 'bg-emerald-500' : 'bg-red-500 animate-pulse'}`}></div>
    <span className="text-[9px] font-black uppercase tracking-[0.2em] text-zinc-500">
      {lang === 'ar' ? 'نظام كروان:' : 'KARAWAN:'} {running ? (lang === 'ar' ? 'متصل' : 'ONLINE') : (lang === 'ar' ? 'مقطوع' : 'LOST')}
    </span>
  </div>
);

export const McpStatus: React.FC<{ active: boolean; lang?: string }> = ({ active, lang }) => (
  <div className="flex items-center gap-3 px-4 py-2 bg-white/2 border border-white/5 rounded-sm mt-1">
    <div className={`w-1.5 h-1.5 ${active ? 'bg-blue-500 shadow-[0_0_8px_rgba(59,130,246,0.5)]' : 'bg-zinc-800'}`}></div>
    <span className="text-[9px] font-black uppercase tracking-[0.2em] text-zinc-500">
      {lang === 'ar' ? 'ربط MCP (تجريبي):' : 'MCP (EXPERIMENTAL):'} {active ? (lang === 'ar' ? 'مرتبط' : 'LINKED') : (lang === 'ar' ? 'مقطوع' : 'VOID')}
    </span>
  </div>
);