import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';
import tailwindcss from '@tailwindcss/vite';
import path from 'path';

export default defineConfig({
  plugins: [react(), tailwindcss()],
  resolve: {
    alias: { '@': path.resolve(__dirname, './src') },
  },
  server: {
    port: 5173,
    // Lets the app call the API as a same-origin /api path in dev, so no
    // CORS round-trip and the same relative URLs work in production.
    proxy: {
      '/api': { target: 'http://localhost:4000', changeOrigin: true },
      '/static': { target: 'http://localhost:4000', changeOrigin: true },
    },
  },
});
