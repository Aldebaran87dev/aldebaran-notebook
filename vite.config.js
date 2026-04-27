import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";

export default defineConfig({
  plugins: [react()],
  // For GitHub Pages at https://aldebaran87.github.io/aldebaran-notebook/
  // uncomment before deploying:
  // base: "/aldebaran-notebook/",
  base: "/",
});
