
import { GoogleGenAI } from "@google/genai";

// Hierarquia de modelos otimizada para estabilidade
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
      
      if (message.includes("Requested entity was not found") || message.includes("API_KEY_INVALID") || message.includes("401") || message.includes("403")) {
        throw error;
      }

      const isQuotaError = message.includes("429") || message.includes("RESOURCE_EXHAUSTED") || message.includes("quota");
      if (isQuotaError && attempt < maxRetries - 1) {
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
    // Sempre cria uma nova instância para garantir o uso da chave mais recente
    const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });
    
    const systemPrompt = `
      ACT AS A WORLD-CLASS GRAPHIC DESIGNER SPECIALIZING IN MODERN 3D MMORPG LOGOS.
      CORE MISSION: GENERATE A STUNNING LOGO WITH MODERN STYLIZED TYPOGRAPHY.
      SPECIFICATIONS:
      - FONT STYLE: CUSTOM, EMBOSSED, 3D METALLIC, OR GLOWING CRYSTAL TEXT. 
      - RENDERING: UNREAL ENGINE 5 STYLE, RAY-TRACING, CINEMATIC LIGHTING.
      - ART STYLE: CURRENT GEN GAMING IDENTITY. NO GENERIC FONTS (ARIAL/TIMES).
      - COMPOSITION: CENTERED, SHARP EDGES, EPIC AURA.
      MANDATORY: THE NAME OF THE SERVER MUST BE THE MAIN FOCUS WITH A MODERN ARTISTIC FONT.
    `;

    const instruction = isRefinement 
      ? `UPDATING LOGO ARTWORK: ${prompt}. Preserve the brand identity but apply the changes requested with modern 3D rendering.` 
      : `FORGING NEW BRAND IDENTITY: ${prompt}. The logo must look like a high-end Lineage 2 / Aion modern server logo with stylized custom lettering.`;

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
    const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });
    const relevantHistory = isOptimized ? history.slice(-4) : history;

    const chat = ai.chats.create({
      model: modelId,
      history: relevantHistory.map(h => ({
        role: h.role === 'assistant' ? 'model' : 'user',
        parts: [{ text: h.content }]
      })),
      config: {
        systemInstruction: "You are the 'Logo Forge Specialist'. Guide the user to choose the best styles for a modern MMORPG server. Be professional, technical, and always suggest stylized fonts and 3D effects.",
      },
    });

    const response = await chat.sendMessage({ message });
    return response.text;
  }).catch(handleApiError);
};
