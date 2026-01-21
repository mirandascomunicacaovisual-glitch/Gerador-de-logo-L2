
import React from 'react';
import { GenerationStatus } from '../types';

interface PreviewAreaProps {
  image: string | null;
  status: GenerationStatus;
  serverName: string;
  onUndo?: () => void;
  canUndo?: boolean;
  onSelectKey?: () => void;
  isRetrying?: boolean;
  detailedError?: string | null;
}

const PreviewArea: React.FC<PreviewAreaProps> = ({ image, status, serverName, onUndo, canUndo, onSelectKey, isRetrying, detailedError }) => {
  return (
    <div className="w-full max-w-2xl aspect-square relative group">
      <div className="absolute -top-2 -left-2 w-12 h-12 border-t-2 border-l-2 border-amber-500/50 z-10"></div>
      <div className="absolute -top-2 -right-2 w-12 h-12 border-t-2 border-r-2 border-amber-500/50 z-10"></div>
      <div className="absolute -bottom-2 -left-2 w-12 h-12 border-b-2 border-l-2 border-amber-500/50 z-10"></div>
      <div className="absolute -bottom-2 -right-2 w-12 h-12 border-b-2 border-r-2 border-amber-500/50 z-10"></div>

      <div className="w-full h-full bg-black/40 border border-white/10 rounded-lg overflow-hidden flex items-center justify-center relative backdrop-blur-sm shadow-[0_0_50px_rgba(0,0,0,0.5)]">
        {status === GenerationStatus.ERROR ? (
          <div className="text-center p-8 animate-in fade-in zoom-in duration-300">
            <div className="mb-6 relative">
              <i className="fa-solid fa-triangle-exclamation text-6xl text-amber-500"></i>
            </div>
            <h3 className="text-xl font-cinzel text-white mb-2 uppercase tracking-widest font-black">Falha na Forja</h3>
            
            <div className="bg-red-500/5 border border-red-500/20 rounded-xl p-4 mb-8 max-w-sm mx-auto">
              <p className="text-red-400 text-[11px] leading-relaxed font-mono break-words">
                {detailedError || "Ocorreu um erro inesperado na comunicação com a IA."}
              </p>
            </div>

            <div className="flex flex-col gap-3">
              {onSelectKey && (
                <button 
                  onClick={onSelectKey}
                  className="px-8 py-4 bg-amber-500 text-black font-black rounded-xl uppercase tracking-widest text-xs hover:bg-amber-400 transition-all shadow-lg flex items-center gap-3 mx-auto"
                >
                  <i className="fa-brands fa-google"></i>
                  Vincular Conta Paga
                </button>
              )}
            </div>
          </div>
        ) : image ? (
          <img 
            src={image} 
            alt="Generated Logo" 
            className={`w-full h-full object-contain transition-all duration-700 ${status === GenerationStatus.LOADING ? 'opacity-40 blur-sm scale-95' : 'opacity-100 blur-0 scale-100'}`}
          />
        ) : (
          <div className="text-center p-8">
            <div className="mb-6 opacity-20">
              <i className="fa-solid fa-shield-halved text-8xl text-amber-500"></i>
            </div>
            <h2 className="text-3xl font-cinzel font-black text-white/40 tracking-widest uppercase">
              {serverName || 'Aguardando Forja'}
            </h2>
            <p className="mt-4 text-gray-500 font-light tracking-widest uppercase text-[10px]">
              Configure os detalhes e clique em 'Forjar Logomarca'
            </p>
          </div>
        )}

        {status === GenerationStatus.LOADING && (
          <div className="absolute inset-0 flex flex-col items-center justify-center bg-black/80 z-20 backdrop-blur-md">
            <div className="relative w-20 h-20 mb-6">
              <div className="absolute inset-0 border-2 border-amber-500/20 rounded-full"></div>
              <div className="absolute inset-0 border-2 border-amber-500 border-t-transparent rounded-full animate-spin"></div>
              <i className="fa-solid fa-hammer absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 text-xl text-amber-500"></i>
            </div>
            <p className="text-amber-500 font-cinzel text-lg animate-pulse tracking-widest uppercase font-black">
              Sincronizando Modelos...
            </p>
            <p className="text-white/20 text-[9px] uppercase mt-2 tracking-widest">Tentando modelos disponíveis no pool</p>
          </div>
        )}
      </div>

      {image && status !== GenerationStatus.LOADING && status !== GenerationStatus.ERROR && (
        <div className="absolute -bottom-16 left-0 right-0 flex justify-center gap-4">
          <button 
            onClick={() => {
              const link = document.createElement('a');
              link.href = image;
              link.download = `${serverName || 'l2-logo'}.png`;
              link.click();
            }}
            className="px-6 py-3 bg-white/10 hover:bg-white/20 border border-white/10 text-white rounded-xl text-xs font-bold uppercase tracking-widest transition-all flex items-center gap-2"
          >
            <i className="fa-solid fa-download"></i> Baixar PNG
          </button>
        </div>
      )}
    </div>
  );
};

export default PreviewArea;
