
import React, { useState, useEffect, useCallback } from 'react';
import { generateLogo, chatWithAI } from './services/geminiService';
import { Message, LogoConfig, GenerationStatus } from './types';

// Components
import Sidebar from './components/Sidebar';
import ChatWindow from './components/ChatWindow';
import PreviewArea from './components/PreviewArea';

declare global {
  interface AIStudio {
    hasSelectedApiKey: () => Promise<boolean>;
    openSelectKey: () => Promise<void>;
  }
  interface Window {
    aistudio?: AIStudio;
  }
}

const App: React.FC = () => {
  const [isAuthenticated, setIsAuthenticated] = useState<boolean>(false);
  const [checkingAuth, setCheckingAuth] = useState<boolean>(true);
  const [isLoggingIn, setIsLoggingIn] = useState<boolean>(false);
  const [authError, setAuthError] = useState<string | null>(null);
  
  const [messages, setMessages] = useState<Message[]>([
    {
      id: '1',
      role: 'assistant',
      content: 'Central de Contas L2 Forge pronta. Autenticação via Google obrigatória para processamento de alto nível.'
    }
  ]);
  const [imageHistory, setImageHistory] = useState<string[]>([]);
  const [currentImageIndex, setCurrentImageIndex] = useState<number>(-1);
  const [status, setStatus] = useState<GenerationStatus>(GenerationStatus.IDLE);
  const [logoConfig, setLogoConfig] = useState<LogoConfig>({
    serverName: '',
    style: 'Modern 3D',
    colorScheme: 'Titanium & Gold',
    symbol: 'Abstract Geometric'
  });

  const checkAuthStatus = useCallback(async () => {
    try {
      if (window.aistudio && typeof window.aistudio.hasSelectedApiKey === 'function') {
        const hasKey = await window.aistudio.hasSelectedApiKey();
        setIsAuthenticated(hasKey);
      } else if (process.env.API_KEY && process.env.API_KEY !== 'undefined') {
        if (process.env.API_KEY.startsWith('vck_')) {
          setAuthError("Erro de Configuração: O token 'vck_...' é do Vercel. Você deve usar uma API KEY da Gemini (AIza...).");
          setIsAuthenticated(false);
        } else {
          setIsAuthenticated(true);
        }
      }
    } catch (err) {
      console.error("Erro na verificação de sessão:", err);
    } finally {
      setCheckingAuth(false);
    }
  }, []);

  useEffect(() => {
    checkAuthStatus();
  }, [checkAuthStatus]);

  const handleLogin = async () => {
    if (isLoggingIn) return;
    setIsLoggingIn(true);
    setAuthError(null);
    
    try {
      if (window.aistudio && typeof window.aistudio.openSelectKey === 'function') {
        await window.aistudio.openSelectKey();
        setIsAuthenticated(true);
      } else {
        if (process.env.API_KEY && !process.env.API_KEY.startsWith('vck_')) {
          setIsAuthenticated(true);
        } else {
          setAuthError("Seletor Google indisponível. Certifique-se de configurar a API_KEY (AIza...) nas variáveis de ambiente.");
        }
      }
    } catch (error) {
      console.error("Erro ao abrir portal Google:", error);
      setIsAuthenticated(true); 
    } finally {
      setIsLoggingIn(false);
    }
  };

  const handleSendMessage = async (text: string, uploadedImage?: string) => {
    const userMsg: Message = { id: Date.now().toString(), role: 'user', content: text, image: uploadedImage };
    setMessages(prev => [...prev, userMsg]);
    setStatus(GenerationStatus.LOADING);

    try {
      const visualKeywords = ['mude', 'altere', 'logo', 'criar', 'gerar', 'imagem', 'fonte', 'estilizada', 'logomarca', 'render'];
      const currentImage = currentImageIndex >= 0 ? imageHistory[currentImageIndex] : null;
      const isVisualRequest = visualKeywords.some(kw => text.toLowerCase().includes(kw)) || !!uploadedImage || !currentImage;

      if (isVisualRequest) {
        const resultImage = await generateLogo(text || `Logo moderna para ${logoConfig.serverName}`, uploadedImage || currentImage || undefined, !!currentImage);
        
        if (resultImage) {
          const newHistory = imageHistory.slice(0, currentImageIndex + 1);
          newHistory.push(resultImage);
          setImageHistory(newHistory);
          setCurrentImageIndex(newHistory.length - 1);
          setMessages(prev => [...prev, { id: Date.now().toString(), role: 'assistant', content: 'Forja concluída. Note a tipografia moderna estilizada.' }]);
          setStatus(GenerationStatus.SUCCESS);
        }
      } else {
        const responseText = await chatWithAI(text, messages.map(m => ({ role: m.role, content: m.content })));
        setMessages(prev => [...prev, { id: Date.now().toString(), role: 'assistant', content: responseText }]);
        setStatus(GenerationStatus.IDLE);
      }
    } catch (error: any) {
      const errorMsg = (error?.message || "").toLowerCase();
      console.error("Erro capturado:", errorMsg);
      
      if (errorMsg.includes("auth_error") || errorMsg.includes("requested entity was not found") || errorMsg.includes("permission denied") || errorMsg.includes("api_key_invalid")) {
        setIsAuthenticated(false);
        setAuthError("Permissão Negada: Sua chave não tem acesso ou faturamento habilitado. Por favor, reconecte e selecione um 'Paid Project'.");
        setStatus(GenerationStatus.ERROR);
      } else {
        setStatus(GenerationStatus.ERROR);
      }
    }
  };

  if (checkingAuth) {
    return (
      <div className="h-screen w-full bg-[#050507] flex items-center justify-center">
        <div className="w-8 h-8 border-2 border-amber-500/20 border-t-amber-500 rounded-full animate-spin"></div>
      </div>
    );
  }

  if (!isAuthenticated) {
    return (
      <div className="h-screen w-full bg-[#050507] flex flex-col items-center justify-center p-6 text-center">
        <div className="z-10 max-w-lg w-full glass p-10 md:p-14 rounded-[3.5rem] border border-white/5 shadow-2xl relative overflow-hidden">
          <div className="absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-transparent via-amber-500 to-transparent opacity-50"></div>
          
          <div className="w-20 h-20 bg-amber-500 rounded-2xl flex items-center justify-center shadow-lg mx-auto mb-10">
            <i className="fa-solid fa-user-shield text-3xl text-black"></i>
          </div>
          
          <h1 className="text-3xl font-cinzel font-black text-white mb-2 uppercase tracking-tighter">Central de <span className="text-amber-500">Contas</span></h1>
          <p className="text-gray-400 text-sm mb-10 leading-relaxed">
            Seu acesso expirou ou a chave é inválida. Use o seletor Google para vincular um projeto com faturamento ativo.
          </p>

          {authError && (
            <div className="mb-8 p-5 bg-red-500/10 border border-red-500/20 rounded-2xl text-left">
              <p className="text-[11px] text-red-400 font-bold uppercase tracking-widest mb-1">Erro de Autenticação</p>
              <p className="text-xs text-red-400/80 leading-relaxed">{authError}</p>
            </div>
          )}

          <button
            onClick={handleLogin}
            disabled={isLoggingIn}
            className="w-full py-5 bg-amber-500 hover:bg-amber-400 text-black font-black rounded-2xl transition-all shadow-xl flex items-center justify-center gap-4 uppercase tracking-[0.1em] active:scale-95"
          >
            {isLoggingIn ? <i className="fa-solid fa-spinner fa-spin text-xl"></i> : <><i className="fa-brands fa-google text-2xl"></i><span className="text-lg">Reconectar Google</span></>}
          </button>

          <p className="mt-8 text-[9px] text-gray-600 uppercase tracking-widest leading-loose">
            Tokens 'vck_...' do Vercel não funcionam. <br/> Use uma chave Gemini (AIza...) de um 'Paid Project'.
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="flex h-screen w-full overflow-hidden bg-[#050507]">
      <Sidebar 
        config={logoConfig} 
        setConfig={setLogoConfig} 
        onGenerate={() => handleSendMessage(`Gere uma logomarca premium com tipografia estilizada para ${logoConfig.serverName}`)}
        status={status}
        onSelectKey={handleLogin}
        hasKey={isAuthenticated}
      />

      <main className="flex-1 flex flex-col md:flex-row relative">
        <section className="flex-1 p-4 md:p-8 flex flex-col items-center justify-center bg-[#050507]">
          <PreviewArea 
            image={currentImageIndex >= 0 ? imageHistory[currentImageIndex] : null} 
            status={status} 
            serverName={logoConfig.serverName}
            onSelectKey={handleLogin}
          />
        </section>

        <section className="w-full md:w-96 glass border-l border-white/10 flex flex-col h-1/2 md:h-full">
          <ChatWindow 
            messages={messages} 
            onSendMessage={handleSendMessage} 
            isLoading={status === GenerationStatus.LOADING}
          />
        </section>
      </main>
    </div>
  );
};

export default App;
