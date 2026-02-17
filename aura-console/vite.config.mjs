// aura-console/vite.config.mjs
import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";
import { visualizer } from "rollup-plugin-visualizer";

export default defineConfig({
  plugins: [react(), visualizer({ filename: "stats.html", open: false })],
  optimizeDeps: {
    include: [
      '@mui/material',
      '@mui/icons-material',
      '@mui/system',
      '@emotion/react',
      '@emotion/styled',
      'recharts',
      'react',
      'react-dom',
    ],
  },
  server: {
    port: 5173,
  },
  build: {
    outDir: "dist",
    sourcemap: false,
    rollupOptions: {
      output: {},
    },
    // Higher limit; remaining large chunk is components-heavy and will need route-level lazy loading to shrink further
    chunkSizeWarningLimit: 2000,
  },
});
