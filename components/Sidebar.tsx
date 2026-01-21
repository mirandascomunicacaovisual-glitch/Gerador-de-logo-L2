
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
      <div className="flex items-center gap-3">
        <div className="w-10 h-10 bg-amber-500 rounded-lg flex items-center justify-center shadow-lg">
          <i className="fa-solid fa-fire-flame-curved text-xl text-black"></i>
        </div>
        <h1 className="text-xl font-cinzel font-black tracking-widest text-white uppercase">L2 Forge <span className="text-[10px] text-amber-500 align-top">PRO</span></h1>
      </div>

      {/* Central de Contas */}
      <div className="bg-white/5 border border-white/10 rounded-2xl p-5 shadow-inner">
        <div className="flex items-center justify-between mb-4">
          <p className="text-[10px] text-gray-500 uppercase font-black tracking-[0.2em]">Central de Contas</p>
          <div className="px-2 py-0.5 rounded bg-green-500/20 text-[8px] text-green-500 font-black uppercase">Ativo</div>
        </div>
        
        <div className="flex items-center gap-3 mb-4">
          <div className="w-10 h-10 rounded-full bg-amber-500/10 border border-amber-500/20 flex items-center justify-center text-amber-500">
            <i className="fa-solid fa-user-check"></i>
          </div>
          <div className="overflow-hidden">
            <p className="text-xs text-white font-bold truncate">Google Authenticated</p>
            <p className="text-[10px] text-gray-500 truncate">Sessão via Projeto API</p>
          </div>
        </div>
        
        <div className="pt-3 border-t border-white/5 space-y-2">
          <div className="flex justify-between text-[9px] uppercase tracking-wider">
            <span className="text-gray-500">Billing:</span>
            <span className="text-amber-500/80">Project Managed</span>
          </div>
          <div className="flex justify-between text-[9px] uppercase tracking-wider">
            <span className="text-gray-500">Cota:</span>
            <span className="text-amber-500/80">Enterprise Tier</span>
          </div>
        </div>
      </div>

      {/* Aviso de Créditos Gemini */}
      <div className="p-4 bg-amber-500/5 border border-amber-500/10 rounded-xl relative overflow-hidden group">
        <div className="absolute top-0 left-0 w-1 h-full bg-amber-500/40"></div>
        <p className="text-[9px] text-amber-500/70 leading-relaxed uppercase tracking-widest font-bold">
          <i className="fa-solid fa-circle-info mr-1 text-amber-500"></i>
          Nota Técnica: O login Google serve apenas para identificação. O uso da API consome créditos do projeto fornecedor e não afeta o saldo pessoal da sua conta.
        </p>
      </div>

      <div className="space-y-5">
        <div>
          <label className="block text-[10px] font-black text-gray-500 uppercase mb-2 tracking-[0.2em]">Nome do Servidor</label>
          <input 
            type="text" 
            value={config.serverName}
            onChange={(e) => setConfig({...config, serverName: e.target.value})}
            placeholder="Ex: L2 AVALON..."
            className="w-full bg-black/40 border border-white/5 rounded-xl px-4 py-4 text-white focus:outline-none focus:border-amber-500 transition-all font-cinzel text-lg shadow-inner"
          />
        </div>

        <div>
          <label className="block text-[10px] font-black text-gray-500 uppercase mb-2 tracking-[0.2em]">Estilo Visual</label>
          <div className="relative">
            <select 
              value={config.style}
              onChange={(e) => setConfig({...config, style: e.target.value})}
              className="w-full bg-black/40 border border-white/5 rounded-xl px-4 py-3 text-white focus:outline-none focus:border-amber-500 appearance-none cursor-pointer text-xs font-bold uppercase tracking-widest"
            >
              <option value="Modern Epic">Modern Epic 3D</option>
              <option value="Classic Gothic">Classic Gothic</option>
              <option value="Metallic Gloss">Metallic Gloss</option>
              <option value="Dark Fantasy">Dark Fantasy</option>
            </select>
            <i className="fa-solid fa-chevron-down absolute right-4 top-1/2 -translate-y-1/2 text-[10px] text-gray-500 pointer-events-none"></i>
          </div>
        </div>
      </div>

      <div className="mt-auto space-y-3">
        <button
          onClick={onGenerate}
          disabled={status === GenerationStatus.LOADING || !config.serverName}
          className="w-full py-5 bg-gradient-to-r from-amber-500 to-amber-600 hover:from-amber-400 hover:to-amber-500 disabled:from-gray-800 disabled:to-gray-900 text-black font-black rounded-2xl transition-all shadow-[0_10px_30px_rgba(245,158,11,0.2)] flex items-center justify-center gap-3 uppercase tracking-tighter active:scale-95"
        >
          {status === GenerationStatus.LOADING ? (
            <i className="fa-solid fa-spinner fa-spin text-xl"></i>
          ) : (
            <>
              <i className="fa-solid fa-wand-magic-sparkles text-xl"></i>
              <span className="text-lg">Forjar Logo</span>
            </>
          )}
        </button>

        {onSelectKey && (
          <button
            onClick={onSelectKey}
            className="w-full py-3 px-3 rounded-xl text-[10px] font-bold uppercase tracking-widest bg-white/5 border border-white/5 text-gray-500 hover:text-amber-500/80 hover:bg-white/10 transition-all flex items-center justify-center gap-2"
          >
            <i className="fa-solid fa-user-gear"></i>
            Alterar Conta Google
          </button>
        )}
      </div>
    </aside>
  );
};

export default Sidebar;
