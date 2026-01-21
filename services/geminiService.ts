
import { GoogleGenAI } from "@google/genai";

const IMAGE_MODELS_POOL = [
  'gemini-3-pro-image-preview', 
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
    try {
      return await fn(currentModel, attempt > 0);
    } catch (error: any) {
      lastError = error;
      const message = error?.message || "";
      if (message.includes("Requested entity was not found") || message.includes("API_KEY_INVALID")) throw error;
      if ((message.includes("429") || message.includes("quota")) && attempt < maxRetries - 1) {
        await sleep(2000);
        continue;
      }
      throw error;
    }
  }
  throw lastError;
}

export const generateLogo = async (prompt: string, baseImage?: string, isRefinement: boolean = false) => {
  return executeWithAutoRotation('image', async (modelId) => {
    const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });
    
    const systemPrompt = `
      ROLE: PREEMINENT BRAND DESIGNER FOR 2025.
      OBJECTIVE: CREATE A LOGO THAT IS CUTTING-EDGE, MODERN, AND STYLIZED.
      
      CRITICAL DESIGN RULES:
      - TYPOGRAPHY: USE ONLY HIGHLY CUSTOMIZED, STYLIZED SANS-SERIF OR FUTURISTIC GEOMETRIC FONTS. AVOID GENERIC GOTHIC OR OLD-FASHIONED SERIF FONTS.
      - AESTHETIC: MINIMALIST BUT POWERFUL. THINK APPLE, TESLA, OR HIGH-END TECH BRANDS BUT WITH AN EPIC MMO TWIST.
      - RENDERING: 3D DEPTH WITH SOFT RAY-TRACED SHADOWS, BRUSHED TITANIUM, MATTE BLACK, OR LIQUID GOLD MATERIALS.
      - COMPOSITION: ICONIC SYMBOL INTEGRATED WITH THE NAME. USE NEGATIVE SPACE CREATIVELY.
      - QUALITY: 8K RESOLUTION, CLEAN VECTOR-LIKE SHARPNESS, CINEMATIC STUDIO LIGHTING.
      - NO BUSY BACKGROUNDS. SOLID DARK GREY OR BLACK ONLY.
    `;

    const fullPrompt = `${systemPrompt}\n\nTASK: ${isRefinement ? 'Evolve this existing logo into a more modern 2025 masterpiece: ' : 'Create a brand new ultra-modern logo: '} ${prompt}. THE NAME MUST BE STYLIZED AND CLEAR.`;

    const parts: any[] = [{ text: fullPrompt }];
    if (baseImage) {
      parts.push({
        inlineData: {
          mimeType: 'image/png',
          data: baseImage.split(',')[1]
        }
      });
    }

    const imageConfig: any = { aspectRatio: "1:1" };
    if (modelId === 'gemini-3-pro-image-preview') imageConfig.imageSize = "1K";

    const response = await ai.models.generateContent({
      model: modelId,
      contents: { parts },
      config: { imageConfig }
    });

    for (const part of response.candidates?.[0]?.content?.parts || []) {
      if (part.inlineData) return `data:image/png;base64,${part.inlineData.data}`;
    }
    throw new Error("API returned no image data.");
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
        systemInstruction: "Você é o 'Brand Architect Pro'. Sua missão é ajudar a definir marcas modernas de Lineage 2 usando as tendências de design de 2025. Seja técnico, direto e inspire-se em design minimalista e futurista. Sempre confirme que a Central de Contas está ativa e protegida.",
      },
    });
    const response = await chat.sendMessage({ message });
    return response.text;
  });
};
