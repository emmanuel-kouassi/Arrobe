/**
 * Envoi d'e-mails via Brevo
 * ===================================================================
 * Le socle commun à tous les e-mails du site : newsletter, confirmation
 * d'inscription à un événement… Chaque type d'e-mail construit son
 * contenu dans son propre module et le confie à sendEmail().
 *
 * Variables d'environnement :
 *   BREVO_API_KEY       clé API Brevo (SMTP & API > Clés API)
 *   BREVO_SENDER_EMAIL  adresse expéditrice vérifiée dans Brevo
 *   SITE_URL            adresse publique du site, ex. https://arrobe.fr
 *                       (sur Vercel, repli automatique sur le domaine
 *                       de production si elle est absente)
 * ===================================================================
 */

import { randomUUID } from "node:crypto";

const BREVO_ENDPOINT = "https://api.brevo.com/v3/smtp/email";
const SENDER_NAME = "Association @Rrobe";

/** Délai maximal d'un appel Brevo avant abandon de la tentative. */
const REQUEST_TIMEOUT_MS = 10_000;
/** Tentatives par e-mail en cas d'erreur passagère (429, 5xx, réseau). */
const MAX_ATTEMPTS = 3;
/** Plafond d'attente entre deux tentatives. */
const MAX_RETRY_WAIT_MS = 10_000;

/* ------------------------------------------------------------------
   Configuration et utilitaires
   ------------------------------------------------------------------ */

export function readEmailConfig() {
  const apiKey = process.env.BREVO_API_KEY?.trim();
  const senderEmail = process.env.BREVO_SENDER_EMAIL?.trim();

  // VERCEL_PROJECT_PRODUCTION_URL est fournie par Vercel (sans le
  // protocole). On ne se rabat pas sur VERCEL_URL : c'est l'adresse du
  // déploiement en cours, parfois protégée, et les liens des e-mails
  // doivent rester valides après les déploiements suivants.
  const rawSite =
    process.env.SITE_URL?.trim() ||
    (process.env.VERCEL_PROJECT_PRODUCTION_URL
      ? `https://${process.env.VERCEL_PROJECT_PRODUCTION_URL}`
      : "");

  let siteUrl = null;
  try {
    const parsed = new URL(rawSite);
    if (parsed.protocol === "https:" || parsed.protocol === "http:") {
      siteUrl = parsed.origin + parsed.pathname.replace(/\/+$/, "");
    }
  } catch {
    /* reste null */
  }

  const missing = [];
  if (!apiKey) missing.push("BREVO_API_KEY");
  if (!senderEmail) missing.push("BREVO_SENDER_EMAIL");
  if (!siteUrl) missing.push("SITE_URL (adresse absolue, ex. https://arrobe.fr)");

  return { apiKey, senderEmail, siteUrl, missing };
}

/** Ramène un texte sur une ligne : un saut de ligne dans l'objet d'un mail le casse. */
export function oneLine(value) {
  return String(value ?? "").replace(/\s+/g, " ").trim();
}

/**
 * Rend absolue une URL du site. Accepte « /#/blog/mon-article »
 * ou « #/blog/mon-article » aussi bien qu'une URL complète : un lien
 * relatif ne mène nulle part depuis une boîte mail.
 */
export function absoluteUrl(url, siteUrl) {
  try {
    const parsed = new URL(String(url ?? ""), `${siteUrl}/`);
    return parsed.protocol === "https:" || parsed.protocol === "http:" ? parsed.href : null;
  } catch {
    return null;
  }
}

/** « jean.dupont@exemple.fr » -> « j•••@exemple.fr » : les journaux n'ont pas besoin de plus. */
export function maskEmail(email) {
  const [local = "", domain = ""] = String(email).split("@");
  return `${local.slice(0, 1)}•••@${domain}`;
}

/* ------------------------------------------------------------------
   Appel à Brevo
   ------------------------------------------------------------------ */

const wait = (ms) => new Promise((resolve) => setTimeout(resolve, ms));

/**
 * Erreurs qui valent pour tous les envois suivants : inutile de
 * continuer, chaque appel échouerait pareil et remplirait les journaux.
 */
function fatalReason(status, code) {
  if (status === 401 || status === 403 || code === "unauthorized" || code === "permission_denied") {
    // Brevo répond aussi 401 quand l'adresse IP d'où part l'appel n'est
    // pas autorisée : fréquent sur Vercel, dont les IP changent.
    return (
      "appel refusé par Brevo : clé API erronée ou révoquée, ou adresse IP bloquée " +
      "(Brevo > Paramètres > Sécurité > IP autorisées)"
    );
  }
  if (status === 402 || code === "not_enough_credits" || code === "Insufficient credits") {
    return "quota Brevo épuisé (300 e-mails par jour sur l'offre gratuite)";
  }
  if (code === "account_under_validation") {
    return "compte Brevo en cours de validation : les envois sont suspendus";
  }
  return null;
}

/** Délai avant nouvelle tentative : consigne de Brevo si fournie, sinon attente croissante. */
function retryDelay(response, attempt) {
  const reset = Number(response?.headers?.get("x-sib-ratelimit-reset"));
  const fromHeader = Number.isFinite(reset) && reset > 0 ? reset * 1000 : 0;
  return Math.min(fromHeader || 1000 * 2 ** (attempt - 1), MAX_RETRY_WAIT_MS);
}

/**
 * Envoie UN e-mail via l'API transactionnelle de Brevo.
 *
 *   const result = await sendEmail(config, {
 *     to: "jean@exemple.fr", subject, htmlContent, textContent, tags,
 *   });
 *
 * Renvoie { ok: true } ou { ok: false, message, fatal? }. Ne lève
 * jamais : les erreurs passagères (429, 5xx, réseau) sont retentées,
 * les autres sont décrites dans `message`. `fatal` signale une erreur
 * qui vaudra pour tous les envois suivants (clé, quota, compte).
 *
 * `idempotencyKey` : à fournir si l'appelant peut rappeler la fonction
 * pour le même message ; sinon une clé est générée pour cet appel.
 */
export async function sendEmail(config, message, { idempotencyKey = randomUUID() } = {}) {
  const payload = {
    sender: { name: SENDER_NAME, email: config.senderEmail },
    to: [{ email: message.to }],
    subject: message.subject,
    htmlContent: message.htmlContent,
    textContent: message.textContent,
    ...(message.tags ? { tags: message.tags } : {}),
  };

  let lastError = "échec inconnu";

  for (let attempt = 1; attempt <= MAX_ATTEMPTS; attempt++) {
    let response;
    try {
      response = await fetch(BREVO_ENDPOINT, {
        method: "POST",
        headers: {
          accept: "application/json",
          "content-type": "application/json",
          "api-key": config.apiKey,
        },
        // La même clé à chaque tentative : si Brevo a bien reçu un envoi
        // dont la réponse s'est perdue (délai dépassé), la nouvelle
        // tentative ne produit pas de doublon chez le destinataire.
        body: JSON.stringify({ ...payload, headers: { "Idempotency-Key": idempotencyKey } }),
        signal: AbortSignal.timeout(REQUEST_TIMEOUT_MS),
      });
    } catch (error) {
      // Réseau coupé, DNS, délai dépassé : passager, on retente.
      lastError = error?.name === "TimeoutError" ? "délai dépassé" : `réseau : ${error?.message}`;
      if (attempt < MAX_ATTEMPTS) await wait(retryDelay(null, attempt));
      continue;
    }

    if (response.ok) return { ok: true };

    const body = await response.json().catch(() => null);
    const code = body?.code;
    lastError = `HTTP ${response.status}${code ? ` ${code}` : ""}${body?.message ? ` — ${body.message}` : ""}`;

    const fatal = fatalReason(response.status, code);
    if (fatal) return { ok: false, message: lastError, fatal };

    // 429 (trop de requêtes) et 5xx (panne Brevo) : passager, on retente.
    // Tout autre 4xx (adresse invalide, contenu refusé) échouerait à
    // l'identique : on n'insiste pas.
    const transient = response.status === 429 || response.status >= 500;
    if (!transient) return { ok: false, message: lastError };
    if (attempt < MAX_ATTEMPTS) await wait(retryDelay(response, attempt));
  }

  return { ok: false, message: `${lastError} (après ${MAX_ATTEMPTS} tentatives)` };
}
