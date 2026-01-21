
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
    try {
      if (window.aistudio && typeof window.aistudio.hasSelectedApiKey === 'function') {
        const hasKey = await window.aistudio.hasSelectedApiKey();
        setIsAuthenticated(hasKey);
      } else if (process.env.API_KEY && process.env.API_KEY !== 'undefined') {
        setIsAuthenticated(true);
      }
    } catch (err) {
      console.error("Erro na verificação de autenticação:", err);
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
    
    try {
      // CHAMADA EXCLUSIVA: Abre o seletor de contas do Google oficial (account chooser)
      if (window.aistudio && typeof window.aistudio.openSelectKey === 'function') {
        await window.aistudio.openSelectKey();
      } else {
        console.warn("Acesso ao Google AI Studio não disponível no momento.");
      }
      
      // REGRA DE OURO: Assume sucesso imediato para liberar o app
      // O usuário fará o login na aba/popup que abriu.
      setIsAuthenticated(true);
      setStatus(GenerationStatus.IDLE);
    } catch (error) {
      console.error("Erro ao abrir login:", error);
      setIsAuthenticated(true);
    } finally {
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
      const visualKeywords = ['mude', 'altere', 'cor', 'logo', 'fogo', 'fire', 'render', '3d', 'criar', 'gerar', 'remover', 'tira', 'bota', 'image', 'imagem', 'font', 'fonte', 'estilizada', 'logomarca'];
      const currentImage = currentImageIndex >= 0 ? imageHistory[currentImageIndex] : null;
      const isVisualRequest = visualKeywords.some(kw => text.toLowerCase().includes(kw)) || !!uploadedImage || !currentImage;

      if (isVisualRequest) {
        const isRefinement = !!currentImage && !text.toLowerCase().includes('criar novo') && !text.toLowerCase().includes('gerar novo');
        const sourceImage = uploadedImage || currentImage || undefined;
        
        const prompt = isRefinement 
          ? `Refine this logo: ${text}. Focus on highly stylized 3D typography for the name "${logoConfig.serverName}".`
          : `Create a professional 3D MMORPG logo for a server named "${logoConfig.serverName}". Style: ${logoConfig.style}. Use CUSTOM STYLIZED ARTISTIC FONTS. Prompt: ${text}`;
        
        const resultImage = await generateLogo(prompt, sourceImage, isRefinement);
        
        if (resultImage) {
          const newHistory = imageHistory.slice(0, currentImageIndex + 1);
          newHistory.push(resultImage);
          setImageHistory(newHistory);
          setCurrentImageIndex(newHistory.length - 1);
          setMessages(prev => [...prev, { id: Date.now().toString(), role: 'assistant', content: 'Forja concluída! Tipografia moderna e renderização cinematográfica aplicadas.' }]);
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
      
      if (errorMessage.includes("Requested entity was not found") || errorMessage.includes("API_KEY_INVALID")) {
        setIsAuthenticated(false);
      } else if (errorMessage === 'QUOTA_EXCEEDED' || errorMessage.includes("429")) {
        setStatus(GenerationStatus.ERROR);
      } else {
        setStatus(GenerationStatus.ERROR);
      }
    } finally {
      setIsRotating(false);
    }
  };

  const handleQuickGenerate = () => {
    if (!logoConfig.serverName) return alert("Por favor, digite o nome do servidor antes de forjar.");
    handleSendMessage(`Forje uma logomarca 3D épica para o servidor ${logoConfig.serverName}. Use fontes extremamente estilizadas e renderização de alta fidelidade.`);
  };

  if (checkingAuth) {
    return (
      <div className="h-screen w-full bg-[#050507] flex flex-col items-center justify-center">
        <div className="text-amber-500 animate-spin text-5xl mb-4">
          <i className="fa-solid fa-fire-flame-curved"></i>
        </div>
        <p className="text-amber-500/50 font-cinzel tracking-widest text-sm animate-pulse uppercase">Conectando ao Estúdio...</p>
      </div>
    );
  }

  if (!isAuthenticated) {
    return (
      <div className="h-screen w-full bg-[#050507] flex flex-col items-center justify-center p-6 text-center relative overflow-hidden">
        <div className="absolute inset-0 bg-[radial-gradient(circle_at_center,_var(--tw-gradient-stops))] from-amber-600/10 via-transparent to-transparent opacity-60"></div>
        
        <div className="z-10 max-w-lg glass p-10 rounded-[2.5rem] border border-white/5 shadow-[0_0_120px_rgba(245,158,11,0.08)]">
          <div className="w-20 h-20 bg-amber-500 rounded-3xl flex items-center justify-center shadow-[0_20px_50px_rgba(245,158,11,0.4)] mx-auto mb-10">
            <i className="fa-solid fa-fire-flame-curved text-4xl text-black"></i>
          </div>
          
          <h1 className="text-4xl font-cinzel font-black tracking-tighter text-white mb-4 uppercase">L2 LOGO <span className="text-amber-500">FORGE</span></h1>
          <p className="text-gray-400 font-light mb-10 leading-relaxed text-base px-6">
            Logomarcas de servidores modernas com fontes estilizadas. Conecte sua conta Google para liberar o poder do Gemini.
          </p>

          <button
            onClick={handleLogin}
            disabled={isLoggingIn}
            className="w-full py-5 bg-amber-500 hover:bg-amber-400 disabled:bg-gray-800 text-black font-black rounded-2xl transition-all shadow-[0_10px_40px_rgba(245,158,11,0.3)] flex items-center justify-center gap-4 uppercase tracking-tighter mb-8 active:scale-95"
          >
            {isLoggingIn ? (
              <i className="fa-solid fa-spinner fa-spin text-xl"></i>
            ) : (
              <>
                <i className="fa-brands fa-google text-xl"></i>
                <span className="text-lg">Entrar com Google</span>
              </>
            )}
          </button>

          <div className="text-[10px] text-gray-500 uppercase tracking-[0.3em] font-bold flex items-center justify-center gap-2">
            <i className="fa-solid fa-shield-halved text-amber-500/40"></i>
            Conexão Segura e Direta
          </div>
        </div>

        {/* Link de faturamento separado e discreto no rodapé para evitar cliques acidentais */}
        <div className="absolute bottom-6 left-0 right-0 flex justify-center opacity-30 hover:opacity-100 transition-opacity">
          <a href="https://ai.google.dev/gemini-api/docs/billing" target="_blank" rel="noreferrer" className="text-[9px] text-gray-500 uppercase tracking-widest underline decoration-white/10 underline-offset-4">
            Informações sobre conta e faturamento Google
          </a>
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
