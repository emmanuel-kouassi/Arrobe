/**
 * Seed — Association @Rrobe
 * ===================================================================
 * Crée UN SEUL compte administrateur, à partir de ADMIN_USERNAME et
 * ADMIN_PASSWORD lus dans l'environnement. Aucun identifiant ni mot de
 * passe n'est écrit en dur ici : ce fichier part sur GitHub, pas eux.
 *
 * Aucun article ni événement de démonstration n'est inséré. La base
 * démarre vide, et le site affiche ses états « rien pour le moment ».
 *
 * Le script est idempotent : on peut le relancer sans risque. S'il
 * trouve déjà le compte, il met le mot de passe à jour plutôt que de
 * planter sur la contrainte d'unicité — c'est aussi la façon la plus
 * simple de réinitialiser un mot de passe oublié.
 *
 *   Utilisation :  npm run db:seed
 * ===================================================================
 */

import { PrismaClient } from "./generated/client/client.js";
import bcrypt from "bcryptjs";

const prisma = new PrismaClient();

// Coût bcrypt. 12 ≈ 250 ms par vérification sur un CPU récent : assez
// lent pour décourager une attaque par force brute, assez rapide pour
// ne pas dépasser le délai d'une fonction serverless.
const BCRYPT_ROUNDS = 12;

function readConfig() {
  const identifiant = process.env.ADMIN_USERNAME?.trim();
  const password = process.env.ADMIN_PASSWORD;

  const problems = [];

  if (!identifiant) {
    problems.push("ADMIN_USERNAME est absent ou vide.");
  } else if (identifiant.length < 3) {
    problems.push("ADMIN_USERNAME doit faire au moins 3 caractères.");
  }

  if (!password) {
    problems.push("ADMIN_PASSWORD est absent ou vide.");
  } else if (password.length < 12) {
    // Ce compte ouvre l'accès à tout le back-office et sera exposé sur
    // une URL publique. 12 caractères est un plancher, pas un objectif.
    problems.push(
      `ADMIN_PASSWORD doit faire au moins 12 caractères (actuellement ${password.length}).`
    );
  }

  if (problems.length > 0) {
    console.error("\n  Le seed ne peut pas s'exécuter :\n");
    for (const problem of problems) console.error(`   - ${problem}`);
    console.error(
      "\n  Renseigne ces variables dans arrobe-site/.env " +
        "(voir .env.example), puis relance `npm run db:seed`.\n"
    );
    process.exit(1);
  }

  return { identifiant, password };
}

async function main() {
  const { identifiant, password } = readConfig();

  const existing = await prisma.admin.count();
  if (existing > 1) {
    // Garde-fou : le site n'est prévu que pour un seul administrateur.
    // Plusieurs comptes signifient que quelque chose a mal tourné, et
    // on ne veut pas en rajouter un à l'aveugle.
    console.error(
      `\n  ${existing} comptes administrateur trouvés alors qu'un seul est attendu.` +
        "\n  Vérifie la table `admins` avant de relancer le seed.\n"
    );
    process.exit(1);
  }

  const alreadyThere = await prisma.admin.findUnique({
    where: { identifiant },
    select: { id: true },
  });

  const passwordHash = await bcrypt.hash(password, BCRYPT_ROUNDS);

  const admin = await prisma.admin.upsert({
    where: { identifiant },
    update: { passwordHash },
    create: { identifiant, passwordHash },
  });

  const [articles, events] = await Promise.all([
    prisma.article.count(),
    prisma.event.count(),
  ]);

  console.log(
    `\n  Compte administrateur « ${admin.identifiant} » ` +
      `${alreadyThere ? "mis à jour (mot de passe réinitialisé)" : "créé"}.`
  );
  console.log(`  Articles en base : ${articles}`);
  console.log(`  Événements en base : ${events}`);
  console.log("  Aucune donnée de démonstration insérée.\n");
}

main()
  .catch((error) => {
    console.error("\n  Le seed a échoué :\n", error, "\n");
    process.exitCode = 1;
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
