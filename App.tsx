
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
  const [detailedError, setDetailedError] = useState<string | null>(null);
  
  const [messages, setMessages] = useState<Message[]>([
    {
      id: '1',
      role: 'assistant',
      content: 'L2 Forge Central conectada. Aguardando diretrizes para forja de marca.'
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
          setAuthError("Chave Inválida: Tokens 'vck_...' do Vercel não funcionam para IA.");
          setIsAuthenticated(false);
        } else {
          setIsAuthenticated(true);
        }
      }
    } catch (err) {
      console.error("Auth Check Error:", err);
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
    setDetailedError(null);
    
    try {
      if (window.aistudio && typeof window.aistudio.openSelectKey === 'function') {
        await window.aistudio.openSelectKey();
        setIsAuthenticated(true);
      } else {
        if (process.env.API_KEY && !process.env.API_KEY.startsWith('vck_')) {
          setIsAuthenticated(true);
        } else {
          setAuthError("Seletor Indisponível. Configure a API_KEY (AIza...) nas variáveis de ambiente.");
        }
      }
    } catch (error) {
      setIsAuthenticated(true); 
    } finally {
      setIsLoggingIn(false);
    }
  };

  const handleSendMessage = async (text: string, uploadedImage?: string) => {
    const userMsg: Message = { id: Date.now().toString(), role: 'user', content: text, image: uploadedImage };
    setMessages(prev => [...prev, userMsg]);
    setStatus(GenerationStatus.LOADING);
    setDetailedError(null);

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
          setMessages(prev => [...prev, { id: Date.now().toString(), role: 'assistant', content: 'Logomarca forjada com sucesso.' }]);
          setStatus(GenerationStatus.SUCCESS);
        }
      } else {
        const responseText = await chatWithAI(text, messages.map(m => ({ role: m.role, content: m.content })));
        setMessages(prev => [...prev, { id: Date.now().toString(), role: 'assistant', content: responseText }]);
        setStatus(GenerationStatus.IDLE);
      }
    } catch (error: any) {
      const msg = error?.message || "Erro desconhecido";
      setDetailedError(msg);
      setStatus(GenerationStatus.ERROR);

      if (msg.includes("AUTH_ERROR") || msg.toLowerCase().includes("not found") || msg.toLowerCase().includes("permission denied")) {
        setIsAuthenticated(false);
        setAuthError(msg.replace("AUTH_ERROR:", ""));
      }
    }
  };

  if (checkingAuth) return <div className="h-screen bg-[#050507] flex items-center justify-center"><div className="w-8 h-8 border-2 border-amber-500/20 border-t-amber-500 rounded-full animate-spin"></div></div>;

  if (!isAuthenticated) {
    return (
      <div className="h-screen bg-[#050507] flex flex-col items-center justify-center p-6 text-center">
        <div className="max-w-md w-full glass p-10 rounded-[3rem] border border-white/5 shadow-2xl">
          <div className="w-16 h-16 bg-amber-500 rounded-2xl flex items-center justify-center shadow-lg mx-auto mb-8">
            <i className="fa-solid fa-key text-2xl text-black"></i>
          </div>
          <h1 className="text-2xl font-cinzel font-black text-white mb-2 uppercase">Acesso à <span className="text-amber-500">Forja</span></h1>
          <p className="text-gray-400 text-sm mb-8 leading-relaxed">
            Sua chave atual não tem permissão para gerar imagens ou o modelo não foi encontrado. Selecione um projeto Google Cloud com faturamento ativo.
          </p>

          {authError && (
            <div className="mb-6 p-4 bg-red-500/10 border border-red-500/20 rounded-xl text-left">
              <p className="text-[10px] text-red-400 font-bold uppercase tracking-widest mb-1">Erro de API</p>
              <p className="text-[11px] text-red-400/80 leading-tight">{authError}</p>
            </div>
          )}

          <button
            onClick={handleLogin}
            disabled={isLoggingIn}
            className="w-full py-4 bg-amber-500 hover:bg-amber-400 text-black font-black rounded-xl transition-all shadow-xl flex items-center justify-center gap-3 uppercase tracking-wider active:scale-95"
          >
            {isLoggingIn ? <i className="fa-solid fa-spinner fa-spin"></i> : <><i className="fa-brands fa-google"></i><span>Vincular Conta Paga</span></>}
          </button>

          <p className="mt-6 text-[9px] text-gray-600 uppercase tracking-widest leading-loose">
            Certifique-se que o faturamento está ativo em <br/>
            <a href="https://console.cloud.google.com/billing" target="_blank" className="text-amber-500 underline">console.cloud.google.com/billing</a>
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="flex h-screen bg-[#050507]">
      <Sidebar 
        config={logoConfig} 
        setConfig={setLogoConfig} 
        onGenerate={() => handleSendMessage(`Logo futurista para ${logoConfig.serverName}`)}
        status={status}
        onSelectKey={handleLogin}
        hasKey={isAuthenticated}
      />
      <main className="flex-1 flex flex-col md:flex-row">
        <section className="flex-1 flex items-center justify-center p-4">
          <PreviewArea 
            image={currentImageIndex >= 0 ? imageHistory[currentImageIndex] : null} 
            status={status} 
            serverName={logoConfig.serverName}
            onSelectKey={handleLogin}
            detailedError={detailedError}
          />
        </section>
        <section className="w-full md:w-96 glass border-l border-white/10">
          <ChatWindow messages={messages} onSendMessage={handleSendMessage} isLoading={status === GenerationStatus.LOADING} />
        </section>
      </main>
    </div>
  );
};

export default App;
