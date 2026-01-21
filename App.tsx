
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
  
  const [messages, setMessages] = useState<Message[]>([
    {
      id: '1',
      role: 'assistant',
      content: 'Canais de forja prontos. Bem-vindo ao L2 Gerador-Logo. Qual será o nome do seu império?'
    }
  ]);
  const [imageHistory, setImageHistory] = useState<string[]>([]);
  const [currentImageIndex, setCurrentImageIndex] = useState<number>(-1);
  const [status, setStatus] = useState<GenerationStatus>(GenerationStatus.IDLE);
  const [isRotating, setIsRotating] = useState(false);
  const [logoConfig, setLogoConfig] = useState<LogoConfig>({
    serverName: '',
    style: 'Modern Epic',
    colorScheme: 'Gold & Steel',
    symbol: 'Eagle Crest'
  });

  const checkAuthStatus = useCallback(async () => {
    if (window.aistudio && typeof window.aistudio.hasSelectedApiKey === 'function') {
      try {
        const hasKey = await window.aistudio.hasSelectedApiKey();
        setIsAuthenticated(hasKey);
      } catch (err) {
        console.error("Falha ao verificar chave:", err);
        setIsAuthenticated(false);
      }
    } else {
      // Se não estiver no ambiente AI Studio, dependemos do process.env.API_KEY injetado
      // Mas para seguir o fluxo de "Login Google", permitimos avançar se houver uma chave no env
      if (process.env.API_KEY && process.env.API_KEY !== 'undefined') {
        setIsAuthenticated(true);
      }
    }
    setCheckingAuth(false);
  }, []);

  useEffect(() => {
    checkAuthStatus();
  }, [checkAuthStatus]);

  const handleLogin = async () => {
    setIsLoggingIn(true);
    
    // Tenta usar o fluxo oficial do AI Studio (Google Login/Key Selection)
    if (window.aistudio && typeof window.aistudio.openSelectKey === 'function') {
      try {
        await window.aistudio.openSelectKey();
        // Regra de Race Condition: Assumir sucesso e prosseguir imediatamente
        setIsAuthenticated(true);
      } catch (error) {
        console.error("Erro ao abrir seletor de chave:", error);
        alert("Ocorreu um erro ao abrir a autenticação do Google. Certifique-se de que os pop-ups não estão bloqueados.");
      } finally {
        setIsLoggingIn(false);
      }
    } else {
      // Fallback para quando o app é aberto fora do ambiente esperado
      console.warn("Ambiente de seleção de chave não detectado.");
      // Se tivermos uma chave de fallback, permitimos o acesso para não travar o cliente
      if (process.env.API_KEY) {
        setIsAuthenticated(true);
      } else {
        alert("Este aplicativo requer o ambiente do Google AI Studio para autenticação. Se você for o desenvolvedor, verifique sua configuração de API_KEY.");
      }
      setIsLoggingIn(false);
    }
  };

  const handleResetSession = () => {
    setMessages([{
      id: Date.now().toString(),
      role: 'assistant',
      content: 'Canais de conexão resetados. Histórico limpo para otimização.'
    }]);
    setImageHistory([]);
    setCurrentImageIndex(-1);
    setStatus(GenerationStatus.IDLE);
    setIsRotating(false);
  };

  const handleUndo = () => {
    if (currentImageIndex > 0) {
      setCurrentImageIndex(prev => prev - 1);
    }
  };

  const handleSendMessage = async (text: string, uploadedImage?: string) => {
    const userMsg: Message = { id: Date.now().toString(), role: 'user', content: text, image: uploadedImage };
    setMessages(prev => [...prev, userMsg]);
    setStatus(GenerationStatus.LOADING);
    setIsRotating(false);

    try {
      const visualKeywords = ['mude', 'altere', 'cor', 'logo', 'fogo', 'fire', 'render', '3d', 'criar', 'gerar', 'remover', 'tira', 'bota', 'image', 'imagem'];
      const currentImage = currentImageIndex >= 0 ? imageHistory[currentImageIndex] : null;
      const isVisualRequest = visualKeywords.some(kw => text.toLowerCase().includes(kw)) || !!uploadedImage || !currentImage;

      if (isVisualRequest) {
        const isRefinement = !!currentImage && !text.toLowerCase().includes('criar novo') && !text.toLowerCase().includes('gerar novo');
        const sourceImage = uploadedImage || currentImage || undefined;
        
        const prompt = isRefinement 
          ? `Refine this logo: ${text}. Focus on the server name "${logoConfig.serverName}". Style: ${logoConfig.style}.`
          : `Create a professional 3D MMORPG logo for a server named "${logoConfig.serverName}". Style: ${logoConfig.style}, Color: ${logoConfig.colorScheme}, Symbol: ${logoConfig.symbol}. Prompt details: ${text}`;
        
        const resultImage = await generateLogo(prompt, sourceImage, isRefinement);
        
        if (resultImage) {
          const newHistory = imageHistory.slice(0, currentImageIndex + 1);
          newHistory.push(resultImage);
          setImageHistory(newHistory);
          setCurrentImageIndex(newHistory.length - 1);
          setMessages(prev => [...prev, { id: Date.now().toString(), role: 'assistant', content: 'A forja foi concluída. Sua nova identidade visual está pronta para ser baixada.' }]);
          setStatus(GenerationStatus.SUCCESS);
        }
      } else {
        const responseText = await chatWithAI(text, messages.map(m => ({ role: m.role, content: m.content })));
        setMessages(prev => [...prev, { id: Date.now().toString(), role: 'assistant', content: responseText }]);
        setStatus(GenerationStatus.IDLE);
      }
    } catch (error: any) {
      console.error("Erro na Forja:", error);
      const errorMessage = error?.message || "";
      
      // Se a chave expirou ou foi invalidada, forçamos o re-login
      if (errorMessage.includes("Requested entity was not found") || errorMessage.includes("API_KEY_INVALID")) {
        setIsAuthenticated(false);
        alert("Sua sessão de autenticação expirou. Por favor, conecte-se novamente.");
      }

      if (errorMessage === 'QUOTA_EXCEEDED') {
        setIsRotating(true);
        setTimeout(() => {
          handleSendMessage(text, uploadedImage);
        }, 3000);
      } else {
        setStatus(GenerationStatus.ERROR);
      }
    } finally {
      setIsRotating(false);
    }
  };

  const handleQuickGenerate = () => {
    if (!logoConfig.serverName) return alert("Por favor, digite o nome do servidor antes de forjar.");
    handleSendMessage(`Forje uma logomarca 3D épica e moderna para o servidor ${logoConfig.serverName}. Use o estilo ${logoConfig.style}.`);
  };

  if (checkingAuth) {
    return (
      <div className="h-screen w-full bg-[#050507] flex flex-col items-center justify-center">
        <div className="text-amber-500 animate-spin text-5xl mb-4">
          <i className="fa-solid fa-fire-flame-curved"></i>
        </div>
        <p className="text-amber-500/50 font-cinzel tracking-widest text-sm animate-pulse">Iniciando Forja...</p>
      </div>
    );
  }

  if (!isAuthenticated) {
    return (
      <div className="h-screen w-full bg-[#050507] flex flex-col items-center justify-center p-6 text-center relative overflow-hidden">
        {/* Background Effects */}
        <div className="absolute inset-0 bg-[radial-gradient(circle_at_center,_var(--tw-gradient-stops))] from-amber-500/15 via-transparent to-transparent opacity-60"></div>
        <div className="absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-transparent via-amber-500/60 to-transparent"></div>
        <div className="absolute bottom-0 left-0 w-full h-1 bg-gradient-to-r from-transparent via-amber-500/20 to-transparent"></div>
        
        <div className="z-10 max-w-lg glass p-10 rounded-3xl border-amber-500/20 shadow-[0_0_60px_rgba(245,158,11,0.15)] transform transition-all duration-700 hover:scale-[1.01]">
          <div className="w-24 h-24 bg-amber-500 rounded-3xl flex items-center justify-center shadow-[0_0_40px_rgba(245,158,11,0.4)] mx-auto mb-10 relative">
            <i className="fa-solid fa-fire-flame-curved text-5xl text-black"></i>
            <div className="absolute -inset-1 border border-amber-500/50 rounded-3xl animate-ping opacity-20"></div>
          </div>
          
          <h1 className="text-5xl font-cinzel font-black tracking-tighter text-white mb-6">L2 LOGO <span className="text-amber-500">FORGE</span></h1>
          <p className="text-gray-400 font-light mb-10 leading-relaxed text-lg px-4">
            Acesse o estúdio profissional de criação de identidades visuais para comunidades de Lineage 2. Conecte sua conta para garantir renderização Pro.
          </p>

          <button
            onClick={handleLogin}
            disabled={isLoggingIn}
            className="w-full py-6 bg-amber-500 hover:bg-amber-400 disabled:bg-gray-800 disabled:text-gray-500 text-black font-black rounded-2xl transition-all shadow-[0_10px_35px_rgba(245,158,11,0.4)] flex items-center justify-center gap-4 uppercase tracking-tight mb-8 group overflow-hidden relative"
          >
            {isLoggingIn ? (
              <i className="fa-solid fa-spinner fa-spin text-2xl"></i>
            ) : (
              <>
                <div className="absolute inset-0 bg-white/20 translate-x-[-100%] group-hover:translate-x-[100%] transition-transform duration-500"></div>
                <i className="fa-brands fa-google text-2xl"></i>
                <span className="text-xl">Entrar com Google</span>
              </>
            )}
          </button>

          <div className="space-y-4">
            <div className="text-[11px] text-gray-500 uppercase tracking-[0.2em] font-bold">
              <i className="fa-solid fa-shield-halved mr-2 text-amber-500/50"></i>
              Ambiente Seguro Google Cloud Console
            </div>
            
            <a 
              href="https://ai.google.dev/gemini-api/docs/billing" 
              target="_blank" 
              rel="noopener noreferrer"
              className="inline-block text-[10px] text-amber-500/50 hover:text-amber-500 transition-colors underline decoration-dotted underline-offset-4 uppercase tracking-widest"
            >
              Consultar Faturamento e Limites
            </a>
          </div>
        </div>
        
        <div className="absolute bottom-10 flex flex-col items-center gap-2">
            <div className="flex gap-4 mb-2">
                <i className="fa-solid fa-gem text-amber-500/20"></i>
                <i className="fa-solid fa-bolt text-amber-500/20"></i>
                <i className="fa-solid fa-crown text-amber-500/20"></i>
            </div>
            <p className="text-[10px] text-gray-600 font-cinzel tracking-[0.5em] uppercase">Forging Legends Since 2024</p>
        </div>
      </div>
    );
  }

  return (
    <div className="flex h-screen w-full overflow-hidden bg-[#050507]">
      <Sidebar 
        config={logoConfig} 
        setConfig={setLogoConfig} 
        onGenerate={handleQuickGenerate}
        status={status}
        onSelectKey={handleLogin}
        hasKey={isAuthenticated}
        onReset={handleResetSession}
      />

      <main className="flex-1 flex flex-col md:flex-row relative">
        <section className="flex-1 p-4 md:p-8 flex flex-col items-center justify-center bg-[radial-gradient(circle_at_center,_var(--tw-gradient-stops))] from-[#111827] via-[#050507] to-[#050507]">
          <PreviewArea 
            image={currentImageIndex >= 0 ? imageHistory[currentImageIndex] : null} 
            status={status} 
            serverName={logoConfig.serverName}
            onUndo={handleUndo}
            canUndo={currentImageIndex > 0}
            onSelectKey={handleLogin}
            isRetrying={status === GenerationStatus.LOADING || isRotating}
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
