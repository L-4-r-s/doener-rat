import { defineConfig } from "astro/config";
import tailwindcss from "@tailwindcss/vite";

export default defineConfig({
  site: "https://www.doener-rat.de",
  base: process.env.ASTRO_BASE_PATH || "/",
  output: "static",
  compressHTML: false,
  build: { format: "file" },
  vite: { plugins: [tailwindcss()] },
});
