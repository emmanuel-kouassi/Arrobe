/**
 * Utilitaires HTTP
 * ===================================================================
 * Écrits pour la signature (req, res) de Node, celle qu'utilisent les
 * fonctions Vercel. Le même code tourne donc sous Express ou sous un
 * serveur Node nu, ce qui évite de réécrire l'API si le site part chez
 * o2switch plutôt que sur Vercel.
 * ===================================================================
 */

/** Taille maximale d'un corps de requête. Au-delà, on refuse. */
const MAX_BODY_BYTES = 1_000_000;

export function sendJson(res, status, payload) {
  res.statusCode = status;
  res.setHeader("Content-Type", "application/json; charset=utf-8");
  // Les réponses de l'API ne doivent jamais être mises en cache par un
  // intermédiaire : un brouillon pourrait se retrouver servi au public.
  res.setHeader("Cache-Control", "no-store");
  res.end(JSON.stringify(payload));
}

export function sendError(res, status, message, details) {
  return sendJson(res, status, details ? { error: message, details } : { error: message });
}

/**
 * Récupère le corps JSON de la requête.
 *
 * Vercel remplit déjà `req.body`. Sous un serveur Node nu, il faut
 * lire le flux à la main : on gère les deux cas pour que l'API reste
 * portable.
 */
export async function readJsonBody(req) {
  if (req.body !== undefined && req.body !== null) {
    if (typeof req.body === "string") {
      return req.body.trim() === "" ? {} : JSON.parse(req.body);
    }
    return req.body;
  }

  const chunks = [];
  let size = 0;

  for await (const chunk of req) {
    // Un flux Node peut émettre des Buffer ou des chaînes selon son
    // encodage. On normalise, sinon Buffer.concat plante.
    const buffer = Buffer.isBuffer(chunk) ? chunk : Buffer.from(chunk);
    size += buffer.length;
    if (size > MAX_BODY_BYTES) {
      const error = new Error("Corps de requête trop volumineux.");
      error.statusCode = 413;
      throw error;
    }
    chunks.push(buffer);
  }

  const raw = Buffer.concat(chunks).toString("utf8").trim();
  if (raw === "") return {};

  try {
    return JSON.parse(raw);
  } catch {
    const error = new Error("Corps de requête JSON invalide.");
    error.statusCode = 400;
    throw error;
  }
}

/**
 * Lit un paramètre d'URL (?cle=valeur) ou un segment dynamique.
 *
 * Vercel range les deux dans `req.query`. Ailleurs, on retombe sur
 * l'analyse de `req.url`.
 */
export function getQuery(req, key) {
  if (req.query && key in req.query) {
    const value = req.query[key];
    return Array.isArray(value) ? value[0] : value;
  }
  const url = new URL(req.url, "http://localhost");
  return url.searchParams.get(key) ?? undefined;
}

/**
 * Récupère le segment dynamique [slug] de l'URL.
 *
 * Sous Vercel il arrive dans req.query.slug. Sinon on le déduit du
 * chemin : /api/events/fete-du-village-2023/register -> le slug est
 * l'avant-dernier segment quand la route se termine par un nom fixe.
 */
export function getSlug(req, { trailing = 0 } = {}) {
  const fromQuery = getQuery(req, "slug");
  if (fromQuery) return fromQuery;

  const { pathname } = new URL(req.url, "http://localhost");
  const segments = pathname.split("/").filter(Boolean);
  const index = segments.length - 1 - trailing;
  return index >= 0 ? decodeURIComponent(segments[index]) : undefined;
}

/**
 * Aiguille selon la méthode HTTP et attrape toute erreur non gérée.
 *
 *   export default (req, res) => route(req, res, {
 *     GET: listArticles,
 *     POST: createArticle,
 *   });
 *
 * Une méthode absente renvoie 405 avec l'en-tête `Allow`, comme le
 * veut la spécification HTTP.
 */
export function route(req, res, handlers) {
  const allowed = Object.keys(handlers);
  const handler = handlers[req.method];

  if (!handler) {
    res.setHeader("Allow", allowed.join(", "));
    return sendError(res, 405, `Méthode ${req.method} non autorisée sur cette route.`);
  }

  return Promise.resolve(handler(req, res)).catch((error) => {
    // Erreur volontairement levée par le code (413, 400…)
    if (error?.statusCode) {
      return sendError(res, error.statusCode, error.message);
    }

    // Contrainte d'unicité PostgreSQL (slug déjà pris)
    if (error?.code === "P2002") {
      const field = error.meta?.target?.[0] ?? "champ";
      return sendError(res, 409, `Un enregistrement existe déjà avec ce ${field}.`);
    }

    // Enregistrement introuvable
    if (error?.code === "P2025") {
      return sendError(res, 404, "Enregistrement introuvable.");
    }

    // Tout le reste : on journalise côté serveur et on reste vague
    // côté client. Un message d'erreur Prisma détaillé renseignerait
    // un attaquant sur la structure de la base.
    console.error("[api] erreur non gérée :", error);
    return sendError(res, 500, "Erreur interne du serveur.");
  });
}
