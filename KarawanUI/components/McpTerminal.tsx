import React, { useState, useEffect } from 'react';
import { McpNode } from '../types.ts';
import { McpService } from '../services/mcpService.ts';

interface McpTerminalProps {
  width: number;
  isOpen: boolean;
  mcpService: McpService;
  mcpHealth: boolean;
  onClose: () => void;
  onInject: (content: string, name: string) => void;
}

const McpTerminal: React.FC<McpTerminalProps> = ({ width, isOpen, mcpService, mcpHealth, onClose, onInject }) => {
  const [nodes, setNodes] = useState<McpNode[]>([]);
  const [currentPath, setCurrentPath] = useState('/');
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState(false);

  useEffect(() => {
    if (isOpen && mcpHealth) {
      loadFiles(currentPath);
    }
  }, [isOpen, currentPath, mcpHealth]);

  const loadFiles = async (path: string) => {
    setIsLoading(true);
    setError(false);
    const files = await mcpService.listFiles(path);
    if (files === null) {
      setError(true);
      setNodes([]);
    } else {
      setNodes(files);
    }
    setIsLoading(false);
  };

  const handleNodeClick = async (node: McpNode) => {
    if (node.type === 'directory') {
      setCurrentPath(node.path);
    } else {
      setIsLoading(true);
      const content = await mcpService.readFile(node.path);
      onInject(content, node.name);
      setIsLoading(false);
    }
  };

  const isMobile = typeof window !== 'undefined' && window.innerWidth < 768;

  const drawerStyle: React.CSSProperties = {
    position: 'fixed',
    top: 0,
    right: 0,
    bottom: 0,
    zIndex: 150,
    width: isMobile ? '100%' : `${width}px`,
    transform: isOpen ? 'translateX(0)' : 'translateX(100%)',
    transition: 'transform 0.4s cubic-bezier(0.16, 1, 0.3, 1)',
  };

  return (
    <>
      {isOpen && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm z-[140] animate-in fade-in duration-300" onClick={onClose} />
      )}
      
      <div className="flex flex-col bg-[var(--sidebar)] border-l border-[var(--border)] overflow-hidden shadow-2xl" style={drawerStyle}>
        <div className="p-5 flex items-center justify-between border-b border-[var(--border)] bg-black/20">
          <div>
            <h3 className="font-extrabold text-white text-[0.8rem] uppercase tracking-tighter flex items-center gap-3">
              <i className={`fa-solid fa-microchip ${mcpHealth ? 'text-[var(--accent)]' : 'text-red-500'}`}></i>
              Workspace
            </h3>
            <div className={`text-[0.5rem] font-black uppercase tracking-widest mt-0.5 ${mcpHealth ? 'text-zinc-700' : 'text-red-900 animate-pulse'}`}>
              {mcpHealth ? 'FILESYSTEM_BRIDGE_ACTIVE' : 'BRIDGE_CONNECTION_LOST'}
            </div>
          </div>
          <button onClick={onClose} className="w-10 h-10 rounded-xl bg-white/5 flex items-center justify-center text-zinc-600 hover:text-white transition-all">
            <i className="fa-solid fa-xmark text-[1rem]"></i>
          </button>
        </div>

        <div className="flex-1 overflow-y-auto p-5 space-y-6 custom-scrollbar">
          {!mcpHealth ? (
            <div className="h-full flex flex-col items-center justify-center text-center p-8">
              <div className="w-16 h-16 rounded-3xl bg-red-500/10 border border-red-500/20 flex items-center justify-center text-red-500 mb-6">
                <i className="fa-solid fa-link-slash text-2xl"></i>
              </div>
              <h4 className="text-[0.7rem] font-black text-white uppercase tracking-widest mb-2">Bridge Offline</h4>
              <p className="text-[0.6rem] text-zinc-700 font-bold uppercase leading-relaxed mb-6">Start your MCP local bridge server to sync system nodes.</p>
              <button onClick={() => mcpService.checkHealth()} className="px-6 py-3 bg-white text-black rounded-xl text-[0.6rem] font-black uppercase tracking-widest hover:brightness-90 transition-all">
                Attempt Reconnect
              </button>
            </div>
          ) : (
            <>
              <div className="flex items-center gap-2 mb-4 bg-black/40 p-3 rounded-xl border border-white/5">
                <button 
                  onClick={() => setCurrentPath('/')} 
                  disabled={currentPath === '/'}
                  className={`px-3 py-1.5 rounded-lg text-[0.6rem] font-bold transition-all ${currentPath === '/' ? 'text-zinc-800' : 'bg-white/5 text-zinc-400 hover:text-white hover:bg-white/10'}`}>
                  ROOT
                </button>
                <span className="text-[0.6rem] font-mono text-zinc-600 truncate flex-1">{currentPath}</span>
              </div>

              <div className="space-y-2">
                {isLoading ? (
                  <div className="p-12 flex flex-col items-center justify-center gap-4">
                    <div className="w-8 h-8 border-2 border-[var(--accent)] border-t-transparent rounded-full animate-spin"></div>
                    <span className="text-[0.6rem] font-black text-zinc-800 uppercase tracking-widest">Scanning Nodes...</span>
                  </div>
                ) : error ? (
                  <div className="p-12 text-center border border-dashed border-red-900/30 rounded-3xl bg-red-950/5">
                    <i className="fa-solid fa-triangle-exclamation text-red-900 text-3xl mb-4"></i>
                    <p className="text-[0.6rem] text-red-900 font-bold uppercase italic">Sector Scan Error</p>
                    <button onClick={() => loadFiles(currentPath)} className="mt-4 text-[0.55rem] text-zinc-600 underline">RETRY_SCAN</button>
                  </div>
                ) : nodes.length === 0 ? (
                  <div className="p-12 text-center border border-dashed border-zinc-900 rounded-3xl">
                    <i className="fa-solid fa-box-open text-zinc-900 text-3xl mb-4"></i>
                    <p className="text-[0.65rem] text-zinc-800 font-bold uppercase italic">Sector is empty.</p>
                  </div>
                ) : (
                  nodes.map(node => (
                    <div key={node.path} onClick={() => handleNodeClick(node)}
                      className="flex items-center gap-4 px-4 py-4 bg-white/[0.02] hover:bg-white/[0.05] rounded-2xl cursor-pointer group transition-all border border-white/5 active:scale-98">
                      <div className="w-10 h-10 rounded-xl bg-black/40 flex items-center justify-center border border-white/5 group-hover:border-[var(--accent)]/30 transition-all">
                        <i className={`fa-solid ${node.type === 'directory' ? 'fa-folder text-yellow-500/40' : 'fa-file-code text-blue-500/60'} text-[1.1rem]`}></i>
                      </div>
                      <div className="flex-1 min-w-0 text-left">
                        <div className="text-[0.8rem] text-zinc-400 font-bold truncate group-hover:text-white">{node.name}</div>
                        <div className="text-[0.55rem] text-zinc-700 font-black uppercase mt-1 tracking-widest">{node.type.toUpperCase()}</div>
                      </div>
                    </div>
                  ))
                )}
              </div>
            </>
          )}
        </div>
        
        <div className="p-4 border-t border-[var(--border)] bg-black/20">
          <div className="text-[0.5rem] font-mono text-zinc-800 text-center uppercase tracking-widest">
            Bridge v1.2 // Status: {mcpHealth ? 'ENCRYPTED_SYNC' : 'LINK_VOID'}
          </div>
        </div>
      </div>
    </>
  );
};

export default McpTerminal;