/**
 * Gabarit commun des e-mails du site
 * ===================================================================
 * HTML en tableaux et styles en ligne : c'est ce que les messageries
 * (Outlook en tête) affichent correctement. Pas d'image : rien à
 * bloquer, rien à héberger. Mêmes couleurs que le site.
 *
 * Toutes les chaînes passées ici doivent DÉJÀ être échappées
 * (escapeHtml) si elles contiennent des données saisies.
 * ===================================================================
 */

const FONT = "'Segoe UI',Roboto,Helvetica,Arial,sans-serif";

export const COLORS = {
  ink: "#16264d",
  navy: "#1e2e5e",
  green: "#14a26a",
  muted: "#5a6885",
  page: "#f7f9fc",
  line: "#e3e8f2",
};

/** Titre marqué de la barre verte, comme sur le site. */
export function emailTitle(html) {
  return `<table role="presentation" cellpadding="0" cellspacing="0" border="0" width="100%">
              <tr>
                <td style="border-left:6px solid ${COLORS.green};padding:2px 0 2px 14px;font-size:24px;line-height:1.3;font-weight:700;color:${COLORS.ink};">
                  ${html}
                </td>
              </tr>
            </table>`;
}

/** Bouton compatible Outlook, suivi du lien en clair pour qui ne peut pas cliquer. */
export function emailButton(href, label) {
  return `<table role="presentation" cellpadding="0" cellspacing="0" border="0" style="margin-top:28px;">
              <tr>
                <td bgcolor="${COLORS.green}" style="border-radius:8px;">
                  <a href="${href}" style="display:inline-block;padding:14px 26px;font-family:${FONT};font-size:16px;font-weight:600;color:#ffffff;text-decoration:none;border-radius:8px;">${label}</a>
                </td>
              </tr>
            </table>
            <p style="margin:24px 0 0;font-size:13px;line-height:1.5;color:${COLORS.muted};">
              Le bouton ne s'ouvre pas&nbsp;? Copiez ce lien dans votre navigateur&nbsp;:<br>
              <a href="${href}" style="color:${COLORS.navy};word-break:break-all;">${href}</a>
            </p>`;
}

/**
 * Page complète : nom de l'association, carte blanche, pied de page.
 *
 * @param {object} parts
 * @param {string} parts.title       balise <title>, déjà échappée
 * @param {string} parts.preheader   aperçu affiché par les messageries, déjà échappé
 * @param {string} parts.content     HTML de la carte
 * @param {string} parts.footer      HTML du pied de page
 */
export function renderEmailLayout({ title, preheader, content, footer }) {
  return `<!doctype html>
<html lang="fr">
<head>
<meta charset="utf-8">
<meta name="viewport" content="width=device-width, initial-scale=1">
<meta name="x-apple-disable-message-reformatting">
<title>${title}</title>
</head>
<body style="margin:0;padding:0;background-color:${COLORS.page};">
<div style="display:none;max-height:0;overflow:hidden;opacity:0;color:transparent;">${preheader}</div>
<table role="presentation" width="100%" cellpadding="0" cellspacing="0" border="0" style="background-color:${COLORS.page};">
  <tr>
    <td align="center" style="padding:32px 16px;">
      <table role="presentation" width="100%" cellpadding="0" cellspacing="0" border="0" style="max-width:560px;">
        <tr>
          <td style="padding:0 4px 16px;font-family:${FONT};font-size:14px;font-weight:600;color:${COLORS.muted};">
            Association @Rrobe
          </td>
        </tr>
        <tr>
          <td style="background-color:#ffffff;border-radius:16px;padding:36px 32px;font-family:${FONT};color:${COLORS.ink};">
            ${content}
          </td>
        </tr>
        <tr>
          <td style="padding:20px 4px 0;font-family:${FONT};font-size:13px;line-height:1.6;color:${COLORS.muted};">
            ${footer}
          </td>
        </tr>
      </table>
    </td>
  </tr>
</table>
</body>
</html>`;
}
