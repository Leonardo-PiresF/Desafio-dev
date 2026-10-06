import react from "@vitejs/plugin-react";
import { defineConfig } from "vite";

export default defineConfig({
  plugins: [react()],
  server: {
    // em dev o front chama /api e o Vite repassa pra API local
    proxy: {
      "/api": "http://localhost:3333",
    },
  },
});
