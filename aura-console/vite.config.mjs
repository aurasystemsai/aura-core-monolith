// aura-console/vite.config.mjs
import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";
import { visualizer } from "rollup-plugin-visualizer";

// Public Shopify app client ID (not a secret); App Bridge needs it in the page to issue session tokens.
const SHOPIFY_API_KEY = process.env.VITE_SHOPIFY_API_KEY || "98db68ecd4abcd07721d14949514de8a";
const shopifyApiKey = () => ({
  name: "shopify-api-key",
  // App Bridge redirects top-level loads to Shopify admin, so it is only included in production builds.
  transformIndexHtml: (html, ctx) => (ctx && ctx.server
    ? html.replace(/<!--APP_BRIDGE_START-->[\s\S]*?<!--APP_BRIDGE_END-->\s*/, "")
    : html.replace("__SHOPIFY_API_KEY__", SHOPIFY_API_KEY)),
});

export default defineConfig({
  plugins: [react(), shopifyApiKey(), visualizer({ filename: "stats.html", open: false })],
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
