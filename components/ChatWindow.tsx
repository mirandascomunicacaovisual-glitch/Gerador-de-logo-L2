
import React, { useState, useRef, useEffect } from 'react';
import { Message } from '../types';

interface ChatWindowProps {
  messages: Message[];
  onSendMessage: (text: string, image?: string) => void;
  isLoading: boolean;
}

const ChatWindow: React.FC<ChatWindowProps> = ({ messages, onSendMessage, isLoading }) => {
  const [input, setInput] = useState('');
  const [previewImage, setPreviewImage] = useState<string | null>(null);
  const scrollRef = useRef<HTMLDivElement>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
    }
  }, [messages]);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if ((input.trim() || previewImage) && !isLoading) {
      onSendMessage(input, previewImage || undefined);
      setInput('');
      setPreviewImage(null);
    }
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onloadend = () => {
        setPreviewImage(reader.result as string);
      };
      reader.readAsDataURL(file);
    }
  };

  return (
    <div className="flex flex-col h-full">
      <div className="p-4 border-b border-white/10 flex justify-between items-center">
        <span className="text-sm font-bold text-gray-400 uppercase tracking-widest">Estúdio de Refinamento</span>
        <div className="flex gap-2">
           <div className={`w-2 h-2 rounded-full ${isLoading ? 'bg-amber-500 animate-pulse' : 'bg-green-500'}`}></div>
        </div>
      </div>

      <div ref={scrollRef} className="flex-1 overflow-y-auto p-4 space-y-4">
        {messages.map((msg) => (
          <div key={msg.id} className={`flex ${msg.role === 'user' ? 'justify-end' : 'justify-start'}`}>
            <div className={`max-w-[85%] p-3 rounded-2xl text-sm ${
              msg.role === 'user' 
                ? 'bg-amber-500/10 border border-amber-500/20 text-white rounded-tr-none' 
                : 'bg-white/5 border border-white/10 text-gray-300 rounded-tl-none'
            }`}>
              {msg.image && (
                <img src={msg.image} alt="Upload" className="w-full h-auto rounded-lg mb-2 border border-white/10" />
              )}
              {msg.content}
            </div>
          </div>
        ))}
      </div>

      {previewImage && (
        <div className="px-4 pb-2 relative">
          <div className="relative inline-block">
            <img src={previewImage} className="w-16 h-16 object-cover rounded-lg border border-amber-500" alt="Preview" />
            <button 
              onClick={() => setPreviewImage(null)}
              className="absolute -top-2 -right-2 bg-red-500 text-white rounded-full w-5 h-5 flex items-center justify-center text-[10px]"
            >
              <i className="fa-solid fa-xmark"></i>
            </button>
          </div>
          <p className="text-[10px] text-amber-500 mt-1 uppercase font-bold">Imagem para melhoramento pronta</p>
        </div>
      )}

      <form onSubmit={handleSubmit} className="p-4 bg-white/5 border-t border-white/10">
        <div className="flex gap-2 items-end">
          <button 
            type="button"
            onClick={() => fileInputRef.current?.click()}
            className="p-3 rounded-xl bg-white/10 hover:bg-white/20 text-gray-400 transition-all border border-white/5"
          >
            <i className="fa-solid fa-image"></i>
          </button>
          <input 
            type="file" 
            ref={fileInputRef} 
            onChange={handleFileChange} 
            className="hidden" 
            accept="image/*"
          />
          <div className="flex-1 relative">
            <textarea
              value={input}
              onChange={(e) => setInput(e.target.value)}
              placeholder="Descreva as alterações..."
              className="w-full bg-black/40 border border-white/10 rounded-xl px-4 py-3 text-sm text-white focus:outline-none focus:border-amber-500/50 resize-none max-h-32 transition-all"
              rows={1}
            />
          </div>
          <button 
            type="submit" 
            disabled={(!input.trim() && !previewImage) || isLoading}
            className="p-3 rounded-xl bg-amber-500 text-black font-bold disabled:bg-gray-700 disabled:text-gray-500 transition-all shadow-lg"
          >
            <i className="fa-solid fa-paper-plane"></i>
          </button>
        </div>
      </form>
    </div>
  );
};

export default ChatWindow;
