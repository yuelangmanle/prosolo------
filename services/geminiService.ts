import { GoogleGenAI, Type, Schema } from "@google/genai";
import { ProSoloData } from "../types";

// 从localStorage获取Gemini配置
const getGeminiConfig = () => {
  const savedConfig = localStorage.getItem('apiConfig');
  if (savedConfig) {
    const config = JSON.parse(savedConfig);
    return {
      apiKey: config.geminiApiKey || '',
      modelId: config.geminiModel || 'gemini-1.5-flash'
    };
  }
  // 回退到环境变量
  return {
    apiKey: import.meta.env.VITE_GEMINI_API_KEY || '',
    modelId: import.meta.env.VITE_GEMINI_MODEL || 'gemini-1.5-flash'
  };
};

// 创建GoogleGenAI实例的函数（每次调用时检查配置）
const createGeminiClient = () => {
  const config = getGeminiConfig();
  return new GoogleGenAI({ apiKey: config.apiKey });
};

// Helper to convert File to Base64
const fileToBase64 = (file: File): Promise<string> => {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.readAsDataURL(file);
    reader.onload = () => {
      const result = reader.result as string;
      // Remove the Data URL prefix (e.g., "data:image/jpeg;base64,")
      const base64 = result.split(",")[1];
      resolve(base64);
    };
    reader.onerror = (error) => reject(error);
  });
};

const extractionSchema: Schema = {
  type: Type.OBJECT,
  properties: {
    temp: { type: Type.NUMBER, description: "Temperature in Celsius (°C)", nullable: true },
    mmhg: { type: Type.NUMBER, description: "Pressure in mmHg", nullable: true },
    do_pct: { type: Type.NUMBER, description: "Dissolved Oxygen in % (DO %)", nullable: true },
    do_mgl: { type: Type.NUMBER, description: "Dissolved Oxygen in mg/L (DO mg/L)", nullable: true },
  },
  required: ["temp", "mmhg", "do_pct", "do_mgl"],
};

// 内部函数，实现Gemini API调用并支持重试
const callGeminiApi = async (file: File, retryCount: number = 0): Promise<ProSoloData> => {
  const base64Data = await fileToBase64(file);
  
  // 获取当前配置
  const config = getGeminiConfig();

  // 检查API密钥是否存在
  if (!config.apiKey || config.apiKey.trim() === '') {
    throw new Error('API key is missing. Please provide a valid API key.');
  }

  const prompt = `
    Analyze this image of a YSI ProSolo water quality meter screen.
    The image might be rotated (portrait or landscape).
    Extract the following 4 numerical values exactly as displayed:
    1. Temperature (°C)
    2. Pressure (mmHg)
    3. Dissolved Oxygen % (DO %)
    4. Dissolved Oxygen mg/L (DO mg/L)

    If a value is blurry, unreadable, or missing, return null for that field.
  `;

  // 创建Gemini客户端（每次调用时使用最新配置）
  const genAI = createGeminiClient();

  try {
    const response = await genAI.models.generateContent({
      model: config.modelId, // 使用配置的模型
      contents: {
        parts: [
          {
            inlineData: {
              mimeType: file.type,
              data: base64Data,
            },
          },
          { text: prompt },
        ],
      },
      config: {
        responseMimeType: "application/json",
        responseSchema: extractionSchema,
        temperature: 0.1, // Low temperature for factual extraction
      },
    });

    const text = response.text;
    if (!text) {
      throw new Error("No response text from Gemini");
    }

    const data = JSON.parse(text) as ProSoloData;
    return data;
  } catch (error: any) {
    // 分类处理不同类型的错误
    let errorMessage = 'Failed to extract data from image';
    
    // 检查是否是速率限制错误
    if (error.message?.includes('429') || error.message?.includes('rate limit') || error.message?.includes('quota')) {
      if (retryCount < 5) {
        // 优先使用API返回的Retry-After头信息
        let retryDelay;
        
        // 检查错误响应中是否有retryAfter信息
        const retryAfter = error.retryAfter || error.response?.headers?.get('Retry-After');
        
        if (retryAfter) {
          if (/^\d+$/.test(String(retryAfter))) {
            retryDelay = parseInt(String(retryAfter)) * 1000;
          } else {
            // 如果是日期，计算当前时间与重试时间的差值
            const retryDate = new Date(String(retryAfter)).getTime();
            const now = new Date().getTime();
            retryDelay = Math.max(1000, retryDate - now);
          }
        } else {
          // 如果没有明确的重试时间，使用指数退避策略
          retryDelay = Math.min(Math.pow(2, retryCount) * 1000, 30000); // 最大30秒
        }
        
        console.log(`Gemini rate limited, retrying in ${Math.round(retryDelay / 1000)}s... (Attempt ${retryCount + 1}/5)`);
        await new Promise(resolve => setTimeout(resolve, retryDelay));
        return callGeminiApi(file, retryCount + 1);
      } else {
        errorMessage = 'Gemini API rate limit exceeded after multiple attempts. Please try again later or consider upgrading your API plan.';
      }
    } 
    // 检查是否是网络错误
    else if (!navigator.onLine || error.message?.includes('NetworkError') || error.message?.includes('fetch failed')) {
      errorMessage = 'Network error detected. Please check your internet connection and try again.';
    }
    // 检查是否是CORS错误
    else if (error.message?.includes('CORS') || error.message?.includes('cross-origin')) {
      errorMessage = 'CORS error occurred. Please ensure the API is properly configured for cross-origin requests.';
    }
    // 检查是否是认证错误
    else if (error.message?.includes('401') || error.message?.includes('unauthorized') || error.message?.includes('invalid API key')) {
      errorMessage = 'Invalid API key. Please provide a valid Gemini API key in the settings.';
    }
    // 检查是否是模型不存在错误
    else if (error.message?.includes('404') || error.message?.includes('model not found')) {
      errorMessage = `Specified model "${config.modelId}" not found. Please check the model ID in settings.`;
    }
    // 其他Gemini API错误
    else if (error.response?.status) {
      errorMessage = `Gemini API error (${error.response.status}): ${error.message || 'Unknown API error'}`;
    }
    // 通用错误
    else {
      errorMessage = `Error processing image: ${error.message || 'Unknown error'}`;
    }
    
    // 抛出分类后的错误
    throw new Error(errorMessage);
  }
};

export const extractDataFromImage = async (file: File): Promise<ProSoloData> => {
  try {
    return await callGeminiApi(file);
  } catch (error) {
    console.error("Gemini Extraction Error:", error);
    // 提供更明确的错误信息给用户
    if (error instanceof Error) {
      throw error;
    }
    // Return nulls if extraction fails completely
    return {
      temp: null,
      mmhg: null,
      do_pct: null,
      do_mgl: null,
    };
  }
};