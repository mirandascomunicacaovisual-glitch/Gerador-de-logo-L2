
import React, { useState, useEffect, useCallback } from 'react';
import { GoogleGenAI } from "@google/genai";
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
  const [envWarning, setEnvWarning] = useState<boolean>(false);
  
  const [messages, setMessages] = useState<Message[]>([
    {
      id: '1',
      role: 'assistant',
      content: 'Canais de forja prontos. Autenticação verificada via Central de Contas. Qual império vamos projetar hoje?'
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
        // Se houver uma chave de fallback no ambiente (Vercel env vars), permitimos
        setIsAuthenticated(true);
      } else {
        // No Vercel sem API_KEY e sem window.aistudio
        setEnvWarning(true);
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
        // Regra de Ouro: Assume sucesso imediato para evitar race condition
        setIsAuthenticated(true);
      } else {
        alert("O seletor de contas do Google requer que este app seja executado dentro do ambiente Google AI Studio. Para sites externos como Vercel, certifique-se de configurar a API_KEY no painel de controle.");
      }
    } catch (error) {
      console.error("Erro ao abrir portal Google:", error);
      // Tentamos liberar para não travar o usuário
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
      const visualKeywords = ['mude', 'altere', 'logo', 'criar', 'gerar', 'imagem', 'fonte', 'estilizada', 'logomarca'];
      const currentImage = currentImageIndex >= 0 ? imageHistory[currentImageIndex] : null;
      const isVisualRequest = visualKeywords.some(kw => text.toLowerCase().includes(kw)) || !!uploadedImage || !currentImage;

      if (isVisualRequest) {
        const isRefinement = !!currentImage && !text.toLowerCase().includes('criar novo');
        const sourceImage = uploadedImage || currentImage || undefined;
        
        // Usamos gemini-3-pro-image-preview para máxima qualidade solicitada
        const resultImage = await generateLogo(text || `Logo para ${logoConfig.serverName}`, sourceImage, isRefinement);
        
        if (resultImage) {
          const newHistory = imageHistory.slice(0, currentImageIndex + 1);
          newHistory.push(resultImage);
          setImageHistory(newHistory);
          setCurrentImageIndex(newHistory.length - 1);
          setMessages(prev => [...prev, { id: Date.now().toString(), role: 'assistant', content: 'Processamento concluído. Verifique a nova versão estilizada na mesa de forja.' }]);
          setStatus(GenerationStatus.SUCCESS);
        }
      } else {
        const responseText = await chatWithAI(text, messages.map(m => ({ role: m.role, content: m.content })));
        setMessages(prev => [...prev, { id: Date.now().toString(), role: 'assistant', content: responseText }]);
        setStatus(GenerationStatus.IDLE);
      }
    } catch (error: any) {
      console.error("Erro na Forja:", error);
      if (error?.message?.includes("entity was not found")) {
        setIsAuthenticated(false);
      }
      setStatus(GenerationStatus.ERROR);
    }
  };

  if (checkingAuth) {
    return (
      <div className="h-screen w-full bg-[#050507] flex flex-col items-center justify-center">
        <i className="fa-solid fa-fire-flame-curved text-amber-500 animate-pulse text-5xl mb-4"></i>
        <p className="text-gray-500 font-cinzel text-xs tracking-widest uppercase">Sincronizando Central de Contas...</p>
      </div>
    );
  }

  if (!isAuthenticated) {
    return (
      <div className="h-screen w-full bg-[#050507] flex flex-col items-center justify-center p-6 text-center">
        <div className="absolute inset-0 bg-[radial-gradient(circle_at_center,_var(--tw-gradient-stops))] from-amber-600/5 via-transparent to-transparent opacity-50"></div>
        
        <div className="z-10 max-w-md w-full glass p-10 md:p-14 rounded-[3.5rem] border border-white/5 shadow-[0_0_100px_rgba(0,0,0,0.8)] relative overflow-hidden">
          <div className="absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-transparent via-amber-500 to-transparent opacity-30"></div>
          
          <div className="w-24 h-24 bg-gradient-to-br from-amber-400 to-amber-600 rounded-3xl flex items-center justify-center shadow-[0_20px_40px_rgba(245,158,11,0.3)] mx-auto mb-10 group transition-transform hover:scale-105">
            <i className="fa-solid fa-user-shield text-4xl text-black"></i>
          </div>
          
          <h1 className="text-3xl font-cinzel font-black text-white mb-3 uppercase tracking-tighter">Central de <span className="text-amber-500">Contas</span></h1>
          <p className="text-gray-400 text-sm mb-10 leading-relaxed font-light">
            Para habilitar o chat inteligente e a geração de logomarcas profissionais, autentique-se com sua conta Google.
          </p>

          <button
            onClick={handleLogin}
            disabled={isLoggingIn}
            className="w-full py-5 bg-amber-500 hover:bg-amber-400 text-black font-black rounded-2xl transition-all shadow-2xl flex items-center justify-center gap-4 uppercase tracking-[0.1em] active:scale-95 group"
          >
            {isLoggingIn ? (
              <i className="fa-solid fa-spinner fa-spin text-xl"></i>
            ) : (
              <>
                <i className="fa-brands fa-google text-xl group-hover:rotate-12 transition-transform"></i>
                <span className="text-lg">Conectar Google</span>
              </>
            )}
          </button>

          <div className="mt-10 pt-8 border-t border-white/5 text-[10px] text-gray-500 uppercase tracking-widest leading-loose">
            <div className="flex items-center justify-center gap-2 mb-2">
              <div className="w-1.5 h-1.5 rounded-full bg-amber-500 animate-pulse"></div>
              <span>Sessão Protegida pela Google API</span>
            </div>
            {envWarning && (
              <p className="text-red-500/60 lowercase italic normal-case mt-2">
                Aviso: O login do Google via popup pode estar bloqueado ou indisponível fora do ambiente Google AI Studio.
              </p>
            )}
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
        onGenerate={() => handleSendMessage(`Gere uma logomarca épica e moderna para o servidor ${logoConfig.serverName}. Estilo: ${logoConfig.style}. Use fontes estilizadas.`)}
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
