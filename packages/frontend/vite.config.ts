import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';

export default defineConfig({
  base: '/roi/',
  plugins: [react()],
  define: {
    // Set API URL from environment, or empty string for same-origin in production
    __API_URL__: JSON.stringify(process.env.VITE_API_URL || ''),
  },
  server: {
    port: 5173,
    // Only use proxy for local development
    ...(process.env.NODE_ENV === 'development' && {
      proxy: {
        '/api': {
          target: 'http://localhost:3001',
          changeOrigin: true,
        },
      },
    }),
  },
  build: {
    outDir: 'dist',
    sourcemap: false, // Disable for smaller bundle
    minify: 'terser',
  },
});
