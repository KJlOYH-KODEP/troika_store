import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';

// https://vitejs.dev/config/
export default defineConfig({
  plugins: [react()],
  base: './', // Убедитесь, что base не переопределен
  server: {
    host: '0.0.0.0', // Разрешить доступ не только с localhost
    port: 5173,
    strictPort: true,
    fs: {
      strict: true, // Запретить доступ к файлам вне корня проекта
      allow: ['.'], // Разрешить только текущую директорию (не node_modules)
    },
  },
  optimizeDeps: {
    exclude: ['lucide-react'],
  },
});
