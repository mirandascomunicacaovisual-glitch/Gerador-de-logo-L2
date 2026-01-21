
import React from 'react';
import { LogoConfig, GenerationStatus } from '../types';

interface SidebarProps {
  config: LogoConfig;
  setConfig: React.Dispatch<React.SetStateAction<LogoConfig>>;
  onGenerate: () => void;
  status: GenerationStatus;
}

const Sidebar: React.FC<SidebarProps> = ({ config, setConfig, onGenerate, status }) => {
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

      <div className="p-4 bg-amber-500/5 border border-amber-500/10 rounded-xl">
        <p className="text-[9px] text-amber-500/80 leading-relaxed uppercase tracking-widest font-bold">
          <i className="fa-solid fa-bolt mr-1"></i>
          SISTEMA ATIVO: Logomarcas modernas com fontes estilizadas e renderização 3D.
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
          <label className="block text-[10px] font-black text-gray-500 uppercase mb-3 tracking-[0.2em]">Esquema de Cores</label>
          <select 
            value={config.colorScheme}
            onChange={(e) => setConfig({...config, colorScheme: e.target.value})}
            className="w-full bg-black/40 border border-white/5 rounded-xl px-4 py-3 text-xs text-gray-300 focus:outline-none focus:border-amber-500/50"
          >
            <option>Titanium & Gold</option>
            <option>Neon Blue & Silver</option>
            <option>Blood Red & Carbon</option>
            <option>Emerald & White</option>
          </select>
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
