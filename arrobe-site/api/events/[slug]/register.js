/**
 * POST /api/events/:slug/register
 * ===================================================================
 * Inscription à un événement. Route PUBLIQUE, sans authentification :
 * c'est le formulaire ouvert aux visiteurs.
 *
 * Étant publique et écrivant en base, elle est la plus exposée de
 * l'API. D'où la validation stricte et les deux refus ci-dessous.
 * ===================================================================
 */

import { prisma } from "../../_lib/prisma.js";
import { route, readJsonBody, sendJson, sendError, getSlug } from "../../_lib/http.js";
import { validateRegistration } from "../../_lib/validate.js";

async function register(req, res) {
  // La route se termine par /register : le slug est l'avant-dernier
  // segment de l'URL.
  const slug = getSlug(req, { trailing: 1 });

  const body = await readJsonBody(req);
  const check = validateRegistration(body);

  if (!check.valid) {
    return sendError(res, 422, "Données invalides.", check.errors);
  }

  const event = await prisma.event.findUnique({
    where: { slug },
    select: { id: true, title: true, date: true, status: true },
  });

  // Un brouillon n'existe pas pour le public.
  if (!event || event.status !== "PUBLISHED") {
    return sendError(res, 404, "Événement introuvable.");
  }

  if (event.date < new Date()) {
    return sendError(res, 409, "Cet événement est déjà passé, les inscriptions sont closes.");
  }

  const registration = await prisma.registration.create({
    data: { ...check.value, eventId: event.id },
  });

  // On ne renvoie pas la liste des inscrits ni leur nombre : ce sont
  // des données personnelles, réservées à l'administrateur.
  return sendJson(res, 201, {
    registration: {
      id: registration.id,
      name: registration.name,
      numberOfPeople: registration.numberOfPeople,
    },
    event: { slug, title: event.title },
  });
}

export default (req, res) => route(req, res, { POST: register });
