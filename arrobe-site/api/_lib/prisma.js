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
