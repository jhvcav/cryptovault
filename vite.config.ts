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
    }
  },
  preview: {
    port: 5173,
    host: 'localhost'
  }
});