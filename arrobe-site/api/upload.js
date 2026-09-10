import { put } from '@vercel/blob';

/**
 * POST /api/upload
 * Reçoit une image en multipart/form-data (champ "file"), la valide,
 * l'envoie sur Vercel Blob et renvoie l'URL publique.
 *
 * Réponse succès : { url, pathname, size, contentType }
 * Réponse erreur  : { error: "message lisible par l'admin" }
 */

// Vercel plafonne le corps d'une requête serverless à 4,5 Mo.
// On reste en dessous pour que l'erreur soit renvoyée par NOTRE code,
// avec un message clair, plutôt que par la plateforme.
const MAX_SIZE = 4 * 1024 * 1024;

// Whitelist stricte : type MIME accepté -> extension forcée.
const ALLOWED_TYPES = {
  'image/jpeg': 'jpg',
  'image/png': 'png',
  'image/webp': 'webp',
  'image/gif': 'gif',
  'image/avif': 'avif',
};

// Signatures binaires (magic bytes) pour vérifier que le fichier est
// réellement ce qu'il prétend être. Le type MIME envoyé par le navigateur
// est déclaratif : n'importe qui peut poster un .html en annonçant image/png.
const MAGIC_BYTES = {
  'image/jpeg': (b) => b[0] === 0xff && b[1] === 0xd8 && b[2] === 0xff,
  'image/png': (b) =>
    b[0] === 0x89 && b[1] === 0x50 && b[2] === 0x4e && b[3] === 0x47,
  'image/gif': (b) => b[0] === 0x47 && b[1] === 0x49 && b[2] === 0x46,
  // WebP et AVIF : conteneur RIFF / ISO-BMFF, on vérifie le tag à l'offset 8
  'image/webp': (b) =>
    b[8] === 0x57 && b[9] === 0x45 && b[10] === 0x42 && b[11] === 0x50,
  'image/avif': (b) =>
    b[4] === 0x66 && b[5] === 0x74 && b[6] === 0x79 && b[7] === 0x70,
};

const json = (data, status = 200) =>
  new Response(JSON.stringify(data), {
    status,
    headers: { 'content-type': 'application/json; charset=utf-8' },
  });

/** "Atelier Été 2026.JPG" -> "atelier-ete-2026" */
function slugify(name) {
  return name
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .toLowerCase()
    .replace(/\.[^.]+$/, '')
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '')
    .slice(0, 60);
}

export async function POST(request) {
  // ─────────────────────────────────────────────────────────────
  // TODO SÉCURITÉ — à brancher sur l'auth du dashboard admin.
  // Sans ce garde, n'importe qui sur Internet peut remplir ton store
  // en postant sur https://association-arrobe-hazel.vercel.app/api/upload
  //
  // if (!(await estAdmin(request))) {
  //   return json({ error: 'Non autorisé.' }, 401);
  // }
  // ─────────────────────────────────────────────────────────────

  let form;
  try {
    form = await request.formData();
  } catch {
    return json({ error: 'Requête invalide : multipart/form-data attendu.' }, 400);
  }

  const file = form.get('file');

  if (!file || typeof file === 'string') {
    return json({ error: 'Aucun fichier reçu (champ "file" manquant).' }, 400);
  }

  if (!(file.type in ALLOWED_TYPES)) {
    const liste = Object.values(ALLOWED_TYPES).join(', ');
    return json(
      { error: `Format non supporté. Formats acceptés : ${liste}.` },
      415,
    );
  }

  if (file.size === 0) {
    return json({ error: 'Le fichier est vide.' }, 400);
  }

  if (file.size > MAX_SIZE) {
    const mo = (file.size / 1024 / 1024).toFixed(1);
    return json(
      { error: `Image trop lourde (${mo} Mo). Maximum : 4 Mo.` },
      413,
    );
  }

  const buffer = Buffer.from(await file.arrayBuffer());

  const verifie = MAGIC_BYTES[file.type];
  if (verifie && !verifie(buffer)) {
    return json(
      { error: "Ce fichier n'est pas une image valide." },
      400,
    );
  }

  const extension = ALLOWED_TYPES[file.type];
  const nom = slugify(file.name || '') || 'image';
  const pathname = `articles/${nom}.${extension}`;

  try {
    const blob = await put(pathname, buffer, {
      access: 'public',
      // Suffixe aléatoire : deux "photo.jpg" ne s'écrasent jamais l'un l'autre.
      addRandomSuffix: true,
      // On force le content-type depuis la whitelist, jamais depuis le client.
      contentType: file.type,
      // Les URL Blob sont immuables : on peut cacher un an.
      cacheControlMaxAge: 31536000,
    });

    return json({
      url: blob.url,
      pathname: blob.pathname,
      size: file.size,
      contentType: file.type,
    });
  } catch (err) {
    console.error('[api/upload] échec Vercel Blob :', err);
    return json(
      { error: "L'envoi a échoué. Réessaie dans un instant." },
      500,
    );
  }
}