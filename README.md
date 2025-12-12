<div align="center">
<img width="1200" height="475" alt="GHBanner" src="https://github.com/user-attachments/assets/0aa67016-6eaf-458a-adb2-6e31a0763ed6" />
</div>

# Prosolo 数据提取器

这是一个基于AI的数据提取工具，可以处理各种格式的输入数据并提取关键信息。

## 功能特性

- 支持多种AI模型（Gemini, OpenAI）
- 友好的拖拽式文件上传界面
- 结构化数据展示与导出
- 样本点管理功能

## 运行本地开发环境

**前置要求:** Node.js

1. 安装依赖:
   ```bash
   npm install
   ```

2. 设置API密钥:
   复制 `.env.local.example` 文件为 `.env.local` 并填入您的API密钥:
   ```bash
   cp .env.local.example .env.local
   ```
   
   然后在 `.env.local` 文件中设置以下任一或全部变量:
   ```
   GEMINI_API_KEY=your_gemini_api_key
   OPENAI_API_KEY=your_openai_api_key
   OPENAI_BASE_URL=your_openai_base_url  # 可选，用于配置代理地址
   OPENAI_MODEL=your_preferred_model     # 可选，默认为 gpt-4o-mini
   ```

3. 启动开发服务器:
   ```bash
   npm run dev
   ```

4. 在浏览器中打开 `http://localhost:3000` 查看应用

## 自动化部署

本项目支持两种自动化部署方式：

### 1. GitHub Pages 部署

#### 准备工作
1. 在 GitHub 上创建一个新的仓库
2. 将代码推送到该仓库的 `main` 分支

#### 配置步骤
1. 在仓库的 Settings > Pages 中：
   - Source 选择 "GitHub Actions"
   
2. 如果您想使用自定义域名，在仓库的 Settings > Pages 中设置 Custom domain

#### 工作流说明
项目包含一个 GitHub Actions 工作流文件 `.github/workflows/deploy.yml`，当您推送到 `main` 分支时会自动触发：
1. 检出代码
2. 设置 Node.js 环境
3. 安装依赖
4. 构建项目
5. 部署到 GitHub Pages

部署完成后，您可以通过 `https://<your-username>.github.io/<repository-name>/` 访问您的应用。

### 2. Gitee Pages 部署

#### 准备工作
1. 在 Gitee 上创建一个新的仓库
2. 创建 GitHub 到 Gitee 的镜像同步（可选但推荐）

#### 配置步骤
1. 在 Gitee 仓库中启用 Pages 服务：
   - 进入仓库页面
   - 点击左侧菜单中的 "Gitee Pages"
   - 选择源分支（通常是 master 或 main）
   - 点击"启动"按钮

2. 配置 GitHub Actions Secrets：
   在您的 GitHub 仓库中，进入 Settings > Secrets and variables > Actions，添加以下 secrets：
   - `GITEE_USERNAME`: 您的 Gitee 用户名
   - `GITEE_PASSWORD`: 您的 Gitee 密码或个人访问令牌
   - `GITEE_REPO`: 您的 Gitee 仓库名称（格式：用户名/仓库名）

#### 工作流说明
项目包含一个 Gitee 部署工作流文件 `.github/workflows/gitee-deploy.yml`，当您推送到 `main` 分支时会自动触发：
1. 检出代码
2. 设置 Node.js 环境
3. 安装依赖
4. 构建项目
5. 使用 Gitee Pages Action 部署到 Gitee Pages

部署完成后，您可以通过 `https://<your-username>.gitee.io/<repository-name>/` 访问您的应用。

## 手动部署

如果您不想使用自动化部署，也可以手动构建和部署：

1. 构建项目:
   ```bash
   npm run build
   ```

2. 构建后的文件位于 `dist` 目录中，您可以将其部署到任何静态文件托管服务上。

## 开发指南

### 项目结构
```
├── components/           # React 组件
├── services/             # AI 服务封装
├── App.tsx              # 主应用组件
├── index.tsx            # 应用入口
├── vite.config.ts       # Vite 配置
└── package.json         # 项目依赖和脚本
```

### 添加新的 AI 服务
1. 在 `services/` 目录中创建新的服务文件
2. 实现统一的接口
3. 在 `aiService.ts` 中注册新服务

## 故障排除

### 构建失败
- 确保所有依赖已正确安装: `npm install`
- 检查 Node.js 版本是否兼容 (推荐 v16+)

### 部署问题
- 确保 GitHub Actions 权限已正确设置
- 检查仓库设置中的 Pages 配置
- 确认 API 密钥已正确配置

## 许可证

MIT