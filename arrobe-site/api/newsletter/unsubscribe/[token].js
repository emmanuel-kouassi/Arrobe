/**
 * /api/newsletter/unsubscribe/:token
 * ===================================================================
 * Lien « Se désabonner » placé en bas de chaque newsletter.
 *
 *   GET   affiche une page de confirmation. Ne modifie RIEN.
 *   POST  supprime l'abonné et affiche la confirmation.
 *
 * Pourquoi deux temps : les filtres de sécurité de certaines
 * messageries (Microsoft Defender en entreprise, notamment) ouvrent
 * les liens des e-mails pour les analyser. Si un simple GET
 * désinscrivait, ces robots désabonneraient des gens à leur insu. Un
 * robot suit un lien ; il ne soumet pas de formulaire.
 *
 * Le POST sert aussi au désabonnement « en un clic » des messageries
 * (norme RFC 8058) : Gmail ou Yahoo envoient un POST sur cette même
 * URL quand l'en-tête List-Unsubscribe-Post est présent dans le mail.
 * Rien à ajouter ici pour le prendre en charge.
 *
 * On y arrive depuis une boîte mail : les réponses sont de vraies
 * pages HTML, sans script, indépendantes du bundle React. Tout est
 * idempotent : un second envoi ou un vieux lien donnent une page
 * claire, jamais une erreur technique.
 * ===================================================================
 */

import { prisma } from "../../_lib/prisma.js";
import { route, sendHtml, getQuery, getSlug } from "../../_lib/http.js";
import { escapeHtml } from "../../_lib/html.js";

/** Forme d'un jeton émis par crypto.randomUUID(). */
const TOKEN_PATTERN = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/;

/**
 * Gabarit commun. `lead`, `note` et `actions` sont du HTML écrit dans
 * ce fichier ; toute donnée venant de la base doit passer par
 * escapeHtml() avant d'y être insérée.
 */
function page({ title, lead, note, actions }) {
  return `<!doctype html>
<html lang="fr">
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1">
  <meta name="robots" content="noindex, nofollow">
  <title>${title} — Association @Rrobe</title>
  <link rel="icon" type="image/svg+xml" href="/favicon.svg">
  <link rel="stylesheet" href="https://fonts.googleapis.com/css2?family=Poppins:wght@400;600;700&display=swap">
  <style>
    :root {
      --navy: #1e2e5e;
      --navy-deep: #16264d;
      --green: #14a26a;
      --page: #f7f9fc;
      --muted: #5a6885;
    }
    * { box-sizing: border-box; }
    body {
      margin: 0;
      min-height: 100vh;
      display: grid;
      place-items: center;
      padding: 24px;
      background: var(--page);
      color: var(--navy-deep);
      font-family: "Poppins", "Segoe UI", system-ui, -apple-system, sans-serif;
      font-size: 17px;
      line-height: 1.65;
      -webkit-font-smoothing: antialiased;
    }
    main {
      width: 100%;
      max-width: 560px;
      padding: clamp(28px, 6vw, 48px);
      border-radius: 22px;
      background: #fff;
      box-shadow: 0 26px 60px rgba(22, 38, 77, 0.14);
    }
    .brand {
      margin: 0 0 28px;
      font-size: 0.95rem;
      font-weight: 600;
      color: var(--muted);
    }
    h1 {
      position: relative;
      margin: 0 0 12px;
      padding-left: 18px;
      font-size: clamp(1.4rem, 4.5vw, 1.8rem);
      font-weight: 700;
      line-height: 1.3;
    }
    h1::before {
      content: "";
      position: absolute;
      left: 0;
      top: 5px;
      bottom: 7px;
      width: 7px;
      background: var(--green);
    }
    p { margin: 0; }
    .lead { max-width: 60ch; }
    .lead strong { font-weight: 600; overflow-wrap: anywhere; }
    .note { margin-top: 12px; font-size: 0.92rem; color: var(--muted); }
    .actions {
      display: flex;
      flex-wrap: wrap;
      align-items: center;
      gap: 12px 24px;
      margin-top: 30px;
    }
    .actions form { margin: 0; }
    .btn {
      display: inline-flex;
      align-items: center;
      justify-content: center;
      min-height: 44px;
      padding: 11px 24px;
      border: 0;
      border-radius: 8px;
      background: var(--navy);
      color: #fff;
      font: inherit;
      font-weight: 600;
      text-decoration: none;
      cursor: pointer;
    }
    .btn:hover { background: var(--navy-deep); }
    .link {
      display: inline-flex;
      align-items: center;
      min-height: 44px;
      color: var(--navy);
      font-weight: 600;
      text-decoration: underline;
      text-underline-offset: 3px;
    }
    .link:hover { color: var(--green); }
    .btn:focus-visible, .link:focus-visible { outline: 3px solid #1e90ff; outline-offset: 3px; border-radius: 6px; }
    @media (max-width: 480px) {
      .actions { flex-direction: column; align-items: stretch; }
      .btn { width: 100%; }
      .link { justify-content: center; }
    }
  </style>
</head>
<body>
  <main>
    <p class="brand">Association @Rrobe</p>
    <h1>${title}</h1>
    <p class="lead">${lead}</p>
    ${note ? `<p class="note">${note}</p>` : ""}
    <div class="actions">${actions ?? `<a class="btn" href="/">Retour au site</a>`}</div>
  </main>
</body>
</html>`;
}

const PAGES = {
  // Le formulaire n'a pas d'attribut action : il se soumet sur l'URL
  // courante, jeton compris. Rien à reconstruire, rien à échapper.
  confirm: (email) => ({
    title: "Se désabonner de la newsletter",
    lead: `L'adresse <strong>${escapeHtml(email)}</strong> ne recevra plus d'e-mail lors de la publication d'un article ou d'un événement.`,
    actions: `<form method="post"><button class="btn" type="submit">Confirmer la désinscription</button></form>
      <a class="link" href="/">Rester inscrit</a>`,
  }),
  done: {
    title: "Vous êtes désinscrit",
    lead: "Votre adresse a été retirée de la newsletter. Vous ne recevrez plus nos e-mails.",
    note: "Changé d'avis&nbsp;? Réinscrivez-vous à tout moment depuis le bas de n'importe quelle page du site.",
  },
  // Jeton inconnu : lien déjà utilisé, ou copié de travers. Dans les
  // deux cas l'adresse n'est pas (ou plus) inscrite — c'est ce que la
  // personne veut savoir. On ne précise pas lequel des deux, cela
  // renseignerait quelqu'un qui teste des jetons au hasard.
  unknown: {
    title: "Aucune inscription trouvée",
    lead: "Ce lien ne correspond à aucune inscription en cours. Si vous l'avez déjà utilisé, votre désinscription est bien effective.",
    note: "Vous recevez encore nos e-mails&nbsp;? Utilisez le lien présent en bas du plus récent.",
  },
  error: {
    title: "La désinscription n'a pas abouti",
    lead: "Le serveur n'a pas pu traiter votre demande. Réessayez en rouvrant le lien depuis l'e-mail dans quelques minutes.",
    note: "Si le problème persiste, écrivez-nous via la page Contact du site.",
  },
};

/**
 * Lit le jeton de l'URL. Vercel range le segment [token] dans
 * req.query.token ; le serveur local fait de même, et le repli sur le
 * dernier segment couvre tout autre hébergeur.
 *
 * crypto.randomUUID() produit des minuscules : on normalise, au cas où
 * un client mail aurait altéré la casse du lien.
 */
function readToken(req) {
  const token = (getQuery(req, "token") ?? getSlug(req))?.toLowerCase();
  return token && TOKEN_PATTERN.test(token) ? token : null;
}

/**
 * Les gestionnaires attrapent leurs propres erreurs : celui de route()
 * répondrait en JSON, illisible pour qui arrive de sa boîte mail.
 */
function withHtmlErrors(handler) {
  return async (req, res) => {
    try {
      return await handler(req, res);
    } catch (error) {
      console.error("[newsletter] désinscription impossible :", error);
      return sendHtml(res, 500, page(PAGES.error));
    }
  };
}

/** GET : lecture seule. Affiche la demande de confirmation. */
async function showConfirmation(req, res) {
  const token = readToken(req);
  if (!token) return sendHtml(res, 404, page(PAGES.unknown));

  const subscriber = await prisma.subscriber.findUnique({
    where: { unsubscribeToken: token },
    select: { email: true },
  });
  if (!subscriber) return sendHtml(res, 404, page(PAGES.unknown));

  return sendHtml(res, 200, page(PAGES.confirm(subscriber.email)));
}

/** POST : supprime l'abonné. Le corps de la requête est ignoré. */
async function unsubscribe(req, res) {
  const token = readToken(req);
  if (!token) return sendHtml(res, 404, page(PAGES.unknown));

  // deleteMany plutôt que delete : ne lève pas d'erreur si le jeton
  // n'existe plus (double envoi, page rechargée).
  const { count } = await prisma.subscriber.deleteMany({
    where: { unsubscribeToken: token },
  });

  return count > 0
    ? sendHtml(res, 200, page(PAGES.done))
    : sendHtml(res, 404, page(PAGES.unknown));
}

export default (req, res) =>
  route(req, res, {
    GET: withHtmlErrors(showConfirmation),
    POST: withHtmlErrors(unsubscribe),
  });
