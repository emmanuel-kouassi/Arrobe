/**
 * Formatage des dates
 * ===================================================================
 * Centralisé ici pour que toutes les pages affichent les dates de la
 * même façon, et pour n'avoir qu'un endroit à corriger.
 * ===================================================================
 */

/** « 12 mars 2026 » */
export function formatLongDate(value) {
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return "";
  return date.toLocaleDateString("fr-FR", {
    day: "numeric",
    month: "long",
    year: "numeric",
  });
}

/** « mardi 12 mars 2026 à 18:30 » */
export function formatDateTime(value) {
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return "";
  const day = date.toLocaleDateString("fr-FR", {
    weekday: "long",
    day: "numeric",
    month: "long",
    year: "numeric",
  });
  const time = date.toLocaleTimeString("fr-FR", {
    hour: "2-digit",
    minute: "2-digit",
  });
  return `${day} à ${time}`;
}
