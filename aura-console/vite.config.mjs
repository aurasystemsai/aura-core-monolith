// aura-console/vite.config.mjs
import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";
import { visualizer } from "rollup-plugin-visualizer";

export default defineConfig({
  plugins: [react(), visualizer({ filename: "stats.html", open: false })],
  resolve: {
    mainFields: ['browser', 'module', 'main'],
  },
  optimizeDeps: {
    include: [
      '@mui/material',
      '@mui/system',
      '@emotion/react',
      '@emotion/styled',
      'recharts',
      'react',
      'react-dom',
    ],
    esbuildOptions: {
      mainFields: ['browser', 'module', 'main'],
    },
  },
  server: {
    port: 5173,
    proxy: {
      '/api': 'http://localhost:10000',
    },
  },
  build: {
    outDir: "dist",
    sourcemap: false,
    rollupOptions: {
      output: {},
    },
    chunkSizeWarningLimit: 2000,
  },
});
