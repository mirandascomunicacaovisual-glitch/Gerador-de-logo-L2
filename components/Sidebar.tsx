
import React from 'react';
import { LogoConfig, GenerationStatus } from '../types';

interface SidebarProps {
  config: LogoConfig;
  setConfig: React.Dispatch<React.SetStateAction<LogoConfig>>;
  onGenerate: () => void;
  status: GenerationStatus;
  onSelectKey?: () => void;
  hasKey?: boolean;
  onReset?: () => void;
}

const Sidebar: React.FC<SidebarProps> = ({ config, setConfig, onGenerate, status, onSelectKey, hasKey, onReset }) => {
  return (
    <aside className="w-80 h-full glass border-r border-white/10 p-6 hidden lg:flex flex-col gap-6 overflow-y-auto">
      <div className="flex items-center gap-3">
        <div className="w-10 h-10 bg-amber-500 rounded-lg flex items-center justify-center shadow-[0_0_15px_rgba(245,158,11,0.5)]">
          <i className="fa-solid fa-fire-flame-curved text-xl text-black"></i>
        </div>
        <h1 className="text-xl font-cinzel font-black tracking-widest text-white">L2 GERADOR-LOGO</h1>
      </div>

      <div className="space-y-4">
        <div>
          <label className="block text-xs font-semibold text-gray-400 uppercase mb-2 tracking-wider">Nome do Servidor</label>
          <input 
            type="text" 
            value={config.serverName}
            onChange={(e) => setConfig({...config, serverName: e.target.value})}
            placeholder="Ex: Lineage II Beyond"
            className="w-full bg-white/5 border border-white/10 rounded-lg px-4 py-3 text-white focus:outline-none focus:border-amber-500 transition-all font-cinzel text-lg"
          />
        </div>

        <div>
          <label className="block text-xs font-semibold text-gray-400 uppercase mb-2 tracking-wider">Estilo de Arte</label>
          <select 
            value={config.style}
            onChange={(e) => setConfig({...config, style: e.target.value})}
            className="w-full bg-white/5 border border-white/10 rounded-lg px-4 py-3 text-white focus:outline-none focus:border-amber-500 appearance-none"
          >
            <option value="Modern Epic">Modern Epic (L2 Interlude Style)</option>
            <option value="Classic Gothic">Classic Gothic</option>
            <option value="Crystalline">Crystalline / Magical</option>
            <option value="Dark Fantasy">Dark Fantasy / Evil</option>
          </select>
        </div>

        <div>
          <label className="block text-xs font-semibold text-gray-400 uppercase mb-2 tracking-wider">Símbolo Central</label>
          <select 
            value={config.symbol}
            onChange={(e) => setConfig({...config, symbol: e.target.value})}
            className="w-full bg-white/5 border border-white/10 rounded-lg px-4 py-3 text-white focus:outline-none focus:border-amber-500 appearance-none"
          >
            <option value="Eagle Crest">Eagle Crest</option>
            <option value="Wings of Fate">Wings of Fate</option>
            <option value="Dragon Head">Dragon Head</option>
            <option value="Portal Gate">Portal Gate</option>
            <option value="Sacred Sword">Sacred Sword</option>
          </select>
        </div>
      </div>

      <div className="mt-auto space-y-3">
        <button
          onClick={onGenerate}
          disabled={status === GenerationStatus.LOADING}
          className="w-full py-4 bg-amber-500 hover:bg-amber-600 disabled:bg-gray-700 text-black font-bold rounded-xl transition-all shadow-[0_4px_20px_rgba(245,158,11,0.3)] flex items-center justify-center gap-2 uppercase tracking-tighter"
        >
          {status === GenerationStatus.LOADING ? (
            <i className="fa-solid fa-spinner fa-spin"></i>
          ) : (
            <i className="fa-solid fa-wand-magic-sparkles"></i>
          )}
          Forjar Logomarca
        </button>

        <div className="grid grid-cols-2 gap-2">
          {onReset && (
            <button
              onClick={onReset}
              className="py-2 px-3 rounded-lg text-[10px] font-bold uppercase tracking-widest bg-red-500/10 border border-red-500/20 text-red-500 hover:bg-red-500/20 transition-all"
            >
              <i className="fa-solid fa-trash-can mr-2"></i> Resetar
            </button>
          )}
          
          {onSelectKey && (
            <button
              onClick={onSelectKey}
              className={`py-2 px-3 rounded-lg text-[10px] font-bold uppercase tracking-widest transition-all border ${hasKey ? 'bg-green-500/10 border-green-500/30 text-green-500' : 'bg-white/5 border-white/10 text-gray-400 hover:bg-white/10'}`}
            >
              <i className={`fa-solid ${hasKey ? 'fa-check-circle' : 'fa-key'} mr-2`}></i>
              Key (Opcial)
            </button>
          )}
        </div>
      </div>
    </aside>
  );
};

export default Sidebar;
