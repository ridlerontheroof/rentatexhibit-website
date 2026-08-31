import react from "@vitejs/plugin-react";
import tailwindcss from "@tailwindcss/vite";
import { defineConfig } from "vite";

export default defineConfig({
  plugins: [react(), tailwindcss()],
  server: {
    host: "0.0.0.0",
    port: Number(process.env.PORT || 3000),
    strictPort: true,
    allowedHosts: true,
    proxy: { "/api": { target: process.env.DEV_API_ORIGIN || "http://127.0.0.1:3001", changeOrigin: true } }
  },
  build: { outDir: "dist/public", emptyOutDir: true }
});