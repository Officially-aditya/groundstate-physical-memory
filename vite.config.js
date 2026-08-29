import { defineConfig } from "vite";

export default defineConfig({
  // Relative assets work at both the GitHub Pages subpath and a Cloud Run root.
  base: "./",
});
