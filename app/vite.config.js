import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';
import 'dotenv/config';

/**
 * @type {import('vite').UserConfig}
 */
// export default {
//   define: {
//     'process.env.SHOPIFY_API_KEY': JSON.stringify(process.env.SHOPIFY_API_KEY),
//   },
//   plugins: [react()],
// };

export default defineConfig({
  define: {
    'process.env.SHOPIFY_API_KEY': JSON.stringify(process.env.SHOPIFY_API_KEY),
  },
  plugins: [react()],
  server: {
    host: '0.0.0.0',
    port: 80,
    strictPort: true,
    hmr: {
      clientPort: 443,
    },
  },
  optimizeDeps: {
    include: ['react/jsx-runtime'],
  },
  build: { minify: true },
});
