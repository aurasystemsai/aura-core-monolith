// aura-console/vite.config.js
import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";

// Vite config for AURA Automation Console
export default defineConfig({
  plugins: [react()],
  build: {
    // Where the built console goes. server.js serves from here.
    outDir: "dist",
    emptyOutDir: true,
  },
});
