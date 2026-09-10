import { put } from "@vercel/blob";

import { requireAdmin } from "./_lib/auth.js";
import { getQuery, route, sendError, sendJson } from "./_lib/http.js";

/**
 * POST /api/upload?filename=photo.jpg
 *
 * Le fichier arrive en corps binaire brut, pas en multipart : le type MIME
 * est dans Content-Type, le nom d'origine en query string. Ça évite une
 * dépendance de parsing (busboy, formidable) pour un besoin d'un seul fichier.
 *
 * Réponse : { url, pathname, size, contentType }
 */

// Vercel plafonne le corps d'une requête à 4,5 Mo. On reste en dessous pour
// renvoyer notre propre message plutôt qu'un 413 opaque de la plateforme.
const MAX_SIZE = 4 * 1024 * 1024;

const ALLOWED_TYPES = {
  "image/jpeg": "jpg",
  "image/png": "png",
  "image/webp": "webp",
  "image/gif": "gif",
  "image/avif": "avif",
};

// Le Content-Type est déclaratif : on peut poster un .html en annonçant
// image/png. Les blobs étant servis depuis un domaine public, un HTML stocké
// puis servi comme tel ouvrirait une faille XSS. On vérifie les magic bytes.
const MAGIC_BYTES = {
  "image/jpeg": (b) => b[0] === 0xff && b[1] === 0xd8 && b[2] === 0xff,
  "image/png": (b) =>
    b[0] === 0x89 && b[1] === 0x50 && b[2] === 0x4e && b[3] === 0x47,
  "image/gif": (b) => b[0] === 0x47 && b[1] === 0x49 && b[2] === 0x46,
  "image/webp": (b) =>
    b[8] === 0x57 && b[9] === 0x45 && b[10] === 0x42 && b[11] === 0x50,
  "image/avif": (b) =>
    b[4] === 0x66 && b[5] === 0x74 && b[6] === 0x79 && b[7] === 0x70,
};

/** "Atelier Été 2026.JPG" -> "atelier-ete-2026" */
function slugify(name) {
  return name
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .toLowerCase()
    .replace(/\.[^.]+$/, "")
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "")
    .slice(0, 60);
}

/**
 * Équivalent binaire de readJsonBody : Vercel peut avoir déjà rempli
 * req.body, sinon on lit le flux. On coupe dès le dépassement de taille
 * pour ne pas charger un fichier géant en mémoire si le Content-Length ment.
 */
async function readBinaryBody(req) {
  if (Buffer.isBuffer(req.body)) return req.body;

  const chunks = [];
  let total = 0;

  for await (const chunk of req) {
    total += chunk.length;
    if (total > MAX_SIZE) {
      const error = new Error("Corps de requête trop volumineux.");
      error.code = "TOO_LARGE";
      throw error;
    }
    chunks.push(chunk);
  }

  return Buffer.concat(chunks);
}

async function uploadImage(req, res) {
  const admin = await requireAdmin(req, res);
  if (!admin) return;

  const contentType = String(req.headers["content-type"] ?? "")
    .split(";")[0]
    .trim()
    .toLowerCase();

  if (!(contentType in ALLOWED_TYPES)) {
    const formats = Object.values(ALLOWED_TYPES).join(", ");
    return sendError(
      res,
      415,
      `Format non supporté. Formats acceptés : ${formats}.`,
    );
  }

  // Refus sur l'en-tête, avant même de lire le flux.
  const annonce = Number(req.headers["content-length"] ?? 0);
  if (annonce > MAX_SIZE) {
    const mo = (annonce / 1024 / 1024).toFixed(1);
    return sendError(res, 413, `Image trop lourde (${mo} Mo). Maximum : 4 Mo.`);
  }

  let buffer;
  try {
    buffer = await readBinaryBody(req);
  } catch (error) {
    if (error.code === "TOO_LARGE") {
      return sendError(res, 413, "Image trop lourde. Maximum : 4 Mo.");
    }
    return sendError(res, 400, "Lecture du fichier impossible.");
  }

  if (buffer.length === 0) {
    return sendError(res, 400, "Le fichier est vide.");
  }

  const verifie = MAGIC_BYTES[contentType];
  if (verifie && !verifie(buffer)) {
    return sendError(res, 400, "Ce fichier n'est pas une image valide.");
  }

  const extension = ALLOWED_TYPES[contentType];
  const nom = slugify(getQuery(req, "filename") ?? "") || "image";
  const pathname = `articles/${nom}.${extension}`;

  try {
    const blob = await put(pathname, buffer, {
      access: "public",
      // Deux "photo.jpg" ne s'écrasent jamais l'un l'autre.
      addRandomSuffix: true,
      // Type forcé depuis la whitelist, jamais depuis le client.
      contentType,
      // Les URL Blob sont immuables : on peut cacher un an.
      cacheControlMaxAge: 31536000,
    });

    return sendJson(res, 200, {
      url: blob.url,
      pathname: blob.pathname,
      size: buffer.length,
      contentType,
    });
  } catch (error) {
    console.error("[api/upload] échec Vercel Blob :", error);
    return sendError(res, 500, "L'envoi a échoué. Réessaie dans un instant.");
  }
}

export default (req, res) => route(req, res, { POST: uploadImage });