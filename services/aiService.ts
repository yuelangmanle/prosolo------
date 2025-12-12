import { ProSoloData } from '../types';
import { ApiConfig, ApiConfigCollection } from '../components/ApiConfigModal';

// 从localStorage获取API配置
const getApiConfig = (): ApiConfig | null => {
  // 首先尝试获取新的配置集合
  const savedConfigCollection = localStorage.getItem('apiConfigCollection');
  if (savedConfigCollection) {
    const collection: ApiConfigCollection = JSON.parse(savedConfigCollection);
    // 返回当前选中的配置
    const currentConfig = collection.configs.find((c: ApiConfig) => c.id === collection.currentConfigId);
    return currentConfig || collection.configs[0];
  }
  
  // 兼容旧版本的配置
  const savedConfig = localStorage.getItem('apiConfig');
  if (savedConfig) {
    return JSON.parse(savedConfig);
  }
  
  return null;
};

// 获取当前选中的配置ID
export const getCurrentConfigId = (): string | null => {
  // 首先尝试获取新的配置集合
  const savedConfigCollection = localStorage.getItem('apiConfigCollection');
  if (savedConfigCollection) {
    const collection: ApiConfigCollection = JSON.parse(savedConfigCollection);
    return collection.currentConfigId;
  }
  
  // 兼容旧版本的配置
  const savedConfig = localStorage.getItem('apiConfig');
  if (savedConfig) {
    return 'default';
  }
  
  return null;
};

// 根据配置选择使用哪个AI服务
const shouldUseOpenAI = () => {
  const config = getApiConfig();
  
  if (config) {
    if (config.selectedApi === 'openai') {
      return config.openaiApiKey && config.openaiApiKey.trim() !== '';
    } else if (config.selectedApi === 'gemini') {
      // 如果选择了Gemini但没有API密钥，返回true会触发错误提示
      return !(config.geminiApiKey && config.geminiApiKey.trim() !== '');
    } else if (config.selectedApi === 'auto') {
      // 自动模式：优先使用OpenAI（如果有有效密钥），否则检查Gemini
      if (config.openaiApiKey && config.openaiApiKey.trim() !== '') {
        return true;
      }
      // 如果没有OpenAI密钥，检查Gemini密钥是否存在
      return !(config.geminiApiKey && config.geminiApiKey.trim() !== '');
    }
  }
  
  // 没有配置时，回退到环境变量
  // 使用类型断言绕过 TypeScript 检查
  return (import.meta as any).env?.VITE_OPENAI_API_KEY && (import.meta as any).env.VITE_OPENAI_API_KEY !== 'PLACEHOLDER_OPENAI_API_KEY';
};

// 统一的API接口
export const extractDataFromImage = async (file: File): Promise<ProSoloData> => {
  try {
    const config = getApiConfig();
    
    // 检查配置和API密钥
    if (config) {
      if (config.selectedApi === 'gemini' || (config.selectedApi === 'auto' && (!config.openaiApiKey || config.openaiApiKey.trim() === ''))) {
        // 准备使用Gemini服务，检查API密钥
        if (!config.geminiApiKey || config.geminiApiKey.trim() === '') {
          throw new Error('Gemini API密钥缺失，请在API配置中提供有效的Gemini API密钥');
        }
      } else if (config.selectedApi === 'openai' || (config.selectedApi === 'auto' && config.openaiApiKey && config.openaiApiKey.trim() !== '')) {
        // 准备使用OpenAI服务，检查API密钥
        if (!config.openaiApiKey || config.openaiApiKey.trim() === '') {
          throw new Error('OpenAI API密钥缺失，请在API配置中提供有效的OpenAI API密钥');
        }
      }
    } else {
      // 没有配置时，检查环境变量
      const hasOpenAIKey = (import.meta as any).env?.VITE_OPENAI_API_KEY && (import.meta as any).env.VITE_OPENAI_API_KEY !== 'PLACEHOLDER_OPENAI_API_KEY';
      const hasGeminiKey = (import.meta as any).env?.VITE_GEMINI_API_KEY && (import.meta as any).env.VITE_GEMINI_API_KEY !== 'PLACEHOLDER_GEMINI_API_KEY';
      
      if (!hasOpenAIKey && !hasGeminiKey) {
        throw new Error('API密钥缺失，请在环境变量或API配置中提供有效的OpenAI或Gemini API密钥');
      }
    }
    
    if (shouldUseOpenAI()) {
      // 使用OpenAI服务
      const { extractDataFromImage: openaiExtract } = await import('./openaiService');
      return openaiExtract(file);
    } else {
      // 使用Gemini服务
      const { extractDataFromImage: geminiExtract } = await import('./geminiService');
      return geminiExtract(file);
    }
  } catch (error) {
    console.error("AI Service Error:", error);
    // 返回错误信息，让UI层可以显示给用户
    throw error;
  }
};

// 导出获取配置的函数（用于UI显示）
export { getApiConfig };
