/**
 * GET    /api/events/:slug   détail
 * PUT    /api/events/:slug   modification (admin)
 * DELETE /api/events/:slug   suppression (admin)
 * ===================================================================
 */

import { prisma } from "../_lib/prisma.js";
import { readAdmin, requireAdmin } from "../_lib/auth.js";
import {
  route,
  readJsonBody,
  sendJson,
  sendError,
  getSlug,
  getQuery,
} from "../_lib/http.js";
import { validateEvent } from "../_lib/validate.js";

async function getEvent(req, res) {
  const slug = getSlug(req);
  const admin = await readAdmin(req);

  const event = await prisma.event.findUnique({
    where: { slug },
    // Le compte d'inscrits n'intéresse que l'admin.
    include: admin ? { _count: { select: { registrations: true } } } : undefined,
  });

  if (!event || (!admin && event.status !== "PUBLISHED")) {
    return sendError(res, 404, "Événement introuvable.");
  }

  // Champ pratique pour le front : évite de recalculer la comparaison
  // de dates à plusieurs endroits.
  return sendJson(res, 200, { event: { ...event, isPast: event.date < new Date() } });
}

async function updateEvent(req, res) {
  if (!(await requireAdmin(req, res))) return;

  const slug = getSlug(req);
  const body = await readJsonBody(req);
  const check = validateEvent(body, { partial: true });

  if (!check.valid) {
    return sendError(res, 422, "Données invalides.", check.errors);
  }

  const existing = await prisma.event.findUnique({ where: { slug } });
  if (!existing) return sendError(res, 404, "Événement introuvable.");

  const event = await prisma.event.update({ where: { slug }, data: check.value });
  return sendJson(res, 200, { event });
}

async function deleteEvent(req, res) {
  if (!(await requireAdmin(req, res))) return;

  const slug = getSlug(req);
  const existing = await prisma.event.findUnique({
    where: { slug },
    include: { _count: { select: { registrations: true } } },
  });

  if (!existing) return sendError(res, 404, "Événement introuvable.");

  // Garde-fou : supprimer un événement efface ses inscriptions en
  // cascade. On refuse tant que ?force=1 n'est pas passé, pour qu'une
  // liste d'inscrits ne disparaisse pas sur un clic malheureux.
  const count = existing._count.registrations;
  const forced = getQuery(req, "force") === "1";

  if (count > 0 && !forced) {
    return sendError(
      res,
      409,
      `Cet événement compte ${count} inscription(s). ` +
        "Relance avec ?force=1 pour le supprimer ainsi que ses inscriptions."
    );
  }

  await prisma.event.delete({ where: { slug } });
  return sendJson(res, 200, { deleted: slug, registrationsDeleted: count });
}

export default (req, res) =>
  route(req, res, { GET: getEvent, PUT: updateEvent, DELETE: deleteEvent });
