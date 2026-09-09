/**
 * Authentification administrateur
 * ===================================================================
 * Jeton JWT signé en HS256, transmis dans l'en-tête
 * `Authorization: Bearer <token>`.
 *
 * Choix assumé : le jeton n'est pas dans un cookie httpOnly. Un cookie
 * serait mieux protégé d'une faille XSS, mais imposerait une gestion
 * CSRF. Pour un back-office à un seul compte, le jeton porteur avec
 * une durée de vie courte est un compromis raisonnable. Côté front,
 * range-le dans sessionStorage plutôt que localStorage : il disparaît
 * à la fermeture de l'onglet.
 * ===================================================================
 */

import { SignJWT, jwtVerify } from "jose";

/** Durée de validité d'une session admin. */
const TOKEN_LIFETIME = "2h";

/** Longueur minimale du secret. En dessous, HS256 perd son intérêt. */
const MIN_SECRET_LENGTH = 32;

let cachedSecret;

function getSecret() {
  if (cachedSecret) return cachedSecret;

  const secret = process.env.JWT_SECRET;

  if (!secret) {
    throw new Error(
      "JWT_SECRET est absent. Génère-le avec :\n" +
        '  node -e "console.log(require(\'crypto\').randomBytes(48).toString(\'base64url\'))"'
    );
  }

  if (secret.length < MIN_SECRET_LENGTH) {
    throw new Error(
      `JWT_SECRET fait ${secret.length} caractères, il en faut au moins ${MIN_SECRET_LENGTH}.`
    );
  }

  cachedSecret = new TextEncoder().encode(secret);
  return cachedSecret;
}

/** Fabrique un jeton pour un administrateur authentifié. */
export async function signAdminToken(admin) {
  return new SignJWT({ identifiant: admin.identifiant, role: "admin" })
    .setProtectedHeader({ alg: "HS256" })
    .setSubject(admin.id)
    .setIssuedAt()
    .setExpirationTime(TOKEN_LIFETIME)
    .sign(getSecret());
}

/** Extrait le jeton de l'en-tête Authorization. */
function readBearer(req) {
  const header = req.headers?.authorization ?? req.headers?.Authorization;
  if (typeof header !== "string") return undefined;

  const [scheme, token] = header.split(" ");
  if (scheme?.toLowerCase() !== "bearer" || !token) return undefined;
  return token.trim();
}

/**
 * Renvoie la charge utile du jeton, ou null si absent/invalide/expiré.
 * Ne lève jamais : sert aux routes publiques qui adaptent leur réponse
 * selon qu'un admin est connecté ou non.
 */
export async function readAdmin(req) {
  const token = readBearer(req);
  if (!token) return null;

  try {
    const { payload } = await jwtVerify(token, getSecret(), {
      algorithms: ["HS256"],
    });
    return payload.role === "admin" ? payload : null;
  } catch {
    return null;
  }
}

/**
 * Garde pour les routes réservées à l'administrateur.
 *
 *   const admin = await requireAdmin(req, res);
 *   if (!admin) return;   // la réponse 401 a déjà été envoyée
 *
 * On renvoie systématiquement 401 sans préciser si le jeton est absent,
 * malformé ou expiré : inutile de renseigner qui tâtonne.
 */
export async function requireAdmin(req, res) {
  const admin = await readAdmin(req);

  if (!admin) {
    res.statusCode = 401;
    res.setHeader("WWW-Authenticate", "Bearer");
    res.setHeader("Content-Type", "application/json; charset=utf-8");
    res.setHeader("Cache-Control", "no-store");
    res.end(JSON.stringify({ error: "Authentification requise." }));
    return null;
  }

  return admin;
}
