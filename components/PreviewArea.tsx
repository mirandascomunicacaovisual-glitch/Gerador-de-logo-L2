
import React from 'react';
import { GenerationStatus } from '../types';

interface PreviewAreaProps {
  image: string | null;
  status: GenerationStatus;
  serverName: string;
  onUndo?: () => void;
  canUndo?: boolean;
}

const PreviewArea: React.FC<PreviewAreaProps> = ({ image, status, serverName, onUndo, canUndo }) => {
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
            <i className="fa-solid fa-circle-exclamation text-6xl text-red-500 mb-6"></i>
            <h3 className="text-xl font-cinzel text-white mb-2 uppercase tracking-widest font-black">Erro na Forja</h3>
            <p className="text-gray-400 text-sm mb-4 max-w-sm mx-auto">
              Não foi possível gerar a imagem. Verifique sua conexão ou tente uma descrição diferente.
            </p>
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
              Forjando Tipografia...
            </p>
          </div>
        )}
      </div>

      {image && status !== GenerationStatus.LOADING && status !== GenerationStatus.ERROR && (
        <div className="absolute -bottom-16 left-0 right-0 flex justify-center gap-4 animate-in fade-in slide-in-from-bottom-4 duration-500">
          <button 
            onClick={() => {
              const link = document.createElement('a');
              link.href = image;
              link.download = `${serverName || 'l2-logo'}.png`;
              link.click();
            }}
            className="px-6 py-3 bg-amber-500 text-black rounded-xl text-xs font-bold uppercase tracking-widest transition-all flex items-center gap-2 shadow-xl hover:bg-amber-400"
          >
            <i className="fa-solid fa-download"></i> Baixar Logo
          </button>
        </div>
      )}
    </div>
  );
};

export default PreviewArea;
