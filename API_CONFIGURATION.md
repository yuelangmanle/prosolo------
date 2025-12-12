# API 配置指南

本指南将详细说明如何在 ProSolo 数据提取器中修改和配置 API 密钥。

## 支持的 API 服务

当前系统支持两种 AI API 服务：

1. **Gemini API** (默认服务)
2. **OpenAI API** (或兼容 OpenAI API 的第三方服务)

## API 配置文件

所有 API 配置都保存在 `.env.local` 文件中，位于项目根目录。

## 1. 修改 Gemini API 密钥

要使用 Google Gemini API，请按照以下步骤操作：

1. 打开 `.env.local` 文件
2. 找到 `# Gemini API Configuration` 部分
3. 取消注释 `GEMINI_API_KEY` 行（删除前面的 `#`）
4. 将 `your_actual_gemini_api_key_here` 替换为您的实际 Gemini API 密钥

```
# Gemini API Configuration
GEMINI_API_KEY=your_actual_gemini_api_key_here
```

## 2. 修改 OpenAI API 密钥

要使用 OpenAI API 或兼容 OpenAI 的第三方服务，请按照以下步骤操作：

1. 打开 `.env.local` 文件
2. 找到 `# OpenAI API Configuration` 部分
3. 取消注释 `OPENAI_API_KEY` 行（删除前面的 `#`）
4. 将 `your_actual_openai_api_key_here` 替换为您的实际 OpenAI API 密钥

```
# OpenAI API Configuration
OPENAI_API_KEY=your_actual_openai_api_key_here
```

## 3. 配置 API 模型参数

### OpenAI 模型配置

在 `.env.local` 文件中，您可以配置要使用的 OpenAI 模型：

```
# 配置使用的OpenAI模型（默认推荐使用gpt-4o-mini，也可以使用gpt-4o）
OPENAI_MODEL=gpt-4o-mini
```

推荐使用：
- `gpt-4o-mini`（默认，性价比高）
- `gpt-4o`（更强大的模型，效果更好）

### Gemini 模型配置

Gemini 模型配置目前硬编码在 `geminiService.ts` 文件中，如果需要修改，可以编辑该文件。

## 4. 配置自定义 API 端点（适用于 OpenAI 兼容服务）

如果您使用的是兼容 OpenAI API 的第三方服务（如 Azure OpenAI、Ollama 等），可以配置自定义的 API 端点：

1. 打开 `.env.local` 文件
2. 找到 `# Optional: Custom base URL for compatible OpenAI APIs` 部分
3. 取消注释 `OPENAI_BASE_URL` 行（删除前面的 `#`）
4. 将 `https://api.example.com/v1` 替换为您的实际 API 端点 URL

```
# 可选：如果使用兼容OpenAI的第三方服务（如Azure OpenAI、Ollama等），请取消注释并设置
OPENAI_BASE_URL=https://api.example.com/v1
```

### 示例配置

#### Azure OpenAI 示例：
```
OPENAI_BASE_URL=https://your-resource-name.openai.azure.com/openai/deployments/your-deployment-name/chat/completions?api-version=2024-02-15-preview
```

#### Ollama 本地服务示例：
```
OPENAI_BASE_URL=http://localhost:11434/v1
```

## 5. 系统 API 选择逻辑

系统会自动根据配置选择使用哪个 API 服务：

1. **优先使用 OpenAI API**：如果配置了有效的 OpenAI API 密钥（不是占位符），系统会优先使用 OpenAI API
2. **回退到 Gemini API**：如果没有配置 OpenAI API 密钥或密钥无效，系统会使用 Gemini API
3. **错误处理**：如果所有 API 都配置错误或调用失败，系统会返回空数据

API 选择逻辑位于 `services/aiService.ts` 文件中：

```typescript
// 根据环境变量选择使用哪个AI服务
const USE_OPENAI = process.env.OPENAI_API_KEY && process.env.OPENAI_API_KEY !== 'PLACEHOLDER_OPENAI_API_KEY';
```

## 6. 生效配置

修改完 `.env.local` 文件后，需要重启开发服务器才能使配置生效：

```bash
# 停止当前运行的服务器（如果正在运行）
# 然后重新启动
npm run dev
```

## 7. 获取 API 密钥

### 获取 Gemini API 密钥

1. 访问 [Google AI Studio](https://makersuite.google.com/)
2. 登录您的 Google 账号
3. 创建或选择一个项目
4. 在 API 密钥部分创建新的 API 密钥

### 获取 OpenAI API 密钥

1. 访问 [OpenAI API 平台](https://platform.openai.com/)
2. 登录您的 OpenAI 账号
3. 进入 "API Keys" 页面
4. 创建新的 API 密钥

## 注意事项

1. **安全性**：请不要将 API 密钥提交到版本控制系统（如 Git）中。项目已经配置了 `.gitignore` 文件来忽略 `.env.local` 文件。

2. **API 限制**：不同的 API 服务有不同的使用限制和费用，请确保您了解并遵守相关政策。

3. **模型兼容性**：确保使用的模型支持图像分析功能（多模态模型）。

4. **错误排查**：如果 API 调用失败，请检查：
   - API 密钥是否正确
   - 网络连接是否正常
   - 模型是否支持您的请求类型
   - 浏览器控制台中的错误信息

## 常见问题

### Q: 我可以同时配置两种 API 吗？
A: 可以，但系统会优先使用 OpenAI API（如果配置了有效的密钥）。

### Q: 如何知道系统正在使用哪个 API？
A: 您可以通过浏览器控制台查看相关日志信息。

### Q: 如果 API 调用失败怎么办？
A: 系统会返回空数据，并在控制台显示错误信息。请检查您的 API 密钥和网络连接。

### Q: 我可以使用其他 AI API 服务吗？
A: 当前系统只支持 Gemini 和 OpenAI 兼容的 API。如果需要支持其他服务，需要修改代码实现。
