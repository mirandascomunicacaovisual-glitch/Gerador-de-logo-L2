
import { GoogleGenAI } from "@google/genai";

// Modelos recomendados para geração de imagem e chat
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
    // Nova instância para garantir o uso da chave mais recente do usuário (process.env.API_KEY)
    const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });
    
    const systemPrompt = `
      ROLE: MASTER BRAND DESIGNER FOR TOP-TIER MODERN MMORPG SERVERS (2025 PREMIUM STYLE).
      MISSION: ARCHITECT A MAGNIFICENT 3D LOGO WITH EXTREMELY STYLIZED ARTISTIC TYPOGRAPHY.
      
      CRITICAL DESIGN DIRECTIVES:
      - TYPOGRAPHY: STRICTLY FORBIDDEN TO USE STANDARD SYSTEM FONTS. ALL LETTERING FOR THE SERVER NAME MUST BE CUSTOM-ARTISTIC, STYLIZED, AND 3D.
      - FONT ARCHITECTURE: LETTERS MUST FEATURE LUXURY METAL BEVELS (CHROME, GOLD, POLISHED STEEL), CRYSTALLINE DEPTH, OR VOLUMETRIC GLOW.
      - VISUAL FIDELITY: UNREAL ENGINE 5 CINEMATIC QUALITY, 8K RESOLUTION, SHARP RAY-TRACED REFLECTIONS, AMBIENT OCCLUSION.
      - AESTHETIC: MODERN, CLEAN, AGGRESSIVE, AND MAJESTIC. PROFESSIONAL GAMING BRANDING AT ITS HIGHEST LEVEL.
      - COMPOSITION: CENTERED ON A DEEP DARK BACKGROUND WITH ATMOSPHERIC FOG OR PARTICLES.
    `;

    const instruction = isRefinement 
      ? `UPDATING BRAND ARTWORK: ${prompt}. Elevate the stylized 3D typography and cinematic render quality.` 
      : `FORGING NEW BRAND IDENTITY: ${prompt}. Design a unique artistic 3D font for the server name. It must look like a multi-million dollar server logo.`;

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
        systemInstruction: "Você é o 'Arquiteto de Marcas da Forja'. Seja épico, técnico e visionário. Recomende sempre tipografias 3D artísticas e efeitos visuais de última geração para servidores de elite.",
      },
    });

    const response = await chat.sendMessage({ message });
    return response.text;
  }).catch(handleApiError);
};
