import { defineConfig } from "vite";
export default defineConfig({
  resolve: {
    alias: {
      "@": "/src"
    }
  },
  build: {
    outDir: "build",
    assetsDir: ""
  }
});
