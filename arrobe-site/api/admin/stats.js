/**
 * GET /api/admin/stats
 * ===================================================================
 * Alimente la vue d'ensemble du tableau de bord. ADMIN UNIQUEMENT :
 * les compteurs de brouillons et les noms d'inscrits sont des données
 * internes.
 *
 * Une seule route plutôt que six appels depuis le navigateur : le
 * tableau de bord s'affiche d'un coup, sans cascade de requêtes.
 * ===================================================================
 */

import { prisma } from "../_lib/prisma.js";
import { requireAdmin } from "../_lib/auth.js";
import { route, sendJson } from "../_lib/http.js";

async function stats(req, res) {
  const admin = await requireAdmin(req, res);
  if (!admin) return;

  const now = new Date();

  // « Ce mois » = depuis le 1er du mois en cours, pas les 30 derniers
  // jours : c'est ce qu'attend quelqu'un qui lit « inscrits ce mois ».
  const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1);

  const [
    published,
    drafts,
    upcomingCount,
    registrationsThisMonth,
    recentArticles,
    upcomingEvents,
    recentRegistrations,
  ] = await Promise.all([
    prisma.article.count({ where: { status: "PUBLISHED" } }),
    prisma.article.count({ where: { status: "DRAFT" } }),
    prisma.event.count({ where: { status: "PUBLISHED", date: { gte: now } } }),
    prisma.registration.count({ where: { createdAt: { gte: startOfMonth } } }),

    prisma.article.findMany({
      select: { slug: true, title: true, status: true, publishedAt: true, updatedAt: true },
      orderBy: { updatedAt: "desc" },
      take: 5,
    }),

    prisma.event.findMany({
      where: { date: { gte: now } },
      select: {
        slug: true,
        title: true,
        date: true,
        status: true,
        _count: { select: { registrations: true } },
      },
      orderBy: { date: "asc" },
      take: 5,
    }),

    prisma.registration.findMany({
      select: {
        id: true,
        name: true,
        createdAt: true,
        event: { select: { slug: true, title: true } },
      },
      orderBy: { createdAt: "desc" },
      take: 5,
    }),
  ]);

  return sendJson(res, 200, {
    identifiant: admin.identifiant,
    counts: {
      published,
      drafts,
      upcoming: upcomingCount,
      registrationsThisMonth,
    },
    // Toutes ces listes peuvent être vides : c'est l'état normal d'une
    // base neuve, le front affiche un message et non une erreur.
    recentArticles,
    upcomingEvents,
    recentRegistrations,
  });
}

export default (req, res) => route(req, res, { GET: stats });
