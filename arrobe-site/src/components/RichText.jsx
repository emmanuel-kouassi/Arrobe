import { useMemo } from "react";
import DOMPurify from "dompurify";

/**
 * Affiche du HTML venant de la base après nettoyage.
 * ===================================================================
 * Le contenu est saisi dans un éditeur riche et stocké en HTML. Même
 * si seul l'administrateur peut l'écrire, on le nettoie avant de
 * l'injecter : un compte compromis, un copier-coller depuis un site
 * tiers ou une base restaurée depuis une sauvegarde douteuse
 * suffiraient à faire passer un script.
 *
 * Ne JAMAIS appeler dangerouslySetInnerHTML ailleurs sans passer par
 * ce composant.
 * ===================================================================
 */

/**
 * Liste blanche : tout ce qui n'y figure pas est retiré.
 *
 * Doit rester cohérente avec les FORMATS de src/admin/Editor.jsx.
 *
 * Deux points propres à Quill 2 :
 *   - les listes sortent en <ol><li data-list="bullet">, jamais en
 *     <ul>. Sans `data-list`, toutes les puces deviendraient des
 *     numéros à l'affichage.
 *   - l'alignement et l'indentation passent par des classes
 *     ql-align-* et ql-indent-*, d'où l'autorisation de `class`,
 *     filtrée juste après pour ne garder que ces préfixes.
 */
const CONFIG = {
  ALLOWED_TAGS: [
    "p", "br", "strong", "b", "em", "i", "u", "s", "blockquote",
    "h2", "h3", "h4",
    "ul", "ol", "li",
    "a", "img", "figure", "figcaption",
    "code", "pre", "hr",
    "table", "thead", "tbody", "tr", "th", "td",
  ],
  ALLOWED_ATTR: [
    "href", "title", "target", "rel", "src", "alt", "loading",
    "class", "data-list",
  ],
  // Bloque javascript:, data: et consorts dans href et src.
  ALLOWED_URI_REGEXP: /^(?:https?:|mailto:|tel:|\/|#)/i,
};

/** Seules ces familles de classes sont conservées. */
const CLASS_PREFIXES = ["ql-align-", "ql-indent-"];

let hookInstalled = false;

/**
 * Filtre les classes après nettoyage. Autoriser `class` en bloc
 * laisserait passer n'importe quel nom et permettrait de détourner
 * les styles du site depuis le contenu d'un article.
 */
function installClassFilter() {
  if (hookInstalled) return;
  hookInstalled = true;

  DOMPurify.addHook("afterSanitizeAttributes", (node) => {
    if (!node.getAttribute?.("class")) return;

    const kept = node
      .getAttribute("class")
      .split(/\s+/)
      .filter((name) => CLASS_PREFIXES.some((prefix) => name.startsWith(prefix)));

    if (kept.length) node.setAttribute("class", kept.join(" "));
    else node.removeAttribute("class");
  });
}

export default function RichText({ html, className = "prose" }) {
  const clean = useMemo(() => {
    if (!html) return "";

    installClassFilter();
    const sanitized = DOMPurify.sanitize(html, CONFIG);

    // Les liens externes ouverts dans un nouvel onglet doivent porter
    // rel="noopener" : sans lui, la page ouverte peut manipuler la
    // nôtre via window.opener.
    return sanitized.replace(
      /<a\s+([^>]*target="_blank"[^>]*)>/gi,
      (match, attrs) =>
        attrs.includes("rel=") ? match : `<a ${attrs} rel="noopener noreferrer">`
    );
  }, [html]);

  if (!clean) return null;

  return (
    <div className={className} dangerouslySetInnerHTML={{ __html: clean }} />
  );
}