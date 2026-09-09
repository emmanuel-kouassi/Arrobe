/**
 * Client Prisma partagé
 * ===================================================================
 * SEUL fichier de l'API qui connaît l'emplacement du client généré.
 * Si tu changes de générateur (`prisma-client` → `prisma-client-js`),
 * c'est la seule ligne d'import à modifier :
 *
 *   prisma-client     ->  import { PrismaClient } from "../../prisma/generated/client/client.ts"
 *   prisma-client-js  ->  import { PrismaClient } from "@prisma/client"
 *
 * On instancie une seule fois par processus. En serverless, un même
 * conteneur sert plusieurs requêtes : recréer un client à chaque appel
 * ouvrirait une nouvelle connexion PostgreSQL à chaque fois et
 * saturerait la base. Le `globalThis` protège aussi du rechargement à
 * chaud en développement, qui réexécute les modules.
 * ===================================================================
 */

import { PrismaClient } from "../../prisma/generated/client/client.ts";
import { PrismaPg } from "@prisma/adapter-pg";

if (!process.env.DATABASE_URL) {
  throw new Error(
    "DATABASE_URL est absent. Renseigne-le dans .env en local, " +
      "ou dans les variables d'environnement de ton hébergeur."
  );
}

function createClient() {
  // DATABASE_URL est la version poolée : c'est celle qu'il faut pour
  // l'application. DIRECT_URL est réservée aux migrations.
  const adapter = new PrismaPg({
    connectionString: process.env.DATABASE_URL,
  });
  return new PrismaClient({ adapter });
}

const globalForPrisma = globalThis;

export const prisma = globalForPrisma.__arrobePrisma ?? createClient();

if (process.env.NODE_ENV !== "production") {
  globalForPrisma.__arrobePrisma = prisma;
}
