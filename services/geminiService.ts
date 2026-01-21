
import { GoogleGenAI } from "@google/genai";

// Pool de modelos para imagem e chat
const IMAGE_MODELS_POOL = [
  'gemini-2.5-flash-image',
  'gemini-3-pro-image-preview'
];

const CHAT_MODELS_POOL = [
  'gemini-3-flash-preview',
  'gemini-3-pro-preview'
];

const sleep = (ms: number) => new Promise(resolve => setTimeout(resolve, ms));

async function executeWithAutoRotation<T>(
  taskType: 'image' | 'chat',
  fn: (modelId: string) => Promise<T>
): Promise<T> {
  const modelPool = taskType === 'image' ? IMAGE_MODELS_POOL : CHAT_MODELS_POOL;
  let lastError: any;

  for (let i = 0; i < modelPool.length; i++) {
    const currentModel = modelPool[i];
    try {
      console.log(`Tentando modelo: ${currentModel}`);
      return await fn(currentModel);
    } catch (error: any) {
      lastError = error;
      const message = (error?.message || "").toLowerCase();
      
      console.warn(`Falha no modelo ${currentModel}:`, message);

      // Se for erro de faturamento ou chave inválida explicitamente, paramos a rotação
      if (
        message.includes("api_key_invalid") || 
        message.includes("401") || 
        message.includes("unauthorized")
      ) {
        throw new Error(`AUTH_ERROR: Chave de API inválida ou não autorizada.`);
      }

      // Se for o último modelo e falhou, lançamos o erro final
      if (i === modelPool.length - 1) {
        // Se o erro contém "not found", tratamos como erro de permissão/acesso de conta
        if (message.includes("not found") || message.includes("permission denied") || message.includes("403")) {
          throw new Error(`AUTH_ERROR: ${error.message}`);
        }
        throw error;
      }

      // Espera curta e tenta o próximo modelo do pool
      await sleep(1000);
      continue;
    }
  }
  throw lastError;
}

export const generateLogo = async (prompt: string, baseImage?: string, isRefinement: boolean = false) => {
  return executeWithAutoRotation('image', async (modelId) => {
    // Nova instância para garantir uso da chave mais recente
    const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });
    
    const systemPrompt = `
      ROLE: MASTER BRAND ARCHITECT.
      OBJECTIVE: DESIGN A HIGH-END LOGO WITH STYLIZED TYPOGRAPHY.
      STYLE: FUTURISTIC, 3D, LUXURY, MODERN.
      RULE: THE NAME MUST BE ARTISTICALLY RENDERED, NOT A GENERIC FONT.
    `;

    const fullPrompt = `${systemPrompt}\n\nTASK: ${isRefinement ? 'Refine/Evolve this logo: ' : 'Create new stylized logo: '} ${prompt}.`;

    const parts: any[] = [{ text: fullPrompt }];
    if (baseImage) {
      parts.push({
        inlineData: {
          mimeType: 'image/png',
          data: baseImage.split(',')[1]
        }
      });
    }

    const config: any = {
      imageConfig: { aspectRatio: "1:1" }
    };
    
    // imageSize só é suportado no gemini-3-pro-image-preview
    if (modelId === 'gemini-3-pro-image-preview') {
      config.imageConfig.imageSize = "1K";
    }

    const response = await ai.models.generateContent({
      model: modelId,
      contents: { parts },
      config
    });

    if (!response.candidates?.[0]?.content?.parts) {
      throw new Error("A IA não retornou partes de conteúdo. Verifique os filtros de segurança.");
    }

    for (const part of response.candidates[0].content.parts) {
      if (part.inlineData) return `data:image/png;base64,${part.inlineData.data}`;
      if (part.text && !baseImage) {
        // Se o modelo só retornou texto em vez de imagem, forçamos erro para tentar próximo modelo
        throw new Error("O modelo retornou apenas texto, tentando próximo modelo para imagem...");
      }
    }
    
    throw new Error("Nenhuma imagem encontrada na resposta.");
  });
};

export const chatWithAI = async (message: string, history: { role: 'user' | 'assistant', content: string }[]) => {
  return executeWithAutoRotation('chat', async (modelId) => {
    const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });
    const chat = ai.chats.create({
      model: modelId,
      history: history.map(h => ({
        role: h.role === 'assistant' ? 'model' : 'user',
        parts: [{ text: h.content }]
      })),
      config: {
        systemInstruction: "Você é o especialista em Branding. Ajude o usuário a criar descrições épicas para logos de servidores.",
      },
    });
    const response = await chat.sendMessage({ message });
    return response.text;
  });
};
