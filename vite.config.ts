import { defineConfig, loadEnv } from 'vite';
import react from '@vitejs/plugin-react';

export default defineConfig(({ mode }) => {
  const env = loadEnv(mode, process.cwd(), '');
  const apiUrl = env.VITE_API_URL || '';

  return {
    plugins: [react()],
    optimizeDeps: { exclude: ['lucide-react'] },
    server: {
      port: 5173,
      proxy: apiUrl ? undefined : {
        '/api': { target: 'http://localhost:3001', changeOrigin: true },
      },
    },
    build: {
      outDir: 'dist',
      emptyOutDir: true,
      rollupOptions: {
        // Prevent tree-shaking of hook files
        treeshake: {
          moduleSideEffects: true,
        },
        output: {
          // Keep hooks in a separate chunk so they're never dropped
          manualChunks(id) {
            if (id.includes('src/hooks/')) return 'hooks';
            if (id.includes('framer-motion')) return 'framer';
            if (id.includes('recharts')) return 'recharts';
            if (id.includes('lucide-react')) return 'lucide';
          },
        },
      },
    },
    define: {
      'import.meta.env.VITE_API_URL': JSON.stringify(apiUrl),
    },
  };
});
