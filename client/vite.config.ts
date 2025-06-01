import { defineConfig } from "vite";
export default defineConfig({
  resolve: {
    alias: {
      "@": "/src"
    }
  },
  base: "./",
  build: {
    outDir: "build",
    assetsDir: ""
  }
});
