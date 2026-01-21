
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
        <h1 className="text-xl font-cinzel font-black tracking-widest text-white">L2 FORGE</h1>
      </div>

      {/* Central de Contas / Status */}
      <div className="bg-white/5 border border-white/10 rounded-2xl p-4">
        <div className="flex items-center gap-3 mb-3">
          <div className="w-8 h-8 rounded-full bg-green-500/20 flex items-center justify-center">
            <i className="fa-solid fa-circle-check text-green-500 text-xs animate-pulse"></i>
          </div>
          <div>
            <p className="text-[10px] text-gray-500 uppercase font-black tracking-tighter">Central de Contas</p>
            <p className="text-xs text-white font-bold">Usuário Autenticado</p>
          </div>
        </div>
        
        <div className="space-y-2 pt-2 border-t border-white/5">
          <div className="flex justify-between text-[10px]">
            <span className="text-gray-500 uppercase">Provedor:</span>
            <span className="text-amber-500 font-bold">Google API</span>
          </div>
          <div className="flex justify-between text-[10px]">
            <span className="text-gray-500 uppercase">Billing:</span>
            <span className="text-amber-500 font-bold">Project Based</span>
          </div>
        </div>
      </div>

      {/* Info de Créditos (Conforme solicitado) */}
      <div className="p-4 bg-amber-500/5 border border-amber-500/20 rounded-xl">
        <p className="text-[9px] text-amber-500/80 leading-relaxed uppercase tracking-wider font-medium">
          <i className="fa-solid fa-circle-info mr-1"></i>
          A API Gemini utiliza créditos do projeto. O login Google serve para identificação e não consome créditos pessoais da sua conta.
        </p>
      </div>

      <div className="space-y-4">
        <div>
          <label className="block text-xs font-semibold text-gray-400 uppercase mb-2 tracking-wider">Nome do Servidor</label>
          <input 
            type="text" 
            value={config.serverName}
            onChange={(e) => setConfig({...config, serverName: e.target.value})}
            placeholder="Nome do seu mundo..."
            className="w-full bg-white/5 border border-white/10 rounded-lg px-4 py-3 text-white focus:outline-none focus:border-amber-500 transition-all font-cinzel text-lg"
          />
        </div>

        <div>
          <label className="block text-xs font-semibold text-gray-400 uppercase mb-2 tracking-wider">Estilo de Arte</label>
          <select 
            value={config.style}
            onChange={(e) => setConfig({...config, style: e.target.value})}
            className="w-full bg-white/5 border border-white/10 rounded-lg px-4 py-3 text-white focus:outline-none focus:border-amber-500 appearance-none cursor-pointer"
          >
            <option value="Modern Epic">Modern Epic</option>
            <option value="Classic Gothic">Classic Gothic</option>
            <option value="Crystalline">Crystalline</option>
            <option value="Dark Fantasy">Dark Fantasy</option>
          </select>
        </div>
      </div>

      <div className="mt-auto space-y-3">
        <button
          onClick={onGenerate}
          disabled={status === GenerationStatus.LOADING || !config.serverName}
          className="w-full py-4 bg-amber-500 hover:bg-amber-600 disabled:bg-gray-800 text-black font-black rounded-xl transition-all shadow-lg flex items-center justify-center gap-2 uppercase tracking-tighter"
        >
          {status === GenerationStatus.LOADING ? (
            <i className="fa-solid fa-spinner fa-spin"></i>
          ) : (
            <i className="fa-solid fa-wand-magic-sparkles"></i>
          )}
          Forjar Logomarca
        </button>

        {onSelectKey && (
          <button
            onClick={onSelectKey}
            className="w-full py-2 px-3 rounded-lg text-[10px] font-bold uppercase tracking-widest bg-white/5 border border-white/10 text-gray-400 hover:bg-white/10 transition-all flex items-center justify-center gap-2"
          >
            <i className="fa-solid fa-user-gear"></i>
            Alterar Conta
          </button>
        )}
      </div>
    </aside>
  );
};

export default Sidebar;
