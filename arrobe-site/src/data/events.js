/**
 * Événements — source temporaire
 * ===================================================================
 * Comme pour les articles, les listes sont vides en attendant que la
 * page lise la base de données. Les événements de démonstration ont
 * été retirés ; ils restent dans l'historique git.
 *
 * Rappel : la séparation « à venir » / « passés » n'est pas stockée en
 * base. Une fois la page branchée sur Prisma, elle se calculera en
 * comparant le champ `date` de chaque Event à la date du jour.
 *
 * Forme attendue d'un événement :
 *   { id, day, month, year, title, organizer, place, schedule, image }
 * ===================================================================
 */

export const UPCOMING_EVENTS = [];

export const PAST_EVENTS = [];