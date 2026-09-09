/**
 * Articles du blog — source temporaire
 * ===================================================================
 * Ce fichier ne sert plus qu'à alimenter la page en attendant que le
 * blog lise la base de données. La liste est volontairement vide : la
 * base démarre vide, la page doit refléter la même chose.
 *
 * Les articles de démonstration ont été retirés. Ils restent
 * récupérables dans l'historique git si besoin.
 *
 * Forme attendue d'un article (voir aussi prisma/schema.prisma) :
 *   { id, title, excerpt, category, date, readingTime, views, image }
 * ===================================================================
 */

/* CATEGORIES a déménagé dans src/lib/categories.js : la liste est
   désormais partagée avec le formulaire d'administration, pour que
   les deux ne puissent plus diverger. */

export const POSTS = [];

export const SORT_OPTIONS = [
  { id: "recent", label: "Plus récents" },
  { id: "old", label: "Plus anciens" },
  { id: "reading", label: "Temps de lecture" },
];

/** Tri effectué côté navigateur, sans appel serveur. */
export function sortPosts(posts, sortId) {
  const copy = [...posts];
  if (sortId === "old") {
    return copy.sort((a, b) => a.date.localeCompare(b.date));
  }
  if (sortId === "reading") {
    return copy.sort((a, b) => a.readingTime - b.readingTime);
  }
  return copy.sort((a, b) => b.date.localeCompare(a.date));
}