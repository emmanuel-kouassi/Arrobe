/**
 * POST /api/events/:slug/register
 * ===================================================================
 * Inscription à un événement. Route PUBLIQUE, sans authentification :
 * c'est le formulaire ouvert aux visiteurs.
 *
 * Étant publique et écrivant en base, elle est la plus exposée de
 * l'API. D'où la validation stricte et les deux refus ci-dessous.
 *
 * Une inscription réussie déclenche un e-mail de confirmation à la
 * personne inscrite (voir _lib/registration-email.js).
 * ===================================================================
 */

import { prisma } from "../../_lib/prisma.js";
import { route, readJsonBody, sendJson, sendError, getSlug } from "../../_lib/http.js";
import { validateRegistration } from "../../_lib/validate.js";
import { runInBackground } from "../../_lib/background.js";
import { sendRegistrationConfirmation } from "../../_lib/registration-email.js";

async function register(req, res) {
  // La route se termine par /register : le slug est l'avant-dernier
  // segment de l'URL.
  const slug = getSlug(req, { trailing: 1 });

  const raw = await readJsonBody(req);
  // `null` ou un tableau sont du JSON valide : on les ramène à un objet
  // vide pour tomber sur le refus 422 plutôt que sur une erreur 500.
  const body = raw && typeof raw === "object" && !Array.isArray(raw) ? raw : {};

  // Piège à robots : champ `website` masqué dans le formulaire, qu'un
  // humain ne remplit jamais. S'il arrive rempli, on simule un succès
  // sans rien enregistrer ni envoyer. Depuis que chaque inscription
  // déclenche un e-mail, un robot pourrait sinon se servir du
  // formulaire pour écrire à n'importe quelle adresse, et épuiser le
  // quota Brevo partagé avec la newsletter.
  if (typeof body.website === "string" && body.website.trim() !== "") {
    return sendJson(res, 201, {
      registration: { id: "ok", name: String(body.name ?? "").slice(0, 120), numberOfPeople: 1 },
      event: { slug, title: "" },
    });
  }

  const check = validateRegistration(body);

  if (!check.valid) {
    return sendError(res, 422, "Données invalides.", check.errors);
  }

  const event = await prisma.event.findUnique({
    where: { slug },
    select: {
      id: true,
      slug: true,
      title: true,
      date: true,
      status: true,
      location: true,
      organizer: true,
    },
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

  // E-mail de confirmation, APRÈS l'enregistrement et sans faire
  // attendre la réponse : si Brevo est lent ou en panne, l'inscription
  // est tout de même validée à l'écran (voir background.js).
  runInBackground("inscription", () => sendRegistrationConfirmation(registration, event));

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
