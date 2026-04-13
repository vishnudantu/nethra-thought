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
        treeshake: {
          // Never tree-shake modules that export React hooks
          // This prevents useW from being dropped
          moduleSideEffects: (id) => {
            if (id.includes('ModuleLayout') || id.includes('useResponsive') || id.includes('src/hooks')) return true;
            return false;
          },
          propertyReadSideEffects: false,
        },
        output: {
          manualChunks(id) {
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
