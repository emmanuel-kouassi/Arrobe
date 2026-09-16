/**
 * Envoi de la newsletter via Brevo
 * ===================================================================
 *   await notifySubscribers({ type: "article", title, excerpt, url });
 *
 * Envoie un e-mail à chaque abonné pour annoncer un nouvel article ou
 * un nouvel événement.
 *
 * UN APPEL BREVO PAR ABONNÉ, et non un seul appel avec `to` en
 * tableau :
 *   - avec `to` en tableau, chaque destinataire verrait les adresses
 *     de tous les autres dans l'en-tête du mail ;
 *   - chaque e-mail porte un lien de désinscription différent ;
 *   - une adresse refusée par Brevo ne fait échouer que son envoi.
 * Brevo propose aussi un envoi groupé (`messageVersions`), mais une
 * seule adresse invalide peut y faire rejeter le lot entier.
 * Le coût est négligeable à l'échelle d'une association : l'offre
 * gratuite plafonne de toute façon à 300 e-mails par jour, et les
 * envois partent par petits groupes en parallèle.
 *
 * NE LÈVE JAMAIS D'EXCEPTION. Publier un article ne doit pas échouer
 * parce que Brevo est en panne ou mal configuré. Tout est journalisé
 * et la fonction renvoie un bilan :
 *   { total, sent, failed, notAttempted, skipped, error }
 *
 * Envoi technique (clé API, tentatives, erreurs) : voir brevo.js.
 * Gabarit visuel partagé : voir email-layout.js.
 * ===================================================================
 */

import { createHash, randomUUID } from "node:crypto";

import { prisma } from "./prisma.js";
import { escapeHtml } from "./html.js";
import { readEmailConfig, sendEmail, oneLine, absoluteUrl, maskEmail } from "./brevo.js";
import { renderEmailLayout, emailTitle, emailButton, COLORS } from "./email-layout.js";
import { runInBackground } from "./background.js";

/** Envois simultanés. Assez pour aller vite, trop peu pour saturer. */
const CONCURRENCY = 5;

const TYPES = {
  article: { subject: "Nouvel article", cta: "Lire l'article" },
  event: { subject: "Nouvel événement", cta: "Voir l'événement" },
};

/* ------------------------------------------------------------------
   Contenu de l'e-mail
   ------------------------------------------------------------------ */

/**
 * Construit l'objet, le HTML et la version texte d'une newsletter.
 * Exportée pour pouvoir prévisualiser un e-mail sans rien envoyer.
 */
export function renderNewsletterEmail({ type, title, excerpt, url, unsubscribeUrl }) {
  const kind = TYPES[type];
  const cleanTitle = oneLine(title);
  const cleanExcerpt = oneLine(excerpt);
  const subject = `${kind.subject} : ${cleanTitle}`;

  const e = escapeHtml(cleanExcerpt);
  const href = escapeHtml(url);

  const htmlContent = renderEmailLayout({
    title: escapeHtml(subject),
    preheader: e,
    content: `<p style="margin:0 0 10px;font-size:14px;color:${COLORS.muted};">${kind.subject}</p>
            ${emailTitle(escapeHtml(cleanTitle))}
            ${e ? `<p style="margin:18px 0 0;font-size:16px;line-height:1.65;color:${COLORS.ink};">${e}</p>` : ""}
            ${emailButton(href, kind.cta)}`,
    footer: `Vous recevez cet e-mail car votre adresse est inscrite à la newsletter de l'association @Rrobe.<br>
            <a href="${escapeHtml(unsubscribeUrl)}" style="color:${COLORS.navy};">Se désabonner</a>`,
  });

  // Version texte : lue par certaines messageries et filtres anti-spam,
  // qui se méfient des e-mails uniquement HTML.
  const textContent = [
    subject,
    "",
    cleanExcerpt,
    "",
    `${kind.cta} : ${url}`,
    "",
    "--",
    "Vous recevez cet e-mail car votre adresse est inscrite à la newsletter de l'association @Rrobe.",
    `Se désabonner : ${unsubscribeUrl}`,
  ]
    .filter((line, i, lines) => !(line === "" && lines[i - 1] === ""))
    .join("\n");

  return { subject, htmlContent, textContent };
}

/* ------------------------------------------------------------------
   Point d'entrée
   ------------------------------------------------------------------ */

/**
 * @param {object} publication
 * @param {"article"|"event"} publication.type
 * @param {string} publication.title
 * @param {string} [publication.excerpt]  extrait (article) ou description (événement)
 * @param {string} publication.url        absolue, ou relative au site (« /#/blog/slug »)
 * @returns {Promise<{total:number, sent:number, failed:number, notAttempted:number, skipped:string|null, error:string|null}>}
 */
export async function notifySubscribers({ type, title, excerpt, url } = {}) {
  const summary = { total: 0, sent: 0, failed: 0, notAttempted: 0, skipped: null, error: null };

  try {
    const config = readEmailConfig();
    if (config.missing.length > 0) {
      console.warn(
        `[newsletter] envoi ignoré, configuration incomplète : ${config.missing.join(", ")}.`
      );
      summary.skipped = "missing-config";
      return summary;
    }

    const link = absoluteUrl(url, config.siteUrl);
    if (!TYPES[type] || !oneLine(title) || !link) {
      console.error("[newsletter] envoi ignoré, paramètres invalides :", {
        type,
        title,
        url,
      });
      summary.skipped = "invalid-input";
      return summary;
    }

    const subscribers = await prisma.subscriber.findMany({
      select: { id: true, email: true, unsubscribeToken: true },
      orderBy: { createdAt: "asc" },
    });

    summary.total = subscribers.length;
    if (subscribers.length === 0) {
      console.info(`[newsletter] « ${oneLine(title)} » : aucun abonné, rien à envoyer.`);
      return summary;
    }

    // Identifiant de cet envoi : sert à fabriquer les clés
    // d'idempotence, propres à chaque abonné ET à chaque annonce.
    const batchId = randomUUID();
    let fatal = null;
    let next = 0;

    const worker = async () => {
      while (!fatal && next < subscribers.length) {
        const subscriber = subscribers[next++];

        const { subject, htmlContent, textContent } = renderNewsletterEmail({
          type,
          title,
          excerpt,
          url: link,
          unsubscribeUrl: `${config.siteUrl}/api/newsletter/unsubscribe/${subscriber.unsubscribeToken}`,
        });

        const result = await sendEmail(
          config,
          {
            to: subscriber.email,
            subject,
            htmlContent,
            textContent,
            tags: ["newsletter", `newsletter-${type}`],
          },
          {
            idempotencyKey: createHash("sha256")
              .update(`${batchId}:${subscriber.id}`)
              .digest("hex"),
          }
        );

        if (result.ok) {
          summary.sent++;
        } else if (result.fatal) {
          // Les envois déjà en vol quand l'erreur survient échouent
          // pareil : une seule ligne de journal suffit.
          summary.failed++;
          if (!fatal) {
            fatal = result.fatal;
            console.error(`[newsletter] ${result.message}`);
          }
        } else {
          summary.failed++;
          console.error(
            `[newsletter] échec pour ${maskEmail(subscriber.email)} (abonné ${subscriber.id}) : ${result.message}`
          );
        }
      }
    };

    await Promise.all(
      Array.from({ length: Math.min(CONCURRENCY, subscribers.length) }, worker)
    );

    summary.notAttempted = summary.total - summary.sent - summary.failed;

    if (fatal) {
      console.error(
        `[newsletter] envoi interrompu : ${fatal}. ${summary.notAttempted} abonné(s) non contacté(s).`
      );
    }
    console.info(
      `[newsletter] « ${oneLine(title)} » : ${summary.sent}/${summary.total} envoyé(s), ` +
        `${summary.failed} échec(s), ${summary.notAttempted} non tenté(s).`
    );
  } catch (error) {
    // Base injoignable, bug inattendu : on journalise et on rend la
    // main. La publication, elle, a déjà réussi.
    console.error("[newsletter] envoi interrompu par une erreur inattendue :", error);
    summary.error = error?.message ?? String(error);
    summary.notAttempted = summary.total - summary.sent - summary.failed;
  }

  return summary;
}

/* ------------------------------------------------------------------
   Déclenchement depuis une route de publication
   ------------------------------------------------------------------ */

/**
 * Annonce une publication aux abonnés SANS faire attendre la réponse
 * HTTP, et sans jamais pouvoir la faire échouer (voir background.js).
 *
 *   announcePublication({ type: "article", title, excerpt, url });
 *   return sendJson(res, 200, { article });   // part immédiatement
 */
export function announcePublication(publication) {
  runInBackground("newsletter", () => notifySubscribers(publication));
}

/**
 * Annonce la première publication d'un événement.
 *
 * Un événement déjà passé n'est pas annoncé : publier une archive (la
 * fête du village de l'an dernier, avec son compte rendu) enverrait
 * sinon « Nouvel événement » pour une date révolue à tous les abonnés.
 */
export function announceEvent(event) {
  if (!(event?.date instanceof Date) || event.date < new Date()) {
    console.info(
      `[newsletter] « ${event?.title} » est un événement passé : publié sans annonce aux abonnés.`
    );
    return;
  }

  announcePublication({
    type: "event",
    title: event.title,
    excerpt: event.description,
    // Relative : newsletter.js la complète avec SITE_URL.
    url: `/#/evenement/${event.slug}`,
  });
}
