/**
 * POST /api/newsletter/subscribe
 * ===================================================================
 * Inscription à la newsletter. Route PUBLIQUE, sans authentification.
 *
 *   Corps attendu : { "email": "jean@exemple.fr" }
 *
 *   201  { status: "subscribed",         email, message }
 *   200  { status: "already-subscribed", email, message }
 *   422  { error, details }                adresse invalide
 *
 * « Déjà inscrit » n'est PAS une erreur : la personne a obtenu ce
 * qu'elle voulait. On répond donc 200 avec un statut explicite, et le
 * formulaire affiche un message au lieu d'un échec.
 * ===================================================================
 */

import { randomUUID } from "node:crypto";

import { prisma } from "../_lib/prisma.js";
import { route, readJsonBody, sendJson, sendError } from "../_lib/http.js";
import { validateSubscriber } from "../_lib/validate.js";

function alreadySubscribed(res, email) {
  return sendJson(res, 200, {
    status: "already-subscribed",
    email,
    message: "Cette adresse est déjà inscrite à la newsletter.",
  });
}

async function subscribe(req, res) {
  const raw = await readJsonBody(req);
  // `null` ou un tableau sont du JSON valide : on les ramène à un objet
  // vide pour tomber sur le refus 422 plutôt que sur une erreur 500.
  const body = raw && typeof raw === "object" && !Array.isArray(raw) ? raw : {};

  // Piège à robots : le formulaire contient un champ `website` masqué,
  // qu'un humain ne voit ni ne remplit. S'il arrive rempli, on répond
  // comme si tout s'était bien passé, sans rien écrire — un robot qui
  // reçoit une erreur apprend à contourner le piège.
  //
  // Enjeu réel : chaque adresse inscrite recevra un e-mail à chaque
  // publication. Des centaines de fausses adresses épuiseraient le
  // quota Brevo et dégraderaient la réputation de l'expéditeur.
  if (typeof body.website === "string" && body.website.trim() !== "") {
    return sendJson(res, 201, {
      status: "subscribed",
      email: String(body.email ?? "").slice(0, 200),
      message: "Inscription enregistrée.",
    });
  }

  const check = validateSubscriber(body);
  if (!check.valid) {
    return sendError(res, 422, "Adresse e-mail invalide.", check.errors);
  }

  const { email } = check.value;

  const existing = await prisma.subscriber.findUnique({
    where: { email },
    select: { id: true },
  });
  if (existing) return alreadySubscribed(res, email);

  try {
    await prisma.subscriber.create({
      // Le schéma sait générer le jeton seul (@default(uuid())), mais on
      // le fournit explicitement : sa génération ne dépend ainsi d'aucun
      // réglage Prisma, et qui lit cette route voit d'où il vient.
      data: { email, unsubscribeToken: randomUUID() },
    });
  } catch (error) {
    // Deux envois quasi simultanés (double clic, réseau lent) peuvent
    // passer tous deux la vérification ci-dessus. Le second bute alors
    // sur la contrainte d'unicité : c'est un « déjà inscrit », pas une
    // panne.
    if (error?.code === "P2002") return alreadySubscribed(res, email);
    throw error;
  }

  // On ne renvoie jamais le jeton : il n'a sa place que dans les
  // e-mails, sinon n'importe quel script pourrait désinscrire la
  // personne qu'il vient d'inscrire.
  return sendJson(res, 201, {
    status: "subscribed",
    email,
    message: "Inscription enregistrée.",
  });
}

export default (req, res) => route(req, res, { POST: subscribe });
