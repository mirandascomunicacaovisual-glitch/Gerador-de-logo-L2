
import { GoogleGenAI } from "@google/genai";

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
      return await fn(currentModel);
    } catch (error: any) {
      lastError = error;
      const message = (error?.message || "").toLowerCase();
      console.warn(`Falha no modelo ${currentModel}:`, message);

      if (i === modelPool.length - 1) throw error;
      await sleep(1000);
      continue;
    }
  }
  throw lastError;
}

export const generateLogo = async (prompt: string, baseImage?: string, isRefinement: boolean = false) => {
  return executeWithAutoRotation('image', async (modelId) => {
    const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });
    
    const systemPrompt = `
      ROLE: MASTER BRAND ARCHITECT 2025.
      OBJECTIVE: DESIGN A MODERN LOGO FOR L2 SERVERS.
      STYLE: MINIMALIST, HIGH-END, STYLIZED TYPOGRAPHY.
      MANDATORY: TEXT MUST BE ARTISTICALLY RENDERED.
    `;

    const fullPrompt = `${systemPrompt}\n\nTASK: ${isRefinement ? 'Refine this logo: ' : 'Create new stylized logo: '} ${prompt}.`;

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
    
    if (modelId === 'gemini-3-pro-image-preview') {
      config.imageConfig.imageSize = "1K";
    }

    const response = await ai.models.generateContent({
      model: modelId,
      contents: { parts },
      config
    });

    const candidate = response.candidates?.[0];
    if (!candidate?.content?.parts) throw new Error("A API não retornou imagem. Verifique se o prompt é permitido.");

    for (const part of candidate.content.parts) {
      if (part.inlineData) return `data:image/png;base64,${part.inlineData.data}`;
    }
    throw new Error("Nenhuma imagem gerada. Tente descrever de outra forma.");
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
        systemInstruction: "Você é o especialista em Branding L2 Forge. Ajude o usuário a definir sua logomarca.",
      },
    });
    const response = await chat.sendMessage({ message });
    return response.text;
  });
};
