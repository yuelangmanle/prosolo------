import { ProSoloData } from '../types';

// 从localStorage获取OpenAI配置
const getOpenAIConfig = () => {
  const savedConfig = localStorage.getItem('apiConfig');
  if (savedConfig) {
    const config = JSON.parse(savedConfig);
    return {
      apiKey: config.openaiApiKey || '',
      baseURL: config.openaiBaseUrl || '',
      model: config.openaiModel || 'gpt-4o-mini'
    };
  }
  // 回退到环境变量
  return {
    apiKey: import.meta.env.VITE_OPENAI_API_KEY || '',
    baseURL: import.meta.env.VITE_OPENAI_BASE_URL || '',
    model: import.meta.env.VITE_OPENAI_MODEL || 'gpt-4o-mini'
  };
};

// 创建OpenAI API请求的辅助函数
const openaiApiRequest = async (config: ReturnType<typeof getOpenAIConfig>, endpoint: string, body: any, retryCount: number = 0): Promise<any> => {
  const url = `${config.baseURL || 'https://api.openai.com/v1'}/${endpoint}`;
  
  try {
    // 检查URL是否有效
    new URL(url);
  } catch (error) {
    throw new Error(`Invalid API URL: ${url}. Please check your API configuration.`);
  }
  
  try {
    const response = await fetch(url, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${config.apiKey}`,
      },
      body: JSON.stringify(body),
    });
  
  if (!response.ok) {
    // 处理429错误（请求过多），添加重试逻辑
    if (response.status === 429 && retryCount < 5) { // 增加到最多5次重试
      // 优先使用API返回的Retry-After头信息
      const retryAfter = response.headers.get('Retry-After');
      let retryDelay;
      
      if (retryAfter) {
        // Retry-After可以是秒数或HTTP日期
        if (/^\d+$/.test(retryAfter)) {
          retryDelay = parseInt(retryAfter) * 1000;
        } else {
          // 如果是日期，计算当前时间与重试时间的差值
          const retryDate = new Date(retryAfter).getTime();
          const now = new Date().getTime();
          retryDelay = Math.max(1000, retryDate - now); // 至少等待1秒
        }
      } else {
        // 如果没有Retry-After头，使用指数退避策略，增加最大延迟
        retryDelay = Math.min(Math.pow(2, retryCount) * 1000, 30000); // 最大30秒
      }
      
      console.log(`Rate limited, retrying in ${Math.round(retryDelay / 1000)}s... (Attempt ${retryCount + 1}/5)`);
      await new Promise(resolve => setTimeout(resolve, retryDelay));
      // 递归重试
      return openaiApiRequest(config, endpoint, body, retryCount + 1);
    }
    
    // 处理其他错误
    const errorData = await response.json().catch(() => ({}));
    let errorMessage = errorData.error?.message || `API request failed with status: ${response.status}`;
    
    // 添加更明确的429错误信息和解决方案建议
    if (response.status === 429) {
      errorMessage += " (Too Many Requests - Rate limited). Please try again later or consider upgrading your API plan.";
    }
    
    throw new Error(errorMessage);
  }
  
    return response.json();
  } catch (error: any) {
    // 处理fetch可能抛出的各种错误
    let errorMessage = '';
    
    if (error.name === 'TypeError') {
      if (error.message === 'Failed to fetch') {
        errorMessage = 'Network error. Failed to connect to the API server. Please check your internet connection and try again.';
        
        // 添加可能的解决方案
        if (config.baseURL && config.baseURL !== 'https://api.openai.com/v1') {
          errorMessage += ' If you are using a custom API endpoint, please verify it is correct and accessible.';
        }
      } else if (error.message.includes('CORS')) {
        errorMessage = 'CORS error. The API server does not allow requests from this domain. Please check your API configuration.';
      } else {
        errorMessage = `Network error: ${error.message}`;
      }
    } else {
      errorMessage = `Request failed: ${error.message || 'Unknown error'}`;
    }
    
    console.error('OpenAI API Network Error:', error);
    throw new Error(errorMessage);
  }
};

// Helper to compress image and convert to Base64
const compressImageAndConvertToBase64 = (file: File, maxSizeMB: number = 9): Promise<string> => {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.readAsDataURL(file);
    reader.onload = (event) => {
      const img = new Image();
      img.src = event.target?.result as string;
      
      img.onload = () => {
        // Create canvas for compression
        const canvas = document.createElement('canvas');
        let width = img.width;
        let height = img.height;
        
        // Calculate aspect ratio and resize if needed
        const aspectRatio = width / height;
        if (width > 1920) {
          width = 1920;
          height = width / aspectRatio;
        }
        
        canvas.width = width;
        canvas.height = height;
        
        // Draw image with compression
        const ctx = canvas.getContext('2d');
        if (!ctx) {
          reject(new Error('Canvas context not available'));
          return;
        }
        ctx.drawImage(img, 0, 0, width, height);
        
        // Compress image with quality adjustment
        let quality = 0.9;
        let base64: string;
        
        do {
          base64 = canvas.toDataURL(file.type, quality);
          quality -= 0.1;
        } while (base64.length > maxSizeMB * 1024 * 1024 && quality > 0.1);
        
        // Remove the Data URL prefix
        const base64WithoutPrefix = base64.split(",")[1];
        resolve(base64WithoutPrefix);
      };
      
      img.onerror = () => reject(new Error('Image loading failed'));
    };
    
    reader.onerror = (error) => reject(error);
  });
};

export const extractDataFromImage = async (file: File): Promise<ProSoloData> => {
  try {
    const base64Data = await compressImageAndConvertToBase64(file);
    
    // 获取当前配置
    const config = getOpenAIConfig();

    const prompt = `
      Analyze this image of a YSI ProSolo water quality meter screen.
      The image might be rotated (portrait or landscape).
      Extract the following 4 numerical values exactly as displayed:
      1. Temperature (°C)
      2. Pressure (mmHg)
      3. Dissolved Oxygen % (DO %)
      4. Dissolved Oxygen mg/L (DO mg/L)

      If a value is blurry, unreadable, or missing, return null for that field.

      Return your response as a JSON object with these exact keys: temp, mmhg, do_pct, do_mgl.
    `;

    // 使用fetch API调用OpenAI API
    const response = await openaiApiRequest(config, 'chat/completions', {
      model: config.model, // 使用配置的模型
      messages: [
        {
          role: 'system',
          content: 'You are a water quality data extraction expert. Extract numerical values from water quality meter screens accurately.'
        },
        {
          role: 'user',
          content: [
            {
              type: 'text',
              text: prompt
            },
            {
              type: 'image_url',
              image_url: {
                url: `data:${file.type};base64,${base64Data}`
              }
            }
          ]
        }
      ],
      response_format: {
        type: 'json_object'
      },
      temperature: 0.1, // Low temperature for factual extraction
    });

    const text = response.choices[0].message.content;
    if (!text) {
      throw new Error("No response text from API");
    }

    const data = JSON.parse(text) as ProSoloData;
    return data;
  } catch (error) {
    console.error("Extraction Error:", error);
    // Return nulls if extraction fails completely
    return {
      temp: null,
      mmhg: null,
      do_pct: null,
      do_mgl: null,
    };
  }
};
