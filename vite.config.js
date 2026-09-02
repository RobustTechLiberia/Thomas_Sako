import { defineConfig, loadEnv } from "vite";
import react from "@vitejs/plugin-react";
import tailwindcss from "@tailwindcss/vite";

export default defineConfig(({ mode }) => {
  const env = loadEnv(mode, process.cwd(), "");

  return {
    plugins: [tailwindcss(), react()],
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
