import { defineConfig } from "vite";

export default defineConfig(({ command }) => ({
  // Build defaults to relative asset URLs so the dist can be hosted from any folder/subdomain.
  base: command === "build" ? process.env.VITE_BASE ?? "./" : "/",
}));
