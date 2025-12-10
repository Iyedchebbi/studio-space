
import { defineConfig, loadEnv } from 'vite';
import react from '@vitejs/plugin-react';

export default defineConfig(({ mode }) => {
  const env = loadEnv(mode, process.cwd(), '');
  return {
    plugins: [react()],
    define: {
      // Ensure we don't pass undefined to JSON.stringify
      'process.env.API_KEY': JSON.stringify(env.API_KEY || '')
    }
  };
});
