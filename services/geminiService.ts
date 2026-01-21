
import { GoogleGenAI } from "@google/genai";

// Priorizamos o 2.5-flash-image por ser mais compatível com chaves gratuitas/padrão.
// O 3-pro-image-preview é deixado como segunda opção ou para casos específicos.
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
  fn: (modelId: string) => Promise<T>,
  maxRetries = 2
): Promise<T> {
  const modelPool = taskType === 'image' ? IMAGE_MODELS_POOL : CHAT_MODELS_POOL;
  let lastError: any;

  for (let attempt = 0; attempt < maxRetries; attempt++) {
    const currentModel = modelPool[attempt] || modelPool[modelPool.length - 1];
    try {
      return await fn(currentModel);
    } catch (error: any) {
      lastError = error;
      const message = (error?.message || "").toLowerCase();
      
      // Detecção de erros de autenticação/permissão críticos
      if (
        message.includes("requested entity was not found") || 
        message.includes("api_key_invalid") || 
        message.includes("permission denied") || 
        message.includes("401") || 
        message.includes("403")
      ) {
        throw new Error(`AUTH_ERROR: ${error.message}`);
      }
      
      // Rotação para o próximo modelo em caso de quota ou erro temporário
      if ((message.includes("429") || message.includes("quota")) && attempt < maxRetries - 1) {
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
    const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });
    
    const systemPrompt = `
      ROLE: MASTER BRAND ARCHITECT 2025.
      OBJECTIVE: DESIGN A MODERN, CUTTING-EDGE LOGO FOR L2 SERVERS.
      STYLE: MINIMALIST, HIGH-END, STYLIZED TYPOGRAPHY, 3D GEOMETRIC ELEMENTS.
      MANDATORY: NO GENERIC FONTS. THE TEXT MUST BE ARTISTICALLY STYLIZED AND FUTURISTIC.
    `;

    const fullPrompt = `${systemPrompt}\n\nTASK: ${isRefinement ? 'Refine this existing logo to be ultra-modern: ' : 'Create a brand new futuristic logo: '} ${prompt}. THE NAME MUST BE STYLIZED.`;

    const parts: any[] = [{ text: fullPrompt }];
    if (baseImage) {
      parts.push({
        inlineData: {
          mimeType: 'image/png',
          data: baseImage.split(',')[1]
        }
      });
    }

    const config: any = {};
    if (modelId.includes('gemini-3')) {
      config.imageConfig = { aspectRatio: "1:1", imageSize: "1K" };
    } else {
      config.imageConfig = { aspectRatio: "1:1" };
    }

    const response = await ai.models.generateContent({
      model: modelId,
      contents: { parts },
      config
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
        systemInstruction: "Você é o 'Brand Designer'. Ajude o usuário a definir sua identidade visual moderna. Use tom profissional e épico.",
      },
    });
    const response = await chat.sendMessage({ message });
    return response.text;
  });
};
