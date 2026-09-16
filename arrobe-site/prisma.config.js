/**
 * Configuration du CLI Prisma (migrate, studio, db seed).
 * ===================================================================
 * Depuis Prisma 7, l'URL de connexion ne vit plus dans schema.prisma
 * mais ici. Le fichier doit rester à la racine de arrobe-site/.
 * ===================================================================
 */
import "dotenv/config";
import { defineConfig } from "prisma/config";

export default defineConfig({
  schema: "prisma/schema.prisma",

  migrations: {
    path: "prisma/migrations",
    seed: "node --env-file-if-exists=.env prisma/seed.js",
  },

  datasource: {
    // Les migrations ont besoin d'une connexion DIRECTE : un pooler
    // comme PgBouncer tourne en mode transaction et ne supporte pas
    // les verrous de session dont Prisma Migrate a besoin.
    // Si ton hébergeur ne fournit qu'une seule URL, DATABASE_URL sert
    // de repli. On lit process.env sans le helper env() : celui-ci
    // lève une erreur même pour les commandes qui n'ont pas besoin
    // de base, comme `prisma generate`.
    url: process.env.DIRECT_URL ?? process.env.DATABASE_URL ?? "",
  },
});