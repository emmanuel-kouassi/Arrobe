/**
 * POST /api/admin/login
 * ===================================================================
 * Vérifie identifiant + mot de passe, renvoie un jeton de session.
 * ===================================================================
 */

import bcrypt from "bcryptjs";
import { prisma } from "../_lib/prisma.js";
import { signAdminToken } from "../_lib/auth.js";
import { route, readJsonBody, sendJson, sendError } from "../_lib/http.js";

/**
 * Hash factice, comparé quand l'identifiant n'existe pas.
 *
 * Sans lui, une requête pour un identifiant inconnu répondrait
 * instantanément alors qu'un identifiant connu prendrait ~250 ms le
 * temps du bcrypt. Cet écart suffit à énumérer les comptes valides.
 * On paie donc toujours le même coût.
 */
const DUMMY_HASH = "$2b$12$C6UzMDM.H6dfI/f/IKcEe.OuqNvKe0PtoQpBUuMTLNYvbeJVBGvOu";

async function login(req, res) {
  const body = await readJsonBody(req);

  const identifiant = typeof body.identifiant === "string" ? body.identifiant.trim() : "";
  const password = typeof body.password === "string" ? body.password : "";

  if (!identifiant || !password) {
    return sendError(res, 400, "identifiant et password sont obligatoires.");
  }

  const admin = await prisma.admin.findUnique({ where: { identifiant } });

  const matches = await bcrypt.compare(password, admin?.passwordHash ?? DUMMY_HASH);

  // Message unique : ne jamais révéler lequel des deux est faux.
  if (!admin || !matches) {
    return sendError(res, 401, "Identifiant ou mot de passe incorrect.");
  }

  const token = await signAdminToken(admin);

  return sendJson(res, 200, {
    token,
    identifiant: admin.identifiant,
    expiresIn: 7200,
  });
}

export default (req, res) => route(req, res, { POST: login });
