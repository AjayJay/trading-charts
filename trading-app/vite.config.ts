import { defineConfig } from 'vite';
import { resolve } from 'path';

export default defineConfig({
  build: {
    rollupOptions: {
      input: {
        main: resolve(__dirname, 'index.html'),
        multiTimeframe: resolve(__dirname, 'src/features/multi-timeframe/index.html'),
      },
    },
  },
  server: {
    port: 3000,
    open: true,
  },
});

