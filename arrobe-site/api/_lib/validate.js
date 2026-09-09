/**
 * Validation des entrées
 * ===================================================================
 * Validation écrite à la main plutôt qu'avec une bibliothèque : les
 * quatre modèles sont simples et stables, une dépendance de plus
 * n'apporterait rien ici.
 *
 * Principe : on ne fait jamais confiance au corps de la requête, même
 * sur les routes protégées. Chaque fonction renvoie
 *   { valid: true, value } ou { valid: false, errors: [...] }
 * ===================================================================
 */

const STATUSES = ["DRAFT", "PUBLISHED"];

/** Transforme un titre en slug d'URL : accents retirés, tirets. */
export function slugify(text) {
  return String(text)
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "") // retire les diacritiques
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "")
    .slice(0, 90);
}

function str(value) {
  return typeof value === "string" ? value.trim() : undefined;
}

function requireText(errors, body, field, { max = 500, min = 1 } = {}) {
  const value = str(body[field]);
  if (value === undefined || value.length < min) {
    errors.push(`${field} est obligatoire.`);
    return undefined;
  }
  if (value.length > max) {
    errors.push(`${field} dépasse ${max} caractères.`);
    return undefined;
  }
  return value;
}

function optionalText(errors, body, field, { max = 500 } = {}) {
  if (!(field in body) || body[field] === null || body[field] === "") return null;
  const value = str(body[field]);
  if (value === undefined) {
    errors.push(`${field} doit être une chaîne de caractères.`);
    return undefined;
  }
  if (value.length > max) {
    errors.push(`${field} dépasse ${max} caractères.`);
    return undefined;
  }
  return value;
}

function readStatus(errors, body, fallback) {
  if (!("status" in body)) return fallback;
  const value = str(body.status)?.toUpperCase();
  if (!STATUSES.includes(value)) {
    errors.push(`status doit valoir ${STATUSES.join(" ou ")}.`);
    return undefined;
  }
  return value;
}

/**
 * Valide un article.
 * `partial: true` pour un PUT, où seuls les champs fournis comptent.
 */
export function validateArticle(body, { partial = false } = {}) {
  const errors = [];
  const value = {};
  const has = (field) => field in body;

  if (!partial || has("title")) {
    const title = requireText(errors, body, "title", { max: 200 });
    if (title) value.title = title;
  }

  if (!partial || has("excerpt")) {
    const excerpt = requireText(errors, body, "excerpt", { max: 600 });
    if (excerpt) value.excerpt = excerpt;
  }

  if (!partial || has("content")) {
    const content = requireText(errors, body, "content", { max: 200_000 });
    if (content) value.content = content;
  }

  if (!partial || has("category")) {
    const category = requireText(errors, body, "category", { max: 80 });
    if (category) value.category = category;
  }

  if (!partial || has("readingTime")) {
    const minutes = Number(body.readingTime);
    if (!Number.isInteger(minutes) || minutes < 1 || minutes > 240) {
      errors.push("readingTime doit être un entier entre 1 et 240 (minutes).");
    } else {
      value.readingTime = minutes;
    }
  }

  if (has("image")) {
    const image = optionalText(errors, body, "image", { max: 400 });
    if (image !== undefined) value.image = image;
  }

  if (has("slug")) {
    const slug = slugify(body.slug ?? "");
    if (!slug) errors.push("slug est vide après nettoyage.");
    else value.slug = slug;
  }

  const status = readStatus(errors, body, partial ? undefined : "DRAFT");
  if (status !== undefined) value.status = status;

  return errors.length ? { valid: false, errors } : { valid: true, value };
}

/** Valide un événement. */
export function validateEvent(body, { partial = false } = {}) {
  const errors = [];
  const value = {};
  const has = (field) => field in body;

  if (!partial || has("title")) {
    const title = requireText(errors, body, "title", { max: 200 });
    if (title) value.title = title;
  }

  if (!partial || has("description")) {
    const description = requireText(errors, body, "description", { max: 600 });
    if (description) value.description = description;
  }

  if (!partial || has("content")) {
    const content = requireText(errors, body, "content", { max: 200_000 });
    if (content) value.content = content;
  }

  if (!partial || has("category")) {
    const category = requireText(errors, body, "category", { max: 80 });
    if (category) value.category = category;
  }

  if (!partial || has("location")) {
    const location = requireText(errors, body, "location", { max: 200 });
    if (location) value.location = location;
  }

  if (!partial || has("organizer")) {
    const organizer = requireText(errors, body, "organizer", { max: 200 });
    if (organizer) value.organizer = organizer;
  }

  if (!partial || has("date")) {
    // On accepte une date ISO. Sans fuseau explicite, elle serait lue
    // selon celui du serveur — d'où la recommandation d'envoyer une
    // chaîne complète, par exemple 2026-11-14T18:30:00+01:00.
    const date = new Date(body.date);
    if (Number.isNaN(date.getTime())) {
      errors.push("date doit être une date ISO valide (ex. 2026-11-14T18:30:00+01:00).");
    } else {
      value.date = date;
    }
  }

  if (has("image")) {
    const image = optionalText(errors, body, "image", { max: 400 });
    if (image !== undefined) value.image = image;
  }

  if (has("slug")) {
    const slug = slugify(body.slug ?? "");
    if (!slug) errors.push("slug est vide après nettoyage.");
    else value.slug = slug;
  }

  const status = readStatus(errors, body, partial ? undefined : "DRAFT");
  if (status !== undefined) value.status = status;

  return errors.length ? { valid: false, errors } : { valid: true, value };
}

/** Valide une inscription à un événement. Route publique : soyons stricts. */
export function validateRegistration(body) {
  const errors = [];
  const value = {};

  const name = requireText(errors, body, "name", { max: 120, min: 2 });
  if (name) value.name = name;

  const email = str(body.email);
  // Volontairement permissif : on écarte les saisies manifestement
  // fausses sans prétendre valider un e-mail par expression régulière,
  // exercice perdu d'avance. La vraie vérification serait un envoi.
  if (!email || !/^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/.test(email) || email.length > 200) {
    errors.push("email doit être une adresse valide.");
  } else {
    value.email = email.toLowerCase();
  }

  if (body.phone !== undefined && body.phone !== null && body.phone !== "") {
    const phone = str(body.phone);
    if (!phone || phone.length > 30) {
      errors.push("phone dépasse 30 caractères.");
    } else {
      value.phone = phone;
    }
  } else {
    value.phone = null;
  }

  const people = body.numberOfPeople === undefined ? 1 : Number(body.numberOfPeople);
  if (!Number.isInteger(people) || people < 1 || people > 20) {
    errors.push("numberOfPeople doit être un entier entre 1 et 20.");
  } else {
    value.numberOfPeople = people;
  }

  return errors.length ? { valid: false, errors } : { valid: true, value };
}
