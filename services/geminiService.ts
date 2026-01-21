
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
    const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });
    
    const systemPrompt = `
      ROLE: MASTER LOGO ARCHITECT FOR MODERN ESPORTS & MMORPG COMMUNITIES.
      OBJECTIVE: Forge a state-of-the-art 3D logo with CUSTOM STYLIZED TYPOGRAPHY.
      
      CRITICAL INSTRUCTIONS:
      - TYPOGRAPHY: NEVER USE GENERIC FONTS. Create unique, stylized, custom-drawn lettering. 
      - EFFECTS: Letters must be 3D, embossed, metallic, glowing, or crystalline. Use bevels, sharp edges, and dramatic depth.
      - RENDER: Cinematic 8K, Unreal Engine 5 style, volumetric lighting, ray-tracing reflections.
      - AESTHETIC: Modern, aggressive, epic, and current (2025 gaming trends).
      - COMPOSITION: Centralized brand mark with the server name as the hero element.
      - NO NOISE: Clean, professional, high-impact branding.
    `;

    const instruction = isRefinement 
      ? `REFINING BRAND ARTWORK: ${prompt}. Apply modern 3D stylized typography and professional gaming aesthetics.` 
      : `FORGING NEW IDENTITY: ${prompt}. Focus on a unique stylized font for the name. The result must be a top-tier modern MMORPG logo.`;

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
        systemInstruction: "You are the 'Creative Director of the Forge'. Be professional, epic, and focused on current gaming branding trends. Suggest only stylized fonts and 3D effects for Lineage 2 server identities.",
      },
    });

    const response = await chat.sendMessage({ message });
    return response.text;
  }).catch(handleApiError);
};
