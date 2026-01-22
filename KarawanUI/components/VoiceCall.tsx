import React, { useState, useEffect, useRef } from 'react';
import { SkullLogo } from '../constants';

interface VoiceCallProps {
  onClose: () => void;
  activeModel: string;
  onTranscript: (text: string) => Promise<void>;
  waitForFinish: boolean;
}

const VoiceCall: React.FC<VoiceCallProps> = ({ onClose, activeModel, onTranscript, waitForFinish }) => {
  const [isListening, setIsListening] = useState(false);
  const [isProcessing, setIsProcessing] = useState(false);
  const [status, setStatus] = useState('STANDBY');
  const [bars, setBars] = useState<number[]>(new Array(32).fill(2));
  
  const recognitionRef = useRef<any>(null);

  useEffect(() => {
    const SpeechRecognition = (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition;
    if (SpeechRecognition) {
      recognitionRef.current = new SpeechRecognition();
      recognitionRef.current.continuous = false;
      recognitionRef.current.interimResults = false;

      recognitionRef.current.onresult = async (event: any) => {
        const text = event.results[0][0].transcript;
        setStatus('TRANSMITTING...');
        setIsProcessing(true);
        setIsListening(false);
        await onTranscript(text);
        setIsProcessing(false);
        setStatus('LINK_ESTABLISHED');
        
        // Auto-relisten if continuous (not implemented here fully for safety, but logic exists)
      };

      recognitionRef.current.onend = () => {
        if (!isProcessing) {
          setIsListening(false);
          setStatus('READY_FOR_VOICE');
        }
      };
    }

    const interval = setInterval(() => {
      setBars(prev => prev.map(() => 
        (isListening || isProcessing) ? Math.floor(Math.random() * 80) + 5 : 2
      ));
    }, 100);

    return () => {
      clearInterval(interval);
      if (recognitionRef.current) recognitionRef.current.stop();
    };
  }, [isProcessing, isListening]);

  const toggleListen = () => {
    if (isListening) {
      recognitionRef.current?.stop();
      setIsListening(false);
    } else {
      setIsListening(true);
      setStatus('LISTENING...');
      recognitionRef.current?.start();
    }
  };

  return (
    <div className="fixed inset-0 z-[200] bg-black/95 flex flex-col items-center justify-center p-12 animate-in fade-in duration-500 backdrop-blur-2xl">
      <div className="max-w-4xl w-full flex flex-col items-center border border-white/5 p-16 relative rounded-[3rem]">
        <div className="absolute top-0 left-0 w-12 h-12 border-t-2 border-l-2 border-[var(--theme-accent)]/20"></div>
        <div className="absolute top-0 right-0 w-12 h-12 border-t-2 border-r-2 border-[var(--theme-accent)]/20"></div>
        <div className="absolute bottom-0 left-0 w-12 h-12 border-b-2 border-l-2 border-[var(--theme-accent)]/20"></div>
        <div className="absolute bottom-0 right-0 w-12 h-12 border-b-2 border-r-2 border-[var(--theme-accent)]/20"></div>

        <div className="mb-20">
          <SkullLogo className="w-40 h-40 text-[var(--theme-accent)] opacity-20 animate-pulse" />
        </div>

        <div className="text-center mb-20">
          <div className="text-[11px] text-zinc-600 font-black tracking-[1em] uppercase mb-8">Neural_Audio_Interface</div>
          <h2 className="text-5xl md:text-7xl font-black text-white mb-10 tracking-tighter uppercase italic drop-shadow-2xl">{status}</h2>
          <div className="inline-block px-6 py-2 border border-zinc-800 text-xs text-zinc-600 font-black tracking-widest rounded-lg">
            ENGINE: {activeModel.toUpperCase()}
          </div>
        </div>

        <div className="flex items-center justify-center gap-2 h-32 w-full mb-20 px-16">
          {bars.map((height, i) => (
            <div 
              key={i} 
              className="flex-1 bg-zinc-900 transition-all duration-150 rounded-full"
              style={{ 
                height: `${height}%`, 
                backgroundColor: (isListening || isProcessing) ? 'var(--theme-accent)' : '#18181b',
              }}
            />
          ))}
        </div>

        <div className="flex items-center gap-16">
          <button onClick={onClose} className="w-24 h-24 border border-white/10 text-zinc-600 hover:text-red-500 hover:border-red-500/30 transition-all flex items-center justify-center text-4xl rounded-3xl">
            <i className="fa-solid fa-xmark"></i>
          </button>
          
          <button 
            onClick={toggleListen}
            disabled={isProcessing}
            className={`w-40 h-40 flex items-center justify-center text-6xl transition-all border-4 disabled:opacity-20 rounded-[2.5rem] shadow-2xl ${
              isListening ? 'bg-white text-black border-white' : 'bg-transparent text-white border-white/10 hover:border-white shadow-purple-500/10'
            }`}
          >
            <i className={`fa-solid ${isListening ? 'fa-square' : 'fa-microphone'}`}></i>
          </button>

          <button className="w-24 h-24 border border-white/10 text-zinc-600 hover:text-white transition-all flex items-center justify-center text-3xl rounded-3xl">
            <i className="fa-solid fa-waveform-lines"></i>
          </button>
        </div>

        <div className="mt-20 text-[10px] text-zinc-800 uppercase tracking-[0.4em] font-black text-center leading-relaxed">
           AUTH_TOKEN: SYNCED // RSA_4096_LOCKED<br/>
           WAIT_FOR_FINISH: {waitForFinish ? 'ENABLED' : 'DISABLED'}
        </div>
      </div>
    </div>
  );
};

export default VoiceCall;