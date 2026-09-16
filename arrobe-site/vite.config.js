import react from "@vitejs/plugin-react";
import { defineConfig } from "vite";

/**
 * Vite ne sait pas exécuter les fonctions du dossier api/ : il ne sert
 * que des fichiers. On renvoie donc tous les appels /api vers le
 * serveur Node lancé par `npm run dev:api` (port 3001).
 *
 * Le navigateur ne voit qu'une seule origine, donc aucun CORS à gérer.
 * En production, l'hébergeur fait le même travail : Vercel monte api/
 * tout seul, o2switch place le process Node derrière /api.
 */
export default defineConfig({
  plugins: [react()],
  server: {
    proxy: {
      "/api": {
        target: `http://localhost:${process.env.API_PORT ?? 3001}`,
        changeOrigin: true,
      },
    },
  },
});
