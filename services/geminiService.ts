
import { GoogleGenAI } from "@google/genai";

// Pool de modelos para resiliência
const IMAGE_MODELS_POOL = [
  'gemini-3-pro-image-preview', // Preferencial para alta fidelidade e tipografia
  'gemini-2.5-flash-image'
];

const CHAT_MODELS_POOL = [
  'gemini-3-pro-preview',
  'gemini-3-flash-preview'
];

const sleep = (ms: number) => new Promise(resolve => setTimeout(resolve, ms));

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
      return await fn(currentModel, isOptimized);
    } catch (error: any) {
      lastError = error;
      const message = error?.message || "";
      
      // Se for erro de autenticação ou chave, não rotacionamos, paramos aqui
      if (message.includes("Requested entity was not found") || message.includes("API_KEY_INVALID")) {
        throw error;
      }

      const isQuotaError = message.includes("429") || message.includes("RESOURCE_EXHAUSTED") || message.includes("quota");
      if (isQuotaError && attempt < maxRetries - 1) {
        await sleep(1500);
        continue;
      }
      throw error;
    }
  }
  throw lastError;
}

export const generateLogo = async (prompt: string, baseImage?: string, isRefinement: boolean = false) => {
  return executeWithAutoRotation('image', async (modelId) => {
    // Inicialização obrigatória com process.env.API_KEY injetado pelo sistema
    const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });
    
    const systemPrompt = `
      ROLE: ELITE MMORPG BRAND ARCHITECT.
      OBJECTIVE: DESIGN A MODERN, CURRENT, AND PRESTIGIOUS 3D LOGO.
      
      STYLE RULES:
      - TYPOGRAPHY: USE EXTREMELY STYLIZED ARTISTIC FONTS. DO NOT USE GENERIC SYSTEM FONTS.
      - VISUALS: HIGH-END 3D RENDERING, METALLIC MATERIALS (GOLD, SILVER, CHROME), NEON ACCENTS, OR CRYSTALLINE TEXTURES.
      - QUALITY: CINEMATIC LIGHTING, VOLUMETRIC SHADOWS, 8K RESOLUTION DETAIL.
      - BACKGROUND: CLEAN, MINIMALIST DARK BACKGROUND TO MAKE THE LOGO POP.
      - NO GENERIC CLIPART. EVERYTHING MUST LOOK CUSTOM-MADE FOR A MULTI-MILLION DOLLAR PROJECT.
    `;

    const fullPrompt = `${systemPrompt}\n\nTASK: ${isRefinement ? 'Refine and improve this existing logo based on: ' : 'Create a brand new logo based on: '} ${prompt}. Ensure the server name is written in a highly stylized, 3D modern font.`;

    const parts: any[] = [{ text: fullPrompt }];

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

    if (modelId === 'gemini-3-pro-image-preview') {
      imageConfig.imageSize = "1K"; // Suporte a alta resolução
    }

    const response = await ai.models.generateContent({
      model: modelId,
      contents: { parts },
      config: {
        imageConfig
      }
    });

    for (const part of response.candidates?.[0]?.content?.parts || []) {
      if (part.inlineData) {
        return `data:image/png;base64,${part.inlineData.data}`;
      }
    }
    throw new Error("No image data returned from API.");
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
        systemInstruction: "Você é o 'Arquiteto de Marcas'. Ajude o usuário a criar o conceito visual de seu servidor de Lineage 2. Fale de forma épica, técnica e sempre recomende tipografias 3D estilizadas e modernas. Explique que o login Google é para identificação e os créditos são do projeto.",
      },
    });

    const response = await chat.sendMessage({ message });
    return response.text;
  });
};
