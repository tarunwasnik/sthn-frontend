// frontend/vite.config.ts
import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";
import path from "path";

export default defineConfig(({ mode }) => ({
  plugins: [react()],
  resolve: {
    alias: {
      "@": path.resolve(__dirname, "src"),
      "./faceVerificationInference.provider": mode === "e2e"
        ? path.resolve(__dirname, "e2e/fixtures/faceVerificationInference.provider.ts")
        : path.resolve(__dirname, "src/components/faceVerification/faceVerificationInference.provider.ts"),
    },
  },
  server: {
    host: true,
    allowedHosts: true,
    ...(mode === "e2e" ? { hmr: false } : {}),
  },
  build: { outDir: mode === "e2e" ? "dist-e2e" : "dist" },
}));
