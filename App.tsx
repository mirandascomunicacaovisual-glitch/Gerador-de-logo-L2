
import React, { useState, useEffect } from 'react';
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
  const [messages, setMessages] = useState<Message[]>([
    {
      id: '1',
      role: 'assistant',
      content: 'Bem-vindo ao L2 Gerador-Logo. Estou pronto para forjar sua identidade épica. O que vamos criar hoje?'
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

  useEffect(() => {
    const checkInitialAuth = async () => {
      if (window.aistudio?.hasSelectedApiKey) {
        try {
          const hasKey = await window.aistudio.hasSelectedApiKey();
          setIsAuthenticated(hasKey);
        } catch {
          setIsAuthenticated(false);
        }
      }
      setCheckingAuth(false);
    };
    checkInitialAuth();
  }, []);

  const handleLogin = async () => {
    if (window.aistudio?.openSelectKey) {
      try {
        await window.aistudio.openSelectKey();
        // Conforme as regras: assumir sucesso após o gatilho para evitar race condition
        setIsAuthenticated(true);
      } catch (error) {
        console.error("Erro ao abrir seletor de chave:", error);
      }
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
      const visualKeywords = ['mude', 'altere', 'cor', 'logo', 'fogo', 'fire', 'render', '3d', 'criar', 'gerar', 'remover', 'tira', 'bota'];
      const currentImage = currentImageIndex >= 0 ? imageHistory[currentImageIndex] : null;
      const isVisualRequest = visualKeywords.some(kw => text.toLowerCase().includes(kw)) || !!uploadedImage || !currentImage;

      if (isVisualRequest) {
        const isRefinement = !!currentImage && !text.toLowerCase().includes('criar novo');
        const sourceImage = uploadedImage || currentImage || undefined;
        
        const prompt = isRefinement 
          ? `REFINE LOGO: ${text}. Name: ${logoConfig.serverName}.`
          : `CREATE LOGO: ${text}. Name: ${logoConfig.serverName}.`;
        
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
      console.error("API Error - Possible key issue:", error);
      const errorMessage = error?.message || "";
      
      if (errorMessage.includes("Requested entity was not found")) {
        // Reset auth if key is invalid
        setIsAuthenticated(false);
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
    if (!logoConfig.serverName) return alert("Digite o nome do servidor.");
    handleSendMessage(`Forje uma logomarca 3D épica para ${logoConfig.serverName}`);
  };

  if (checkingAuth) {
    return (
      <div className="h-screen w-full bg-[#050507] flex items-center justify-center">
        <div className="text-amber-500 animate-spin text-4xl">
          <i className="fa-solid fa-circle-notch"></i>
        </div>
      </div>
    );
  }

  if (!isAuthenticated) {
    return (
      <div className="h-screen w-full bg-[#050507] flex flex-col items-center justify-center p-6 text-center relative overflow-hidden">
        {/* Decorative Background Elements */}
        <div className="absolute inset-0 bg-[radial-gradient(circle_at_center,_var(--tw-gradient-stops))] from-amber-500/10 via-transparent to-transparent opacity-50"></div>
        <div className="absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-transparent via-amber-500/50 to-transparent"></div>
        
        <div className="z-10 max-w-lg glass p-10 rounded-2xl border-amber-500/20 shadow-[0_0_50px_rgba(245,158,11,0.1)]">
          <div className="w-20 h-20 bg-amber-500 rounded-2xl flex items-center justify-center shadow-[0_0_30px_rgba(245,158,11,0.4)] mx-auto mb-8">
            <i className="fa-solid fa-fire-flame-curved text-4xl text-black"></i>
          </div>
          
          <h1 className="text-4xl font-cinzel font-black tracking-widest text-white mb-4">L2 GERADOR-LOGO</h1>
          <p className="text-gray-400 font-light mb-8 leading-relaxed">
            Para acessar o estúdio de forja épica e garantir o melhor desempenho na geração das suas logomarcas, é necessário autenticar com sua conta Google.
          </p>

          <button
            onClick={handleLogin}
            className="w-full py-5 bg-amber-500 hover:bg-amber-400 text-black font-black rounded-xl transition-all shadow-[0_4px_25px_rgba(245,158,11,0.3)] flex items-center justify-center gap-3 uppercase tracking-tighter mb-6 group"
          >
            <i className="fa-brands fa-google text-xl group-hover:scale-110 transition-transform"></i>
            Entrar e Selecionar Chave
          </button>

          <div className="text-[10px] text-gray-500 uppercase tracking-widest">
            <p className="mb-2">Requer projeto com faturamento ativo para modelos Pro</p>
            <a 
              href="https://ai.google.dev/gemini-api/docs/billing" 
              target="_blank" 
              rel="noopener noreferrer"
              className="text-amber-500/60 hover:text-amber-500 transition-colors underline decoration-dotted underline-offset-4"
            >
              Documentação de Faturamento
            </a>
          </div>
        </div>
        
        <p className="absolute bottom-8 text-[10px] text-gray-600 font-cinzel tracking-[0.3em]">Identity Forge v2.5 • Developed for L2 Communities</p>
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
