// aura-console/vite.config.mjs
import { defineConfig } from "vite";
import { resolve } from "node:path";
import { fileURLToPath } from "node:url";
import react from "@vitejs/plugin-react";
import { visualizer } from "rollup-plugin-visualizer";
import { loadEnv } from "vite";

const shopifyApiKey = (apiKey) => ({
  name: "shopify-api-key",
  // App Bridge redirects top-level loads to Shopify admin, so it is only included in production builds.
  transformIndexHtml: (html, ctx) => (ctx && ctx.server
    ? html.replace(/<!--APP_BRIDGE_START-->[\s\S]*?<!--APP_BRIDGE_END-->\s*/, "")
    : html.replace("__SHOPIFY_API_KEY__", apiKey)),
});

export default defineConfig(({ mode }) => {
  const repoRoot = fileURLToPath(new URL("../", import.meta.url));
  const env = loadEnv(mode, resolve(repoRoot), "");
  // The public client ID is embedded for App Bridge; the Shopify secret stays server-side.
  const SHOPIFY_API_KEY = env.VITE_SHOPIFY_API_KEY || process.env.VITE_SHOPIFY_API_KEY || "98db68ecd4abcd07721d14949514de8a";

  return {
    plugins: [react(), shopifyApiKey(SHOPIFY_API_KEY), visualizer({ filename: "stats.html", open: false })],
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
  };
});
