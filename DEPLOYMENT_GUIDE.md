# 详细部署指南

本文档提供了将Prosolo数据提取器部署到GitHub Pages和Gitee Pages的详细步骤。

## 目录
1. [准备工作](#准备工作)
2. [GitHub Pages 部署](#github-pages-部署)
3. [Gitee Pages 部署](#gitee-pages-部署)
4. [故障排除](#故障排除)

## 准备工作

### 1. 系统要求
- Git (版本 2.0 或更高)
- Node.js (版本 16 或更高)
- npm (通常随Node.js一起安装)

### 2. 获取项目代码
如果您还没有项目代码，请先克隆仓库：
```bash
git clone <your-repository-url>
cd prosolo-数据提取器
```

### 3. 安装依赖
```bash
npm install
```

### 4. 配置环境变量
复制示例环境配置文件：
```bash
cp .env.local.example .env.local
```

编辑 `.env.local` 文件，添加您的API密钥：
```
GEMINI_API_KEY=your_actual_gemini_api_key_here
OPENAI_API_KEY=your_actual_openai_api_key_here
# 如果使用代理或其他端点
OPENAI_BASE_URL=https://api.openai.com/v1
# 指定模型（可选）
OPENAI_MODEL=gpt-4o-mini
```

## GitHub Pages 部署

### 步骤 1: 创建 GitHub 仓库
1. 登录您的 GitHub 账户
2. 点击右上角的 "+" 号，选择 "New repository"
3. 输入仓库名称（例如：prosolo-data-extractor）
4. 选择公开（Public）仓库
5. 不要初始化 README、.gitignore 或许可证
6. 点击 "Create repository"

### 步骤 2: 推送代码到 GitHub
如果您已经有一个本地仓库：
```bash
git remote add origin https://github.com/<your-username>/<your-repo-name>.git
git branch -M main
git push -u origin main
```

如果您从零开始：
```bash
git init
git add .
git commit -m "Initial commit"
git branch -M main
git remote add origin https://github.com/<your-username>/<your-repo-name>.git
git push -u origin main
```

### 步骤 3: 配置 GitHub Pages
1. 在 GitHub 仓库页面，点击 "Settings" 选项卡
2. 在左侧菜单中，向下滚动找到 "Pages"
3. 在 "Build and deployment" 部分：
   - Source 选择 "GitHub Actions"
4. 点击 "Save"

### 步骤 4: 触发部署工作流
GitHub Actions 工作流会自动触发，但您也可以手动触发：
1. 在仓库页面，点击 "Actions" 选项卡
2. 选择 "Deploy to GitHub Pages" 工作流
3. 点击 "Run workflow" 按钮

### 步骤 5: 查看部署结果
1. 部署完成后，回到 "Settings" > "Pages"
2. 您会看到类似这样的信息："Your site is published at https://<your-username>.github.io/<your-repo-name>/"
3. 等待几分钟让部署生效，然后访问该URL查看您的应用

### 步骤 6: （可选）配置自定义域名
1. 在 "Settings" > "Pages" 页面
2. 在 "Custom domain" 字段中输入您的域名
3. 点击 "Save"
4. 根据提示配置您的DNS记录

## Gitee Pages 部署

### 步骤 1: 创建 Gitee 仓库
1. 登录您的 Gitee 账户
2. 点击右上角的 "+" 号，选择 "新建仓库"
3. 输入仓库名称（例如：prosolo-data-extractor）
4. 选择公开（Public）仓库
5. 不要初始化 README
6. 点击 "创建"

### 步骤 2: 配置 GitHub 到 Gitee 的镜像同步（推荐）
这一步可以让您只需推送到 GitHub，代码会自动同步到 Gitee：

1. 在 Gitee 仓库页面，点击 "管理" > "仓库镜像"
2. 点击 "添加镜像"
3. 在 "镜像地址" 中输入您的 GitHub 仓库地址：
   ```
   https://github.com/<your-github-username>/<your-repo-name>.git
   ```
4. 选择同步方式为 "定时同步"
5. 点击 "确定"

或者，您也可以手动推送代码到 Gitee：

如果您已经有一个本地仓库：
```bash
git remote add gitee https://gitee.com/<your-username>/<your-repo-name>.git
git push gitee main
```

### 步骤 3: 启用 Gitee Pages
1. 在 Gitee 仓库页面，点击左侧菜单中的 "Gitee Pages"
2. 选择源分支（通常是 master 或 main）
3. 如果您希望使用自定义域名，可以在 "自定义域名" 字段中输入
4. 点击 "启动" 按钮

### 步骤 4: 配置 GitHub Actions Secrets
为了让 GitHub Actions 能够自动部署到 Gitee Pages，您需要配置一些密钥：

1. 在 GitHub 仓库页面，点击 "Settings" > "Secrets and variables" > "Actions"
2. 点击 "New repository secret" 按钮
3. 添加以下三个密钥：
   - Name: `GITEE_USERNAME`
     Value: 您的 Gitee 用户名
   - Name: `GITEE_PASSWORD`
     Value: 您的 Gitee 密码或个人访问令牌
   - Name: `GITEE_REPO`
     Value: 您的 Gitee 仓库标识符（格式：用户名/仓库名，例如：yourname/prosolo-data-extractor）

### 步骤 5: 触发 Gitee 部署工作流
Gitee 部署工作流会自动触发，但您也可以手动触发：
1. 在 GitHub 仓库页面，点击 "Actions" 选项卡
2. 选择 "Deploy to Gitee Pages" 工作流
3. 点击 "Run workflow" 按钮

### 步骤 6: 查看 Gitee Pages 部署结果
1. 部署完成后，回到 Gitee 仓库的 "Gitee Pages" 页面
2. 您会看到类似这样的信息："您的站点已发布在：https://<your-username>.gitee.io/<your-repo-name>/"
3. 等待几分钟让部署生效，然后访问该URL查看您的应用

## 故障排除

### 常见问题

#### 1. 部署工作流失败
- 检查您的密钥是否正确配置
- 确保您的仓库是公开的（对于 GitHub Pages）
- 查看工作流日志以获取详细错误信息

#### 2. 页面无法访问
- 等待几分钟让部署完全生效
- 检查仓库设置中的 Pages 配置
- 确保您访问的是正确的 URL

#### 3. API 功能不工作
- 检查您的 API 密钥是否正确配置在环境变量中
- 确保您没有超过 API 的使用限制
- 检查网络连接和防火墙设置

#### 4. 构建失败
- 确保所有依赖都已正确安装
- 检查 Node.js 版本是否兼容
- 查看构建日志以获取详细错误信息

### 获取帮助
如果您遇到其他问题：
1. 检查项目的 Issues 页面是否有类似问题
2. 创建一个新的 Issue 描述您的问题
3. 提供详细的错误信息和复现步骤