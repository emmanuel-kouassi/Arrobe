/**
 * Catégories
 * ===================================================================
 * Source unique de vérité, partagée par le formulaire d'administration
 * et par les filtres du site public.
 *
 * La valeur stockée en base est le libellé lui-même, tel qu'il
 * s'affiche. Pas d'identifiant technique ni d'enum Prisma : la colonne
 * reste un simple texte, ce qui permet d'ajouter une catégorie plus
 * tard sans migration. Le prix à payer est qu'une faute de frappe crée
 * une catégorie parallèle — d'où le menu déroulant plutôt qu'un champ
 * libre dans le formulaire.
 *
 * Attention si tu renommes une entrée : les articles déjà enregistrés
 * gardent l'ancien libellé. Il faudra les mettre à jour en base, sinon
 * ils se retrouveront dans une catégorie fantôme.
 * ===================================================================
 */

export const ARTICLE_CATEGORIES = ["Tuto", "Projets & Initiatives"];

export const EVENT_CATEGORIES = [
  "Atelier",
  "Formation",
  "Vie de l'association",
];

/** Valeur de la puce « Tous » sur la page Blog. */
export const ALL = "all";

/**
 * Puces du filtre : les catégories par défaut, plus toute catégorie
 * réellement présente dans les articles reçus.
 *
 * Sans cette union, une catégorie ajoutée à la main en base serait
 * invisible dans les filtres, et les articles concernés inatteignables.
 */
export function buildFilters(items, defaults = ARTICLE_CATEGORIES) {
  const found = new Set(items.map((item) => item.category).filter(Boolean));
  const ordered = [...defaults.filter((c) => true)];
  for (const category of found) {
    if (!ordered.includes(category)) ordered.push(category);
  }
  return [{ id: ALL, label: "Tous" }, ...ordered.map((c) => ({ id: c, label: c }))];
}