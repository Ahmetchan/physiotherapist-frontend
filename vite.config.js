import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

// https://vite.dev/config/
export default defineConfig(({ mode }) => {
  const config = {
    plugins: [react()],
    build: {
      outDir: 'dist',
      minify: 'esbuild',
      sourcemap: false,
    }
  };

  // Development ortamında proxy kullan
  if (mode === 'development') {
    config.server = {
      proxy: {
        '/api': {
          target: 'https://physiotherapist-backend.onrender.com',
          changeOrigin: true,
          secure: true,
          rewrite: (path) => path.replace(/^\/api/, '')
        }
      }
    };
  }

  return config;
})
