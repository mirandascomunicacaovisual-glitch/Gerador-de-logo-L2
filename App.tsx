
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
    // FIX: Changed to optional property to match potential existing global declarations and avoid modifier mismatch error
    aistudio?: AIStudio;
  }
}

const App: React.FC = () => {
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
  const [hasPersonalKey, setHasPersonalKey] = useState<boolean>(false);
  const [isRotating, setIsRotating] = useState(false);
  const [logoConfig, setLogoConfig] = useState<LogoConfig>({
    serverName: '',
    style: 'Modern Epic',
    colorScheme: 'Gold & Steel',
    symbol: 'Eagle Crest'
  });

  useEffect(() => {
    const checkKey = async () => {
      if (window.aistudio?.hasSelectedApiKey) {
        try {
          const hasKey = await window.aistudio.hasSelectedApiKey();
          setHasPersonalKey(hasKey);
        } catch {
          setHasPersonalKey(false);
        }
      }
    };
    checkKey();
  }, []);

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

  const handleOpenKeySelector = async () => {
    if (window.aistudio?.openSelectKey) {
      await window.aistudio.openSelectKey();
      // FIX: Per guidelines, assume key selection success to avoid race condition with hasSelectedApiKey
      setHasPersonalKey(true);
    }
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
      console.error("Auto-Recovery Triggered:", error);
      const errorMessage = error?.message || "";
      
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

  return (
    <div className="flex h-screen w-full overflow-hidden bg-[#050507]">
      <Sidebar 
        config={logoConfig} 
        setConfig={setLogoConfig} 
        onGenerate={handleQuickGenerate}
        status={status}
        onSelectKey={handleOpenKeySelector}
        hasKey={hasPersonalKey}
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
            onSelectKey={handleOpenKeySelector}
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
