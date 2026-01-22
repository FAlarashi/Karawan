import React, { useState, useEffect, useRef } from 'react';
import { AI_NAME } from '../constants.tsx';

interface CommandRunnerProps {
  logs: string[];
  onClose: () => void;
  onCommand: (cmd: string) => void;
}

const CommandRunner: React.FC<CommandRunnerProps> = ({ logs, onClose, onCommand }) => {
  const [input, setInput] = useState('');
  const logEndRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    logEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [logs]);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!input.trim()) return;
    onCommand(input);
    setInput('');
  };

  return (
    <div className="w-full h-full bg-black border border-white/10 rounded-3xl overflow-hidden shadow-[0_0_100px_rgba(0,0,0,0.8)] flex flex-col backdrop-blur-3xl ring-1 ring-white/5 relative">
      <div className="px-8 py-5 border-b border-white/5 bg-white/5 flex items-center justify-between">
        <div className="flex items-center gap-4">
           <div className="flex gap-2"><div className="w-3 h-3 rounded-full bg-red-500/40"></div><div className="w-3 h-3 rounded-full bg-yellow-500/40"></div><div className="w-3 h-3 rounded-full bg-green-500/40"></div></div>
           <span className="text-[0.65rem] font-black uppercase tracking-[0.4em] text-zinc-600 ml-6 italic">{AI_NAME}_Neural_Shell_v12</span>
        </div>
        <button onClick={onClose} className="w-9 h-9 rounded-lg bg-white/5 flex items-center justify-center text-zinc-600 hover:text-white transition-all"><i className="fa-solid fa-xmark text-[1.1rem]"></i></button>
      </div>
      
      <div className="flex-1 p-8 font-mono text-[0.8rem] overflow-y-auto space-y-2 custom-scrollbar bg-black/60">
        {logs.length === 0 && <div className="text-zinc-800 text-[0.7rem] font-black uppercase tracking-widest mt-4">Waiting for system bridge output...</div>}
        {logs.map((log, i) => (
          <div key={i} className="flex gap-5 border-b border-white/2 pb-1.5 last:border-0">
            <span className="opacity-10 select-none text-zinc-500 w-12 shrink-0">[{i.toString().padStart(3, '0')}]</span>
            <span className={`leading-relaxed font-medium break-all ${
                log.includes('[STDERR]') || log.includes('[ERR]') ? 'text-red-400' : 
                log.includes('[RUN]') ? 'text-cyan-400' : 
                log.includes('[STDOUT]') ? 'text-green-400/80' : 
                'text-zinc-500'
            }`}>
                {log.replace(/\[(STDOUT|STDERR|RUN|ERR)\]\s/, '')}
            </span>
          </div>
        ))}
        <div ref={logEndRef} className="h-4" />
      </div>

      <form onSubmit={handleSubmit} className="p-6 border-t border-white/5 bg-black/40 flex items-center gap-6">
        <span className="text-[var(--accent)] font-bold text-[1.1rem] ml-2">$</span>
        <input type="text" value={input} onChange={e => setInput(e.target.value)} placeholder="System Command..." className="flex-1 bg-transparent border-none outline-none text-[1rem] text-white font-mono placeholder:text-zinc-900" autoFocus />
      </form>

      {/* CRT Scanline Overlay */}
      <div className="pointer-events-none absolute inset-0 bg-[linear-gradient(rgba(18,16,16,0)_50%,rgba(0,0,0,0.1)_50%),linear-gradient(90deg,rgba(255,0,0,0.03),rgba(0,255,0,0.01),rgba(0,0,255,0.03))] z-10 bg-[length:100%_2px,3px_100%] opacity-40"></div>
    </div>
  );
};

export default CommandRunner;