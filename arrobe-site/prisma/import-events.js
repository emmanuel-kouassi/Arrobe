/**
 * Import des événements passés
 * ===================================================================
 * Reprend les trois événements de l'ancien site, récupérés dans
 * l'historique git (src/data/events.js avant la refonte).
 *
 * Aucun champ « passé » n'est écrit : la page compare `date` à la date
 * du jour. Ces trois-là étant tous antérieurs à aujourd'hui, ils
 * apparaîtront d'eux-mêmes dans la section « Evenement passés ».
 *
 * Le script est idempotent : il s'appuie sur le slug, donc on peut le
 * relancer sans créer de doublons. Relancé après une correction, il
 * met simplement l'événement à jour.
 *
 *   Utilisation : même commande que le seed, avec ce fichier.
 *   Exemple :  node --env-file-if-exists=.env prisma/import-events.js
 *          ou  tsx prisma/import-events.js
 * ===================================================================
 */

import "dotenv/config";
import { PrismaClient } from "./generated/client/client.ts";
import { PrismaPg } from "@prisma/adapter-pg";

if (!process.env.DATABASE_URL) {
  console.error("\n  DATABASE_URL est absent. Renseigne-le dans .env.\n");
  process.exit(1);
}

const adapter = new PrismaPg({ connectionString: process.env.DATABASE_URL });
const prisma = new PrismaClient({ adapter });

/**
 * Les dates portent leur décalage horaire explicite (+02:00 en heure
 * d'été, +01:00 en heure d'hiver). Sans ça, la date serait interprétée
 * selon le fuseau de la machine qui lance le script, et un événement
 * de 21h pourrait se retrouver enregistré la veille.
 *
 * ATTENTION : les champs `description` et `content` ci-dessous sont des
 * textes que j'ai rédigés faute d'information dans l'ancien site.
 * Relis-les et corrige-les — surtout le pot de départ, dont je ne sais
 * rien. Tu peux les modifier ici puis relancer le script, ou les
 * éditer ensuite dans Prisma Studio.
 */
const PAST_EVENTS = [
  {
    slug: "fete-du-village-2023",
    title: "Fête du village 2023",
    description:
      "L'association tenait un stand à la fête du village, avec démonstrations d'impression 3D en plein air.",
    content:
      "<p>L'association @Rrobe était présente à la fête du village de Saint-Germain-sur-Morin. Au programme : démonstration de notre imprimante 3D, initiation aux outils numériques et réponses aux questions des habitants.</p>",
    category: "Vie de l'association",
    date: new Date("2023-09-03T10:00:00+02:00"),
    location: "Saint-Germain-sur-Morin, France",
    organizer: "Association @Rrobe",
    image: "/images/evenements/fete-du-village-2023.jpg",
  },
  {
    slug: "pot-de-depart-jean-paul-2021",
    title: "Pot de départ de Jean-Paul",
    description:
      "Un moment convivial pour remercier Jean-Paul de son engagement au sein de l'association.",
    content:
      "<p>Les membres de l'association se sont réunis pour saluer le départ de Jean-Paul et le remercier pour les années passées à faire vivre @Rrobe.</p>",
    category: "Vie de l'association",
    date: new Date("2021-10-29T14:00:00+02:00"),
    location: "Saint-Germain-sur-Morin, France",
    organizer: "Association @Rrobe",
    image: "/images/evenements/pot-de-depart-jean-paul-2021.png",
  },
  {
    slug: "formation-python-2020",
    title: "Formation Python",
    description:
      "Une session d'initiation à la programmation Python, animée en ligne.",
    content:
      "<p>Séance d'initiation à Python : premiers pas avec le langage, variables, boucles et écriture d'un petit programme. La formation s'est tenue en ligne.</p>",
    category: "Formation",
    date: new Date("2020-01-29T21:00:00+01:00"),
    location: "En ligne",
    organizer: "Association @Rrobe",
    image: "/images/evenements/formation-python-2020.jpg",
  },
];

async function main() {
  for (const event of PAST_EVENTS) {
    const saved = await prisma.event.upsert({
      where: { slug: event.slug },
      update: event,
      create: { ...event, status: "PUBLISHED" },
    });

    const when = saved.date.toLocaleDateString("fr-FR", {
      day: "numeric",
      month: "long",
      year: "numeric",
    });
    console.log(`  ${saved.title} — ${when}`);
  }

  const total = await prisma.event.count();
  const past = await prisma.event.count({
    where: { date: { lt: new Date() }, status: "PUBLISHED" },
  });

  console.log(`\n  ${total} événement(s) en base, dont ${past} déjà passé(s).`);
  console.log("  Pense à déposer les images dans public/images/evenements/.\n");
}

main()
  .catch((error) => {
    console.error("\n  L'import a échoué :\n", error, "\n");
    process.exitCode = 1;
  })
  .finally(async () => {
    await prisma.$disconnect();
  });