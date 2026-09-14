import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";

// Admin CMS SPA. Served at /admin in production (baked into `base`); in dev
// runs on port 5174 with API proxied to the CMS server on 8080.
export default defineConfig({
  plugins: [react()],
  base: "/admin/",
  server: {
    port: 5174,
    proxy: {
      "/api": {
        target: "http://localhost:8080",
        changeOrigin: true,
      },
    },
  },
  build: {
    outDir: "dist",
  },
});