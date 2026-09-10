/**
 * GET /api/events/:slug/registrations
 * ===================================================================
 * Liste des inscrits à un événement. ADMIN UNIQUEMENT.
 *
 * Ce sont des données personnelles : noms, adresses e-mail, numéros de
 * téléphone. Aucune version publique de cette route ne doit exister,
 * même partielle.
 * ===================================================================
 */

import { prisma } from "../../_lib/prisma.js";
import { requireAdmin } from "../../_lib/auth.js";
import { route, sendJson, sendError, getSlug } from "../../_lib/http.js";

async function listRegistrations(req, res) {
  if (!(await requireAdmin(req, res))) return;

  const slug = getSlug(req, { trailing: 1 });

  const event = await prisma.event.findUnique({
    where: { slug },
    select: { id: true, title: true, date: true },
  });

  if (!event) return sendError(res, 404, "Événement introuvable.");

  const registrations = await prisma.registration.findMany({
    where: { eventId: event.id },
    orderBy: { createdAt: "asc" },
  });

  // Total de personnes attendues : une inscription peut en couvrir
  // plusieurs (numberOfPeople), c'est ce chiffre qui sert à prévoir
  // les places, pas le nombre de lignes.
  const totalPeople = registrations.reduce((sum, r) => sum + r.numberOfPeople, 0);

  return sendJson(res, 200, {
    event: { slug, title: event.title, date: event.date },
    registrations,
    count: registrations.length,
    totalPeople,
  });
}

export default (req, res) => route(req, res, { GET: listRegistrations });
