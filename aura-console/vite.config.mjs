// aura-console/vite.config.mjs
import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";
import { visualizer } from "rollup-plugin-visualizer";

// Coarse feature chunking to keep the main bundle smaller without changing app code
const featureChunks = [
  { match: "/src/dashboard/", name: "feature-dashboard" },
  { match: "/src/orchestration/", name: "feature-orchestration" },
  { match: "/src/automation/", name: "feature-automation" },
  { match: "/src/onboarding/", name: "feature-onboarding" },
  { match: "/src/credits/", name: "feature-credits" },
  { match: "/src/routes/", name: "feature-routes" },
  { match: "/src/components/", name: "feature-components" },
];

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

          if (id.includes('/src/')) {
            const hit = featureChunks.find(({ match }) => id.includes(match));
            if (hit) return hit.name;
          }
        },
      },
    },
    // Higher limit; remaining large chunk is components-heavy and will need route-level lazy loading to shrink further
    chunkSizeWarningLimit: 2000,
  },
});
