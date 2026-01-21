
import React from 'react';
import { LogoConfig, GenerationStatus } from '../types';

interface SidebarProps {
  config: LogoConfig;
  setConfig: React.Dispatch<React.SetStateAction<LogoConfig>>;
  onGenerate: () => void;
  status: GenerationStatus;
  onSelectKey?: () => void;
  hasKey?: boolean;
}

const Sidebar: React.FC<SidebarProps> = ({ config, setConfig, onGenerate, status, onSelectKey, hasKey }) => {
  return (
    <aside className="w-80 h-full glass border-r border-white/10 p-6 hidden lg:flex flex-col gap-6 overflow-y-auto">
      <div className="flex items-center gap-4 mb-2">
        <div className="w-12 h-12 bg-amber-500 rounded-2xl flex items-center justify-center shadow-lg transform rotate-3 hover:rotate-0 transition-transform">
          <i className="fa-solid fa-compass-drafting text-2xl text-black"></i>
        </div>
        <div>
          <h1 className="text-xl font-cinzel font-black tracking-widest text-white leading-none">FORGE</h1>
          <span className="text-[10px] text-amber-500 font-bold uppercase tracking-[0.3em]">Studio Pro</span>
        </div>
      </div>

      {/* Central de Contas Dashboard */}
      <div className="bg-white/5 border border-white/10 rounded-[1.5rem] p-5 shadow-inner">
        <div className="flex items-center justify-between mb-4">
          <span className="text-[10px] text-gray-500 uppercase font-black tracking-widest">Central de Contas</span>
          <div className="w-2 h-2 rounded-full bg-green-500 shadow-[0_0_8px_rgba(34,197,94,0.6)]"></div>
        </div>
        
        <div className="flex items-center gap-3 mb-4">
          <div className="w-10 h-10 rounded-full bg-amber-500/10 border border-amber-500/20 flex items-center justify-center">
            <i className="fa-solid fa-user-shield text-amber-500"></i>
          </div>
          <div className="overflow-hidden">
            <p className="text-xs text-white font-bold truncate">Sessão Ativa</p>
            <p className="text-[10px] text-gray-500 truncate">Google Authenticated</p>
          </div>
        </div>
        
        <div className="pt-3 border-t border-white/5 flex gap-2">
          <button 
            onClick={onSelectKey}
            className="flex-1 py-2 rounded-lg bg-white/5 hover:bg-white/10 text-[9px] text-gray-400 font-bold uppercase tracking-widest border border-white/5 transition-all"
          >
            Mudar Conta
          </button>
        </div>
      </div>

      <div className="p-4 bg-amber-500/5 border border-amber-500/10 rounded-xl">
        <p className="text-[9px] text-amber-500/80 leading-relaxed uppercase tracking-widest font-bold">
          <i className="fa-solid fa-bolt mr-1"></i>
          Créditos: Projeto Corporativo. O uso não consome saldo da sua conta pessoal.
        </p>
      </div>

      <div className="space-y-6 mt-2">
        <div>
          <label className="block text-[10px] font-black text-gray-500 uppercase mb-3 tracking-[0.2em]">Nome do Servidor</label>
          <input 
            type="text" 
            value={config.serverName}
            onChange={(e) => setConfig({...config, serverName: e.target.value})}
            placeholder="Ex: L2 LEGACY..."
            className="w-full bg-black/40 border border-white/5 rounded-2xl px-5 py-4 text-white focus:outline-none focus:border-amber-500/50 transition-all font-cinzel text-lg shadow-inner placeholder:text-gray-700"
          />
        </div>

        <div>
          <label className="block text-[10px] font-black text-gray-500 uppercase mb-3 tracking-[0.2em]">Estilo Visual (2025)</label>
          <div className="grid grid-cols-1 gap-2">
            {['Modern 3D', 'Neo-Gothic', 'Cyber-Gold', 'Flat Geometric'].map((style) => (
              <button
                key={style}
                onClick={() => setConfig({...config, style})}
                className={`py-3 px-4 rounded-xl text-[10px] font-bold uppercase tracking-widest transition-all text-left border ${
                  config.style === style 
                    ? 'bg-amber-500/10 border-amber-500/50 text-amber-500' 
                    : 'bg-white/5 border-white/5 text-gray-500 hover:border-white/20'
                }`}
              >
                {style}
              </button>
            ))}
          </div>
        </div>
      </div>

      <div className="mt-auto pt-6">
        <button
          onClick={onGenerate}
          disabled={status === GenerationStatus.LOADING || !config.serverName}
          className="w-full py-5 bg-gradient-to-br from-amber-400 to-amber-600 hover:from-amber-300 hover:to-amber-500 disabled:from-gray-800 disabled:to-gray-900 text-black font-black rounded-[1.5rem] transition-all shadow-[0_15px_40px_rgba(245,158,11,0.2)] flex items-center justify-center gap-3 uppercase tracking-tighter active:scale-95 group"
        >
          {status === GenerationStatus.LOADING ? (
            <i className="fa-solid fa-dna fa-spin text-xl"></i>
          ) : (
            <>
              <i className="fa-solid fa-wand-sparkles text-xl group-hover:scale-110 transition-transform"></i>
              <span className="text-lg">Forjar Logo</span>
            </>
          )}
        </button>
      </div>
    </aside>
  );
};

export default Sidebar;
