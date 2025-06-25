// vite.config.ts
import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';

export default defineConfig({
  base: '/',
  plugins: [react()],
  build: {
    outDir: 'dist',
    assetsDir: 'assets'
  },
  server: {
    port: 5173,
    host: 'localhost',
    hmr: {
      origin: 'http://localhost:5173'
    },
    // Proxy pour les Netlify Functions en développement
    proxy: {
      '/.netlify/functions': {
        target: 'http://localhost:8888', // Port par défaut de Netlify Dev
        changeOrigin: true,
        secure: false,
      },
      '/api': {
        target: 'http://localhost:8888/.netlify/functions',
        changeOrigin: true,
        secure: false,
        rewrite: (path) => path.replace(/^\/api/, '')
      }
    }
  },
  preview: {
    port: 5173,
    host: 'localhost'
  }
});