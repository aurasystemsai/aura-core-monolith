// aura-console/vite.config.mjs
import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";
import { visualizer } from "rollup-plugin-visualizer";

export default defineConfig({
  plugins: [react(), visualizer({ filename: "stats.html", open: false })],
  server: {
    port: 5173,
  },
  build: {
    outDir: "dist",
    sourcemap: false,
    rollupOptions: {
      output: {
        manualChunks(id) {
          if (id.includes('node_modules')) {
            if (id.includes('react')) return 'vendor-react';
            if (id.includes('jspdf')) return 'vendor-jspdf';
            if (id.includes('antd')) return 'vendor-antd';
            if (id.includes('xlsx')) return 'vendor-xlsx';
            if (id.includes('chart.js')) return 'vendor-chartjs';
            if (id.includes('html2canvas')) return 'vendor-html2canvas';
            return 'vendor';
          }
        },
      },
    },
    chunkSizeWarningLimit: 600,
  },
});
