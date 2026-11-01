import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';
import tailwindcss from '@tailwindcss/vite';
import { fileURLToPath, URL } from 'node:url';
import { nonceStyles } from './scripts/csp-plugin';

export default defineConfig({
  plugins: [nonceStyles(), react(), tailwindcss()],
  html: { cspNonce: '__RATIONPROOF_NONCE__' },
  optimizeDeps: { exclude: ['sonner', 'vaul'] },
  resolve: { alias: { '@': fileURLToPath(new URL('./frontend', import.meta.url)) } },
  base: '/static/',
  publicDir: false,
  server: { proxy: { '/api': {
    target: 'http://127.0.0.1:8765',
    configure(proxy) { proxy.on('proxyReq', request => { request.removeHeader('origin'); }); },
  } } },
  build: {
    outDir: 'static', emptyOutDir: false, assetsDir: 'assets',
    rollupOptions: { output: { manualChunks(id) {
      if (!id.includes('node_modules')) return;
      if (/\/node_modules\/(react|react-dom|scheduler)\//.test(id)) return 'react-vendor';
      if (/\/node_modules\/(framer-motion|motion-dom|motion-utils)\//.test(id)) return 'motion-vendor';
      if (/\/node_modules\/@radix-ui\//.test(id)) return 'radix-vendor';
      if (/\/node_modules\/(cmdk|vaul)\//.test(id)) return 'command-vendor';
    } } },
  },
});
