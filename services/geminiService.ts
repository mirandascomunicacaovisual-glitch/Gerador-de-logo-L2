
import { GoogleGenAI } from "@google/genai";

// Hierarquia de modelos otimizada para estabilidade (Flash primeiro para evitar 429)
const IMAGE_MODELS_POOL = [
  'gemini-2.5-flash-image',
  'gemini-3-pro-image-preview'
];

const CHAT_MODELS_POOL = [
  'gemini-3-flash-preview',
  'gemini-3-pro-preview',
  'gemini-flash-lite-latest'
];

const sleep = (ms: number) => new Promise(resolve => setTimeout(resolve, ms));

/**
 * Sistema de Chamada Inteligente com Rotação de Modelo e Limpeza de Contexto
 */
async function executeWithAutoRotation<T>(
  taskType: 'image' | 'chat',
  fn: (modelId: string, isOptimized: boolean) => Promise<T>,
  maxRetries = 3
): Promise<T> {
  const modelPool = taskType === 'image' ? IMAGE_MODELS_POOL : CHAT_MODELS_POOL;
  let lastError: any;

  for (let attempt = 0; attempt < maxRetries; attempt++) {
    const currentModel = modelPool[attempt] || modelPool[modelPool.length - 1];
    const isOptimized = attempt > 0;

    try {
      console.log(`Tentativa ${attempt + 1}: Usando ${currentModel} (Otimizado: ${isOptimized})`);
      return await fn(currentModel, isOptimized);
    } catch (error: any) {
      lastError = error;
      const message = error?.message || "";
      const isQuotaError = message.includes("429") || message.includes("RESOURCE_EXHAUSTED") || message.includes("quota");

      if (isQuotaError && attempt < maxRetries - 1) {
        // Rotação silenciosa: espera um pouco e tenta o próximo modelo da lista
        await sleep(Math.pow(2, attempt) * 1000);
        continue;
      }
      throw error;
    }
  }
  throw lastError;
}

const handleApiError = (error: any) => {
  const message = error?.message || "";
  if (message.includes("429") || message.includes("RESOURCE_EXHAUSTED")) {
    throw new Error("QUOTA_EXCEEDED");
  }
  throw error;
};

export const generateLogo = async (prompt: string, baseImage?: string, isRefinement: boolean = false) => {
  return executeWithAutoRotation('image', async (modelId, isOptimized) => {
    // FIX: Always create new instance right before call to use current API key
    const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });
    
    const systemPrompt = isOptimized 
      ? "L2 3D LOGO ARTIST. EPIC STYLE."
      : "ACT AS A WORLD-CLASS SENIOR ART DIRECTOR FOR AAA MMORPG BRANDING. STYLE: UNREAL ENGINE 5, HYPER-REALISM.";

    const instruction = isRefinement 
      ? `Update: ${prompt}` 
      : `Create: ${prompt}`;

    const parts: any[] = [{ text: `${systemPrompt}\n${instruction}` }];

    if (baseImage) {
      parts.push({
        inlineData: {
          mimeType: 'image/png',
          data: baseImage.split(',')[1]
        }
      });
    }

    const imageConfig: any = {
      aspectRatio: "1:1",
    };

    // FIX: imageSize is only supported on gemini-3-pro-image-preview
    if (modelId === 'gemini-3-pro-image-preview') {
      imageConfig.imageSize = "1K";
    }

    const response = await ai.models.generateContent({
      model: modelId,
      contents: { parts },
      config: {
        imageConfig
      }
    });

    // FIX: Correctly iterate through parts to find image, as response may contain mixed types
    for (const part of response.candidates?.[0]?.content?.parts || []) {
      if (part.inlineData) {
        return `data:image/png;base64,${part.inlineData.data}`;
      }
    }
    throw new Error("Empty Response");
  }).catch(handleApiError);
};

export const chatWithAI = async (message: string, history: { role: 'user' | 'assistant', content: string }[]) => {
  return executeWithAutoRotation('chat', async (modelId, isOptimized) => {
    // FIX: Always create new instance right before call to use current API key
    const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });
    const relevantHistory = isOptimized ? history.slice(-2) : history;

    const chat = ai.chats.create({
      model: modelId,
      history: relevantHistory.map(h => ({
        role: h.role === 'assistant' ? 'model' : 'user',
        parts: [{ text: h.content }]
      })),
      config: {
        systemInstruction: "Diretor L2 Forge. Seja breve e técnico.",
      },
    });

    // FIX: Accessing response.text property directly as per guidelines
    const response = await chat.sendMessage({ message });
    return response.text;
  }).catch(handleApiError);
};
