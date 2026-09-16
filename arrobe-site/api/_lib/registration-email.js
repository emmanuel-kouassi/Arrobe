/**
 * E-mail de confirmation d'inscription à un événement
 * ===================================================================
 *   sendRegistrationConfirmation(registration, event);
 *
 * Envoyé à la personne qui vient de s'inscrire : récapitulatif (date,
 * lieu, nombre de places) et lien vers la page de l'événement.
 *
 * C'est un e-mail TRANSACTIONNEL, pas une newsletter : il répond à une
 * action de la personne, n'est envoyé qu'une fois, et ne porte donc pas
 * de lien de désinscription. Pour un empêchement, elle répond au mail :
 * la réponse arrive dans la boîte de l'association (BREVO_SENDER_EMAIL).
 *
 * NE LÈVE JAMAIS D'EXCEPTION : l'inscription est déjà enregistrée
 * quand on arrive ici, un mail qui échoue ne doit pas l'annuler.
 * ===================================================================
 */

import { escapeHtml } from "./html.js";
import { readEmailConfig, sendEmail, oneLine, absoluteUrl, maskEmail } from "./brevo.js";
import { renderEmailLayout, emailTitle, emailButton, COLORS } from "./email-layout.js";

/**
 * Date lisible, TOUJOURS à l'heure de Paris : les serveurs Vercel
 * tournent en UTC, un événement à 18 h 30 s'afficherait sinon 16 h 30.
 *   « samedi 21 juin 2027 à 14:00 »
 */
function formatEventDate(date) {
  return new Date(date).toLocaleString("fr-FR", {
    timeZone: "Europe/Paris",
    dateStyle: "full",
    timeStyle: "short",
  });
}

function placesLabel(count) {
  return count > 1 ? `${count} personnes` : "1 personne";
}

/**
 * Construit l'objet, le HTML et la version texte de la confirmation.
 * Exportée pour pouvoir prévisualiser l'e-mail sans rien envoyer.
 */
export function renderRegistrationEmail({ name, numberOfPeople, event, url }) {
  const cleanName = oneLine(name);
  const cleanTitle = oneLine(event.title);
  const when = formatEventDate(event.date);
  const places = placesLabel(numberOfPeople);
  const subject = `Inscription confirmée : ${cleanTitle}`;

  const rows = [
    ["Date", when],
    ["Lieu", oneLine(event.location)],
    ["Places réservées", places],
    ["Organisé par", oneLine(event.organizer)],
  ].filter(([, value]) => value);

  const detailRows = rows
    .map(
      ([label, value], i) => `<tr>
                <td style="padding:12px 0;${i ? `border-top:1px solid ${COLORS.line};` : ""}font-size:14px;color:${COLORS.muted};width:40%;vertical-align:top;">${label}</td>
                <td style="padding:12px 0;${i ? `border-top:1px solid ${COLORS.line};` : ""}font-size:15px;font-weight:600;color:${COLORS.ink};vertical-align:top;">${escapeHtml(value)}</td>
              </tr>`
    )
    .join("\n              ");

  const href = escapeHtml(url);

  const htmlContent = renderEmailLayout({
    title: escapeHtml(subject),
    preheader: escapeHtml(`${cleanTitle} — ${when}`),
    content: `${emailTitle("Inscription confirmée")}
            <p style="margin:18px 0 0;font-size:16px;line-height:1.65;color:${COLORS.ink};">
              Bonjour ${escapeHtml(cleanName)},<br>
              votre inscription à <strong>${escapeHtml(cleanTitle)}</strong> est bien enregistrée. Nous vous attendons&nbsp;!
            </p>
            <table role="presentation" cellpadding="0" cellspacing="0" border="0" width="100%" style="margin-top:24px;font-family:inherit;">
              ${detailRows}
            </table>
            ${emailButton(href, "Voir l'événement")}`,
    footer: `Un empêchement ou une question&nbsp;? Répondez simplement à cet e-mail.<br>
            Vous recevez ce message suite à votre inscription sur le site de l'association @Rrobe.`,
  });

  const textContent = [
    subject,
    "",
    `Bonjour ${cleanName},`,
    `votre inscription à « ${cleanTitle} » est bien enregistrée. Nous vous attendons !`,
    "",
    ...rows.map(([label, value]) => `${label} : ${value}`),
    "",
    `Voir l'événement : ${url}`,
    "",
    "--",
    "Un empêchement ou une question ? Répondez simplement à cet e-mail.",
  ].join("\n");

  return { subject, htmlContent, textContent };
}

/**
 * Envoie la confirmation. Renvoie { sent: boolean, skipped?, error? }.
 * Ne lève jamais.
 *
 * @param {{ id: string, name: string, email: string, numberOfPeople: number }} registration
 * @param {{ slug: string, title: string, date: Date, location: string, organizer: string }} event
 */
export async function sendRegistrationConfirmation(registration, event) {
  try {
    const config = readEmailConfig();
    if (config.missing.length > 0) {
      console.warn(
        `[inscription] confirmation non envoyée, configuration incomplète : ${config.missing.join(", ")}.`
      );
      return { sent: false, skipped: "missing-config" };
    }

    const url = absoluteUrl(`/#/evenement/${event.slug}`, config.siteUrl);
    const { subject, htmlContent, textContent } = renderRegistrationEmail({
      name: registration.name,
      numberOfPeople: registration.numberOfPeople,
      event,
      url,
    });

    const result = await sendEmail(
      config,
      {
        to: registration.email,
        subject,
        htmlContent,
        textContent,
        tags: ["inscription-evenement"],
      },
      // Une inscription = une confirmation, même si l'appel est rejoué.
      { idempotencyKey: `inscription-${registration.id}` }
    );

    if (!result.ok) {
      console.error(
        `[inscription] confirmation non envoyée à ${maskEmail(registration.email)} ` +
          `(inscription ${registration.id}) : ${result.message}` +
          (result.fatal ? ` — ${result.fatal}` : "")
      );
      return { sent: false, error: result.message };
    }

    console.info(
      `[inscription] confirmation envoyée à ${maskEmail(registration.email)} pour « ${oneLine(event.title)} ».`
    );
    return { sent: true };
  } catch (error) {
    console.error("[inscription] erreur inattendue pendant l'envoi de la confirmation :", error);
    return { sent: false, error: error?.message ?? String(error) };
  }
}
