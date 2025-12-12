# 使用兼容OpenAI的API

本项目已添加支持使用兼容OpenAI的API来替代Gemini API进行水质数据提取。

## 配置步骤

### 1. 设置OpenAI API密钥

打开 `.env.local` 文件，找到OpenAI相关配置部分：

```
# OpenAI API Configuration
OPENAI_API_KEY=PLACEHOLDER_OPENAI_API_KEY
OPENAI_MODEL=gpt-4o-mini
# Optional: Custom base URL for compatible OpenAI APIs
# OPENAI_BASE_URL=https://api.example.com/v1
```

将 `PLACEHOLDER_OPENAI_API_KEY` 替换为您的实际OpenAI API密钥。

### 2. 配置模型

默认使用 `gpt-4o-mini` 模型，您可以根据需要更改为其他兼容的多模态模型，如：
- `gpt-4o` (推荐)
- `gpt-4-vision-preview`

### 3. 自定义API端点（可选）

如果您使用的是兼容OpenAI的第三方API服务（如Azure OpenAI、Ollama等），可以取消注释 `OPENAI_BASE_URL` 并设置为相应的端点：

```
OPENAI_BASE_URL=https://api.example.com/v1
```

## 支持的服务

### 官方OpenAI API

- 需要 `gpt-4o` 或 `gpt-4-vision-preview` 模型
- API密钥可在 [OpenAI平台](https://platform.openai.com/) 获取

### 兼容OpenAI的第三方API

以下服务应兼容本实现：

- **Azure OpenAI**
  ```
  OPENAI_BASE_URL=https://YOUR_RESOURCE_NAME.openai.azure.com/openai/deployments/YOUR_DEPLOYMENT_NAME/chat/completions?api-version=2024-02-15-preview
  ```

- **Ollama** (本地部署)
  ```
  OPENAI_BASE_URL=http://localhost:11434/v1
  OPENAI_MODEL=llava:latest
  ```

- **Anthropic Claude** (通过兼容层)
- **Google Gemini** (通过兼容层)

## 使用流程

配置完成后，使用方式与之前相同：

1. 上传YSI ProSolo屏幕图像
2. 点击"开始提取"按钮
3. 系统会自动使用配置的OpenAI API进行数据提取
4. 查看和导出提取结果

## 注意事项

1. 确保使用的模型支持图像分析功能
2. 自定义API端点需要确保与OpenAI API格式兼容
3. 建议使用最新的多模态模型以获得最佳的图像识别效果
4. 如果同时配置了Gemini和OpenAI，系统会优先使用OpenAI
