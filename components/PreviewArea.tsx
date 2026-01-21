
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
}

const PreviewArea: React.FC<PreviewAreaProps> = ({ image, status, serverName, onUndo, canUndo, onSelectKey, isRetrying }) => {
  return (
    <div className="w-full max-w-2xl aspect-square relative group">
      {/* Decorative corners */}
      <div className="absolute -top-2 -left-2 w-12 h-12 border-t-2 border-l-2 border-amber-500/50 z-10"></div>
      <div className="absolute -top-2 -right-2 w-12 h-12 border-t-2 border-r-2 border-amber-500/50 z-10"></div>
      <div className="absolute -bottom-2 -left-2 w-12 h-12 border-b-2 border-l-2 border-amber-500/50 z-10"></div>
      <div className="absolute -bottom-2 -right-2 w-12 h-12 border-b-2 border-r-2 border-amber-500/50 z-10"></div>

      <div className="w-full h-full bg-black/40 border border-white/10 rounded-lg overflow-hidden flex items-center justify-center relative backdrop-blur-sm shadow-[0_0_50px_rgba(0,0,0,0.5)]">
        {status === GenerationStatus.ERROR ? (
          <div className="text-center p-8 animate-in fade-in zoom-in duration-300">
            <div className="mb-6 relative">
              <i className="fa-solid fa-triangle-exclamation text-6xl text-amber-500 animate-pulse"></i>
              <div className="absolute -top-1 -right-1 w-4 h-4 bg-red-500 rounded-full border-2 border-[#050507]"></div>
            </div>
            <h3 className="text-xl font-cinzel text-white mb-2 uppercase tracking-widest font-black">Acesso Necessário</h3>
            <p className="text-gray-400 text-sm mb-8 max-w-sm mx-auto leading-relaxed">
              O limite de uso gratuito foi atingido ou a conta precisa de autenticação. Conecte-se com sua conta Google para continuar.
            </p>
            {onSelectKey && (
              <button 
                type="button"
                onClick={(e) => {
                  e.preventDefault();
                  onSelectKey();
                }}
                className="px-10 py-5 bg-amber-500 text-black font-black rounded-2xl uppercase tracking-[0.15em] text-sm hover:bg-amber-400 transition-all shadow-[0_20px_50px_rgba(245,158,11,0.4)] flex items-center gap-4 mx-auto active:scale-95 group"
              >
                <i className="fa-brands fa-google text-xl group-hover:rotate-12 transition-transform"></i>
                Reconectar com Google
              </button>
            )}
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
            <p className="mt-4 text-gray-500 font-light tracking-widest uppercase text-xs">
              Configure e clique em 'Forjar Logomarca'
            </p>
          </div>
        )}

        {status === GenerationStatus.LOADING && (
          <div className="absolute inset-0 flex flex-col items-center justify-center bg-black/60 z-20 backdrop-blur-md">
            <div className="relative w-24 h-24 mb-6">
              <div className="absolute inset-0 border-4 border-amber-500/20 rounded-full"></div>
              <div className="absolute inset-0 border-4 border-amber-500 border-t-transparent rounded-full animate-spin"></div>
              <i className="fa-solid fa-hammer absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 text-2xl text-amber-500"></i>
            </div>
            <p className="text-amber-500 font-cinzel text-xl animate-pulse tracking-[0.2em] uppercase font-black text-center px-4">
              {isRetrying ? 'Sincronizando Canais...' : 'Forjando Tipografia Estilizada...'}
            </p>
            <p className="text-white/30 text-[10px] uppercase mt-2 tracking-widest">Renderização 3D Premium</p>
          </div>
        )}
      </div>

      {image && status !== GenerationStatus.LOADING && status !== GenerationStatus.ERROR && (
        <div className="absolute -bottom-16 left-0 right-0 flex justify-center gap-4 animate-in fade-in slide-in-from-bottom-4 duration-500">
          {canUndo && (
            <button 
              onClick={onUndo}
              className="px-6 py-3 bg-red-500/20 hover:bg-red-500/30 border border-red-500/30 text-red-500 rounded-xl text-xs font-bold uppercase tracking-widest transition-all flex items-center gap-2"
            >
              <i className="fa-solid fa-rotate-left"></i> Desfazer
            </button>
          )}
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
