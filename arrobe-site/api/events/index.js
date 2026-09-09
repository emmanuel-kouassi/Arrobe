/**
 * GET  /api/events   liste, séparée « à venir » / « passés »
 * POST /api/events   création (admin)
 * ===================================================================
 * La séparation n'est PAS stockée en base : elle se calcule ici, en
 * comparant `date` à l'instant de la requête. Un événement bascule
 * donc tout seul de « à venir » à « passé » quand sa date arrive.
 *
 * Si rien ne correspond, la clé existe quand même avec un tableau
 * vide. Le front n'a jamais à gérer un cas d'absence particulier.
 * ===================================================================
 */

import { prisma } from "../_lib/prisma.js";
import { readAdmin, requireAdmin } from "../_lib/auth.js";
import { route, readJsonBody, sendJson, sendError, getQuery } from "../_lib/http.js";
import { validateEvent, slugify } from "../_lib/validate.js";

const LIST_FIELDS = {
  id: true,
  slug: true,
  title: true,
  description: true,
  image: true,
  category: true,
  date: true,
  location: true,
  organizer: true,
  status: true,
};

async function listEvents(req, res) {
  const admin = await readAdmin(req);
  const now = new Date();

  const base = admin ? {} : { status: "PUBLISHED" };

  // L'admin a besoin du nombre d'inscrits dans ses listes ; le public
  // n'a pas à connaître ce chiffre.
  const select = admin
    ? { ...LIST_FIELDS, _count: { select: { registrations: true } } }
    : LIST_FIELDS;

  // Deux requêtes en parallèle plutôt qu'un tri en mémoire : la base
  // fait le travail via l'index (status, date).
  const [upcoming, past] = await Promise.all([
    prisma.event.findMany({
      where: { ...base, date: { gte: now } },
      select,
      orderBy: { date: "asc" }, // le plus proche en premier
    }),
    prisma.event.findMany({
      where: { ...base, date: { lt: now } },
      select,
      orderBy: { date: "desc" }, // le plus récent en premier
    }),
  ]);

  // Aucun événement publié à venir -> upcoming vaut [].
  // Pas d'erreur, pas d'objet fictif, juste un tableau vide.
  return sendJson(res, 200, { upcoming, past });
}

async function createEvent(req, res) {
  if (!(await requireAdmin(req, res))) return;

  const body = await readJsonBody(req);
  const check = validateEvent(body);

  if (!check.valid) {
    return sendError(res, 422, "Données invalides.", check.errors);
  }

  const data = check.value;
  data.slug = data.slug ?? slugify(data.title);

  const event = await prisma.event.create({ data });

  res.setHeader("Location", `/api/events/${event.slug}`);
  return sendJson(res, 201, { event });
}

export default (req, res) => route(req, res, { GET: listEvents, POST: createEvent });