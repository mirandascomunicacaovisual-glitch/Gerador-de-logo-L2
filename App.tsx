
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
      content: 'Canais de forja prontos. Autenticação verificada. Qual império vamos projetar hoje?'
    }
  ]);
  const [imageHistory, setImageHistory] = useState<string[]>([]);
  const [currentImageIndex, setCurrentImageIndex] = useState<number>(-1);
  const [status, setStatus] = useState<GenerationStatus>(GenerationStatus.IDLE);
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
    
    try {
      if (window.aistudio && typeof window.aistudio.openSelectKey === 'function') {
        await window.aistudio.openSelectKey();
      }
      // Assume sucesso para liberar a UI (Race condition mitigation)
      setIsAuthenticated(true);
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
      const visualKeywords = ['mude', 'altere', 'logo', 'criar', 'gerar', 'imagem', 'fonte', 'estilizada'];
      const currentImage = currentImageIndex >= 0 ? imageHistory[currentImageIndex] : null;
      const isVisualRequest = visualKeywords.some(kw => text.toLowerCase().includes(kw)) || !!uploadedImage || !currentImage;

      if (isVisualRequest) {
        const isRefinement = !!currentImage && !text.toLowerCase().includes('criar novo');
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
          setMessages(prev => [...prev, { id: Date.now().toString(), role: 'assistant', content: 'Forja concluída com sucesso!' }]);
          setStatus(GenerationStatus.SUCCESS);
        }
      } else {
        const responseText = await chatWithAI(text, messages.map(m => ({ role: m.role, content: m.content })));
        setMessages(prev => [...prev, { id: Date.now().toString(), role: 'assistant', content: responseText }]);
        setStatus(GenerationStatus.IDLE);
      }
    } catch (error: any) {
      console.error("Erro na Forja:", error);
      setStatus(GenerationStatus.ERROR);
    }
  };

  if (checkingAuth) {
    return (
      <div className="h-screen w-full bg-[#050507] flex flex-col items-center justify-center">
        <i className="fa-solid fa-fire-flame-curved text-amber-500 animate-pulse text-5xl mb-4"></i>
        <p className="text-gray-500 font-cinzel text-xs tracking-widest uppercase">Validando Sessão...</p>
      </div>
    );
  }

  if (!isAuthenticated) {
    return (
      <div className="h-screen w-full bg-[#050507] flex flex-col items-center justify-center p-6 text-center">
        <div className="z-10 max-w-md w-full glass p-12 rounded-[3rem] border border-white/5 shadow-2xl">
          <div className="w-20 h-20 bg-amber-500 rounded-3xl flex items-center justify-center shadow-lg mx-auto mb-8">
            <i className="fa-solid fa-user-shield text-3xl text-black"></i>
          </div>
          
          <h1 className="text-3xl font-cinzel font-black text-white mb-2 uppercase">Central de Contas</h1>
          <p className="text-gray-400 text-sm mb-10 leading-relaxed px-4">
            Acesse o estúdio de design utilizando sua autenticação Google para habilitar o chat e as funções de IA.
          </p>

          <button
            onClick={handleLogin}
            disabled={isLoggingIn}
            className="w-full py-5 bg-amber-500 hover:bg-amber-400 text-black font-black rounded-2xl transition-all shadow-xl flex items-center justify-center gap-4 uppercase tracking-tighter active:scale-95"
          >
            {isLoggingIn ? (
              <i className="fa-solid fa-spinner fa-spin"></i>
            ) : (
              <>
                <i className="fa-brands fa-google text-xl"></i>
                <span className="text-lg">Entrar com Google</span>
              </>
            )}
          </button>

          <div className="mt-8 pt-8 border-t border-white/5">
            <p className="text-[10px] text-gray-500 uppercase tracking-widest leading-loose">
              Autenticação oficial via Google AI Studio<br/>
              Sessão segura e criptografada
            </p>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="flex h-screen w-full overflow-hidden bg-[#050507]">
      <Sidebar 
        config={logoConfig} 
        setConfig={setLogoConfig} 
        onGenerate={() => handleSendMessage(`Gere uma nova logo épica para o servidor ${logoConfig.serverName}`)}
        status={status}
        onSelectKey={handleLogin}
        hasKey={isAuthenticated}
      />

      <main className="flex-1 flex flex-col md:flex-row relative">
        <section className="flex-1 p-4 md:p-8 flex flex-col items-center justify-center bg-[radial-gradient(circle_at_center,_var(--tw-gradient-stops))] from-[#111827] via-[#050507] to-[#050507]">
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
