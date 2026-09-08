import { defineConfig, loadEnv } from "vite";
import react from "@vitejs/plugin-react";
import tailwindcss from "@tailwindcss/vite";
import { VitePWA } from "vite-plugin-pwa";

export default defineConfig(({ mode }) => {
  const env = loadEnv(mode, process.cwd(), "");

  return {
    plugins: [
      tailwindcss(),
      react(),
      VitePWA({
        registerType: "autoUpdate",
        includeAssets: ["Copilot_20260816_121953.png", "favicon.ico"],
        manifest: {
          name: "Thomas Sarko",
          short_name: "ThomasSarko",
          description: "Welcome to Thomas Sarko",
          theme_color: "#000000",
          background_color: "#ffffff",
          display: "standalone",
          orientation: "portrait",
          icons: [
            {
              src: "/Copilot_20260816_121953.png",
              sizes: "192x192",
              type: "image/png",
            },
            {
              src: "/Copilot_20260816_121953.png",
              sizes: "512x512",
              type: "image/png",
            },
          ],
        },
        workbox: {
          navigateFallback: "/index.html",
          navigateFallbackDenylist: [/^\/subscribe/, /^\/db/],
          maximumFileSizeToCacheInBytes: 2 * 1024 * 1024,
        },
      }),
    ]
    },
    base: env.VITE_BASE_PATH || "/",
    server: {
      proxy: {
        "/subscribe": "http://localhost:8080",
        "/home": "http://localhost:8080",
        "/db": {
          target: "http://localhost:8080",
          changeOrigin: true,
          secure: false,
        },
      },
    },
  };
});
