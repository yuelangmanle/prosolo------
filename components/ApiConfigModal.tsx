import React, { useState, useEffect } from 'react';
import { X, Save, RefreshCw, Download, Upload, Plus, Trash2, Copy, CheckCircle } from 'lucide-react';

interface ApiConfigModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSave: (configs: ApiConfig[], currentConfigId: string) => void;
}

export interface ApiConfig {
  id: string;
  name: string;
  selectedApi: 'openai' | 'gemini' | 'auto';
  openaiApiKey: string;
  openaiModel: string;
  openaiBaseUrl: string;
  geminiApiKey: string;
  geminiModel: string;
}

// 配置集合接口
export interface ApiConfigCollection {
  configs: ApiConfig[];
  currentConfigId: string;
}

// 默认配置
const defaultConfig: ApiConfig = {
  id: 'default',
  name: '默认配置',
  selectedApi: 'auto',
  openaiApiKey: '',
  openaiModel: 'gpt-4o-mini',
  openaiBaseUrl: '',
  geminiApiKey: '',
  geminiModel: 'gemini-1.5-flash'
};

// 默认配置集合
const defaultConfigCollection: ApiConfigCollection = {
  configs: [defaultConfig],
  currentConfigId: 'default'
};

export const ApiConfigModal: React.FC<ApiConfigModalProps> = ({ isOpen, onClose, onSave }) => {
  const [configs, setConfigs] = useState<ApiConfig[]>([defaultConfig]);
  const [currentConfigId, setCurrentConfigId] = useState<string>('default');
  const [config, setConfig] = useState<ApiConfig>(defaultConfig);
  const [isSaving, setIsSaving] = useState(false);
  const [isTesting, setIsTesting] = useState(false);
  const [successMessage, setSuccessMessage] = useState('');

  // 从localStorage加载配置
  useEffect(() => {
    if (isOpen) {
      const savedConfigCollection = localStorage.getItem('apiConfigCollection');
      if (savedConfigCollection) {
        const collection: ApiConfigCollection = JSON.parse(savedConfigCollection);
        setConfigs(collection.configs);
        setCurrentConfigId(collection.currentConfigId);
        
        // 设置当前配置
        const current = collection.configs.find(c => c.id === collection.currentConfigId) || collection.configs[0];
        if (current) {
          setConfig(current);
        }
      } else {
        // 兼容旧版本的配置
        const savedConfig = localStorage.getItem('apiConfig');
        if (savedConfig) {
          const oldConfig: Omit<ApiConfig, 'id' | 'name'> = JSON.parse(savedConfig);
          const migratedConfig: ApiConfig = {
            id: 'migrated',
            name: '迁移配置',
            ...oldConfig
          };
          setConfigs([migratedConfig]);
          setCurrentConfigId('migrated');
          setConfig(migratedConfig);
        } else {
          // 如果没有保存的配置，尝试从环境变量中加载（仅用于显示）
          setConfig(prev => ({
            ...prev,
            openaiModel: import.meta.env.VITE_OPENAI_MODEL || prev.openaiModel,
            geminiModel: import.meta.env.VITE_GEMINI_MODEL || prev.geminiModel
          }));
        }
      }
      setSuccessMessage('');
    }
  }, [isOpen]);

  // 保存配置
  const handleSave = async () => {
    setIsSaving(true);
    setSuccessMessage('');
    
    try {
      // 验证配置
      const validationErrors = await validateConfig(config);
      if (validationErrors.length > 0) {
        throw new Error('配置验证失败：\n' + validationErrors.join('\n'));
      }
      
      // 更新配置列表
      const updatedConfigs = configs.map(c => c.id === config.id ? config : c);
      setConfigs(updatedConfigs);
      
      // 创建配置集合
      const configCollection: ApiConfigCollection = {
        configs: updatedConfigs,
        currentConfigId: config.id
      };
      
      // 保存到localStorage
      localStorage.setItem('apiConfigCollection', JSON.stringify(configCollection));
      
      // 调用父组件的保存函数
      onSave(updatedConfigs, config.id);
      
      setSuccessMessage('配置已保存！');
      setTimeout(() => setSuccessMessage(''), 2000);
    } catch (error) {
      console.error('保存配置失败:', error);
      alert(error instanceof Error ? error.message : '保存配置失败：未知错误');
    } finally {
      setIsSaving(false);
    }
  };

  // 重置配置
  const handleReset = () => {
    setConfig(defaultConfig);
  };

  // 添加新配置
  const handleAddNewConfig = () => {
    const newConfig: ApiConfig = {
      id: Date.now().toString(),
      name: `配置 ${configs.length + 1}`,
      selectedApi: 'auto',
      openaiApiKey: '',
      openaiModel: 'gpt-4o-mini',
      openaiBaseUrl: '',
      geminiApiKey: '',
      geminiModel: 'gemini-1.5-flash'
    };
    setConfigs([...configs, newConfig]);
    setConfig(newConfig);
  };

  // 复制配置
  const handleCopyConfig = () => {
    const newConfig: ApiConfig = {
      ...config,
      id: Date.now().toString(),
      name: `${config.name} (副本)`
    };
    setConfigs([...configs, newConfig]);
    setConfig(newConfig);
  };

  // 删除配置
  const handleDeleteConfig = (id: string) => {
    if (configs.length <= 1) {
      alert('至少需要保留一个配置');
      return;
    }
    
    if (confirm('确定要删除这个配置吗？')) {
      const updatedConfigs = configs.filter(c => c.id !== id);
      setConfigs(updatedConfigs);
      
      // 如果删除的是当前配置，切换到第一个配置
      if (id === config.id) {
        setConfig(updatedConfigs[0]);
      }
    }
  };

  // 切换配置
  const handleSwitchConfig = (id: string) => {
    const selectedConfig = configs.find(c => c.id === id);
    if (selectedConfig) {
      setConfig(selectedConfig);
    }
  };

  // 导出配置
  const handleExportConfig = () => {
    const configCollection: ApiConfigCollection = {
      configs: configs,
      currentConfigId: config.id
    };
    
    const dataStr = JSON.stringify(configCollection, null, 2);
    const dataBlob = new Blob([dataStr], { type: 'application/json' });
    
    const link = document.createElement('a');
    link.href = URL.createObjectURL(dataBlob);
    link.download = `prosolo-api-config-${new Date().toISOString().slice(0, 10)}.json`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  // 导入配置 - 文件选择处理
  const handleImportConfigFile = (file: File) => {
    const reader = new FileReader();
    reader.onload = (e) => {
      try {
        const content = e.target?.result as string;
        const importedCollection: ApiConfigCollection = JSON.parse(content);
        
        // 验证导入的数据结构
        if (!importedCollection.configs || !Array.isArray(importedCollection.configs)) {
          throw new Error('无效的配置文件格式');
        }
        
        // 验证每个配置项
        for (const config of importedCollection.configs) {
          if (!config.id || !config.name) {
            throw new Error('配置文件包含无效的配置项');
          }
        }
        
        // 更新配置
        setConfigs(importedCollection.configs);
        setCurrentConfigId(importedCollection.currentConfigId);
        
        // 设置当前配置
        const current = importedCollection.configs.find(c => c.id === importedCollection.currentConfigId) || importedCollection.configs[0];
        if (current) {
          setConfig(current);
        }
        
        alert('配置导入成功！');
      } catch (error) {
        console.error('导入配置失败:', error);
        alert('配置导入失败：' + (error instanceof Error ? error.message : '未知错误'));
      }
    };
    
    reader.readAsText(file);
  };

  // 导入配置 - 触发文件选择
  const handleImportConfig = () => {
    const input = document.createElement('input');
    input.type = 'file';
    input.accept = '.json';
    
    input.onchange = (event) => {
      const file = (event.target as HTMLInputElement).files?.[0];
      if (!file) return;
      
      handleImportConfigFile(file);
    };
    
    input.click();
  };

  // 验证配置有效性
  const validateConfig = async (configToValidate: ApiConfig) => {
    const validationErrors: string[] = [];
    
    // 验证配置名称
    if (!configToValidate.name || configToValidate.name.trim() === '') {
      validationErrors.push('配置名称不能为空');
    }
    
    // 根据选择的API类型验证相应的配置
    if (configToValidate.selectedApi === 'openai' || configToValidate.selectedApi === 'auto') {
      // 验证OpenAI配置
      if (configToValidate.selectedApi === 'openai' && 
          (!configToValidate.openaiApiKey || configToValidate.openaiApiKey.trim() === '')) {
        validationErrors.push('OpenAI API密钥不能为空');
      }
      
      // 如果提供了OpenAI密钥，验证其格式（基本验证）
      if (configToValidate.openaiApiKey && configToValidate.openaiApiKey.trim() !== '') {
        // OpenAI API密钥通常以"sk-"开头
        if (!configToValidate.openaiApiKey.startsWith('sk-')) {
          validationErrors.push('OpenAI API密钥格式不正确');
        }
      }
      
      // 验证OpenAI模型名称
      if (configToValidate.openaiModel && configToValidate.openaiModel.trim() !== '') {
        // 模型名称不应包含特殊字符（基本验证）
        if (!/^[a-zA-Z0-9\-_.]+$/.test(configToValidate.openaiModel)) {
          validationErrors.push('OpenAI模型名称包含无效字符');
        }
      }
    }
    
    if (configToValidate.selectedApi === 'gemini' || configToValidate.selectedApi === 'auto') {
      // 验证Gemini配置
      if (configToValidate.selectedApi === 'gemini' && 
          (!configToValidate.geminiApiKey || configToValidate.geminiApiKey.trim() === '')) {
        validationErrors.push('Gemini API密钥不能为空');
      }
      
      // 如果提供了Gemini密钥，验证其格式（基本验证）
      if (configToValidate.geminiApiKey && configToValidate.geminiApiKey.trim() !== '') {
        // Gemini API密钥通常以"AIza"开头
        if (!configToValidate.geminiApiKey.startsWith('AIza')) {
          validationErrors.push('Gemini API密钥格式不正确');
        }
      }
      
      // 验证Gemini模型名称
      if (configToValidate.geminiModel && configToValidate.geminiModel.trim() !== '') {
        // 模型名称不应包含特殊字符（基本验证）
        if (!/^[a-zA-Z0-9\-_.]+$/.test(configToValidate.geminiModel)) {
          validationErrors.push('Gemini模型名称包含无效字符');
        }
      }
    }
    
    // 验证自定义API端点（如果提供）
    if (configToValidate.openaiBaseUrl && configToValidate.openaiBaseUrl.trim() !== '') {
      try {
        new URL(configToValidate.openaiBaseUrl);
      } catch (e) {
        validationErrors.push('OpenAI自定义API端点URL格式不正确');
      }
    }
    
    return validationErrors;
  };

  // 测试配置有效性
  const testConfig = async (configToTest: ApiConfig) => {
    setIsTesting(true);
    setSuccessMessage('');
    
    try {
      // 首先进行基本验证
      const validationErrors = await validateConfig(configToTest);
      if (validationErrors.length > 0) {
        throw new Error('配置验证失败：\n' + validationErrors.join('\n'));
      }
      
      // 根据选择的API类型测试连接
      if (configToTest.selectedApi === 'openai' || 
          (configToTest.selectedApi === 'auto' && configToTest.openaiApiKey)) {
        // 测试OpenAI连接
        try {
          const response = await fetch(
            configToTest.openaiBaseUrl || 'https://api.openai.com/v1/models',
            {
              method: 'GET',
              headers: {
                'Authorization': `Bearer ${configToTest.openaiApiKey}`,
                'Content-Type': 'application/json',
              },
            }
          );
          
          if (!response.ok) {
            const errorData = await response.json().catch(() => ({}));
            throw new Error(`OpenAI API连接失败: ${errorData.error?.message || response.statusText}`);
          }
          
          // 成功连接OpenAI
          setSuccessMessage('OpenAI API连接测试成功！');
        } catch (error) {
          throw new Error(`OpenAI API连接测试失败: ${error instanceof Error ? error.message : '未知错误'}`);
        }
      } else if (configToTest.selectedApi === 'gemini' || 
                 (configToTest.selectedApi === 'auto' && configToTest.geminiApiKey)) {
        // 测试Gemini连接
        try {
          const response = await fetch(
            `https://generativelanguage.googleapis.com/v1beta/models?key=${configToTest.geminiApiKey}`,
            {
              method: 'GET',
            }
          );
          
          if (!response.ok) {
            const errorData = await response.json().catch(() => ({}));
            throw new Error(`Gemini API连接失败: ${errorData.error?.message || response.statusText}`);
          }
          
          // 成功连接Gemini
          setSuccessMessage('Gemini API连接测试成功！');
        } catch (error) {
          throw new Error(`Gemini API连接测试失败: ${error instanceof Error ? error.message : '未知错误'}`);
        }
      } else {
        setSuccessMessage('配置已保存，但未测试API连接（缺少API密钥）');
      }
    } catch (error) {
      console.error('配置测试失败:', error);
      alert(error instanceof Error ? error.message : '配置测试失败：未知错误');
    } finally {
      setIsTesting(false);
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm p-4 animate-in fade-in duration-200">
      <div 
        className="bg-white rounded-xl shadow-2xl w-full max-w-2xl max-h-[90vh] overflow-y-auto animate-in zoom-in duration-300"
        onClick={(e) => e.stopPropagation()}
      >
        {/* 头部 */}
        <div className="border-b border-slate-200 px-4 sm:px-6 py-4 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          <div className="flex items-center justify-between w-full sm:w-auto">
            <h2 className="text-lg sm:text-xl font-bold text-slate-800">API配置</h2>
            <button 
              onClick={onClose}
              className="sm:hidden text-slate-500 hover:text-slate-700 transition-colors"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
          <div className="flex items-center gap-2 w-full sm:w-auto">
            <select 
              value={config.id}
              onChange={(e) => handleSwitchConfig(e.target.value)}
              className="flex-1 px-3 py-1 border border-slate-300 rounded-lg text-sm focus:ring-2 focus:ring-blue-500 focus:border-blue-500 min-w-0"
            >
              {configs.map(cfg => (
                <option key={cfg.id} value={cfg.id}>{cfg.name}</option>
              ))}
            </select>
            <div className="flex items-center gap-1">
              <button 
                onClick={handleAddNewConfig}
                className="p-1.5 text-slate-500 hover:text-blue-600 transition-colors"
                title="添加新配置"
              >
                <Plus className="w-4 h-4" />
              </button>
              <button 
                onClick={handleCopyConfig}
                className="p-1.5 text-slate-500 hover:text-blue-600 transition-colors"
                title="复制当前配置"
              >
                <Copy className="w-4 h-4" />
              </button>
              {configs.length > 1 && (
                <button 
                  onClick={() => handleDeleteConfig(config.id)}
                  className="p-1.5 text-slate-500 hover:text-red-600 transition-colors"
                  title="删除当前配置"
                >
                  <Trash2 className="w-4 h-4" />
                </button>
              )}
            </div>
          </div>
          <button 
            onClick={onClose}
            className="hidden sm:block text-slate-500 hover:text-slate-700 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* 内容 */}
        <div className="p-4 sm:p-6 space-y-6">
          {/* 配置名称 */}
          <div className="space-y-2">
            <label className="block text-sm font-medium text-slate-700">配置名称</label>
            <input
              type="text"
              value={config.name}
              onChange={(e) => setConfig(prev => ({ ...prev, name: e.target.value }))}
              className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
              placeholder="请输入配置名称"
            />
          </div>

          {/* API选择 */}
          <div className="space-y-2">
            <label className="block text-sm font-medium text-slate-700">API服务选择</label>
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-2">
              <label className="inline-flex items-center gap-2 bg-slate-50 px-3 py-2 rounded-lg cursor-pointer hover:bg-slate-100 transition-colors border-2 border-transparent">
                <input
                  type="radio"
                  name="selectedApi"
                  value="auto"
                  checked={config.selectedApi === 'auto'}
                  onChange={(e) => setConfig(prev => ({ ...prev, selectedApi: e.target.value as 'auto' }))}
                  className="text-blue-600"
                />
                <span className="text-sm">自动选择</span>
              </label>
              <label className="inline-flex items-center gap-2 bg-slate-50 px-3 py-2 rounded-lg cursor-pointer hover:bg-slate-100 transition-colors border-2 border-transparent">
                <input
                  type="radio"
                  name="selectedApi"
                  value="openai"
                  checked={config.selectedApi === 'openai'}
                  onChange={(e) => setConfig(prev => ({ ...prev, selectedApi: e.target.value as 'openai' }))}
                  className="text-blue-600"
                />
                <span className="text-sm">OpenAI</span>
              </label>
              <label className="inline-flex items-center gap-2 bg-slate-50 px-3 py-2 rounded-lg cursor-pointer hover:bg-slate-100 transition-colors border-2 border-transparent">
                <input
                  type="radio"
                  name="selectedApi"
                  value="gemini"
                  checked={config.selectedApi === 'gemini'}
                  onChange={(e) => setConfig(prev => ({ ...prev, selectedApi: e.target.value as 'gemini' }))}
                  className="text-blue-600"
                />
                <span className="text-sm">Gemini</span>
              </label>
            </div>
            <p className="text-xs text-slate-500">
              自动选择：优先使用OpenAI API，若不可用则回退到Gemini API
            </p>
          </div>

          {/* OpenAI配置 */}
          <div className="space-y-4 bg-slate-50 p-3 sm:p-4 rounded-lg">
            <h3 className="font-semibold text-slate-800 border-b pb-2 text-sm sm:text-base">OpenAI API配置</h3>
            
            <div className="space-y-2">
              <label className="block text-sm font-medium text-slate-700">API密钥</label>
              <input
                type="password"
                value={config.openaiApiKey}
                onChange={(e) => setConfig(prev => ({ ...prev, openaiApiKey: e.target.value }))}
                placeholder="sk-..."
                className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 text-sm"
              />
            </div>

            <div className="space-y-2">
              <label className="block text-sm font-medium text-slate-700">模型名称</label>
              <input
                type="text"
                value={config.openaiModel}
                onChange={(e) => setConfig(prev => ({ ...prev, openaiModel: e.target.value }))}
                placeholder="gpt-4o-mini"
                className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 text-sm"
              />
            </div>

            <div className="space-y-2">
              <label className="block text-sm font-medium text-slate-700">自定义API端点（可选）</label>
              <input
                type="text"
                value={config.openaiBaseUrl}
                onChange={(e) => setConfig(prev => ({ ...prev, openaiBaseUrl: e.target.value }))}
                placeholder="https://api.openai.com/v1"
                className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 text-sm"
              />
              <p className="text-xs text-slate-500">
                用于接入第三方兼容OpenAI API的服务（如国内镜像、Azure OpenAI等）
              </p>
            </div>
          </div>

          {/* Gemini配置 */}
          <div className="space-y-4 bg-slate-50 p-3 sm:p-4 rounded-lg">
            <h3 className="font-semibold text-slate-800 border-b pb-2 text-sm sm:text-base">Gemini API配置</h3>
            
            <div className="space-y-2">
              <label className="block text-sm font-medium text-slate-700">API密钥</label>
              <input
                type="password"
                value={config.geminiApiKey}
                onChange={(e) => setConfig(prev => ({ ...prev, geminiApiKey: e.target.value }))}
                placeholder="AIzaSy..."
                className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 text-sm"
              />
            </div>

            <div className="space-y-2">
              <label className="block text-sm font-medium text-slate-700">模型名称</label>
              <input
                type="text"
                value={config.geminiModel}
                onChange={(e) => setConfig(prev => ({ ...prev, geminiModel: e.target.value }))}
                placeholder="gemini-1.5-flash"
                className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 text-sm"
              />
            </div>
          </div>

          {/* 保存按钮 */}
          <div className="flex items-center justify-between pt-4 border-t">
            <button 
              onClick={handleReset}
              className="flex items-center gap-2 px-4 py-2 text-sm font-medium text-slate-600 bg-slate-100 rounded-lg hover:bg-slate-200 transition-colors"
            >
              <RefreshCw className="w-4 h-4" />
              重置默认值
            </button>
            
            <div className="flex items-center gap-2">
              <button 
                onClick={handleExportConfig}
                className="flex items-center gap-2 px-4 py-2 text-sm font-medium text-blue-700 bg-blue-50 rounded-lg hover:bg-blue-100 transition-colors border border-blue-200"
              >
                <Download className="w-4 h-4" />
                导出配置
              </button>
              
              <label className="flex items-center gap-2 px-4 py-2 text-sm font-medium text-green-700 bg-green-50 rounded-lg hover:bg-green-100 transition-colors border border-green-200 cursor-pointer">
                <Upload className="w-4 h-4" />
                <span>导入配置</span>
                <input
                  type="file"
                  accept=".json"
                  onChange={(e) => {
                    if (e.target.files && e.target.files[0]) {
                      handleImportConfigFile(e.target.files[0]);
                    }
                  }}
                  className="hidden"
                />
              </label>
              
              <div className="flex items-center gap-2 ml-auto">
                <button 
                  onClick={() => testConfig(config)}
                  disabled={isTesting}
                  className="flex items-center gap-2 px-4 py-2 text-sm font-medium text-white bg-purple-600 rounded-lg hover:bg-purple-700 transition-colors disabled:bg-purple-400 disabled:cursor-wait"
                >
                  {isTesting ? (
                    <>
                      <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                      测试中...
                    </>
                  ) : (
                    <>
                      <CheckCircle className="w-4 h-4" />
                      测试配置
                    </>
                  )}
                </button>
                
                <button 
                  onClick={handleSave}
                  disabled={isSaving}
                  className="flex items-center gap-2 px-6 py-2 text-sm font-medium text-white bg-blue-600 rounded-lg hover:bg-blue-700 transition-colors disabled:bg-blue-400 disabled:cursor-wait"
                >
                  <Save className="w-4 h-4" />
                  {isSaving ? '保存中...' : '保存配置'}
                </button>
                
                {successMessage && (
                  <span className="text-sm text-emerald-600 font-medium whitespace-nowrap">{successMessage}</span>
                )}
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
