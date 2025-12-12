import path from 'path';
import { defineConfig, loadEnv } from 'vite';
import react from '@vitejs/plugin-react';

// 获取仓库名称，如果是在GitHub Pages上部署的话
const getBase = () => {
  const repoName = process.env.GITHUB_REPOSITORY?.split('/')[1];
  return repoName ? `/${repoName}/` : '/';
};

export default defineConfig(({ mode }) => {
    const env = loadEnv(mode, '.', '');
    return {
      base: getBase(),
      server: {
        port: 3000,
        host: '0.0.0.0',
        strictPort: false,
      },
      plugins: [react()],
      define: {
        'process.env.API_KEY': JSON.stringify(env.GEMINI_API_KEY),
        'process.env.GEMINI_API_KEY': JSON.stringify(env.GEMINI_API_KEY),
        'process.env.OPENAI_API_KEY': JSON.stringify(env.OPENAI_API_KEY),
        'process.env.OPENAI_MODEL': JSON.stringify(env.OPENAI_MODEL),
        'process.env.OPENAI_BASE_URL': JSON.stringify(env.OPENAI_BASE_URL)
      },
      resolve: {
        alias: {
          '@': path.resolve(__dirname, '.'),
        }
      }
    };
});
