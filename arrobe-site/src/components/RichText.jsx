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

/** Liste blanche : tout ce qui n'y figure pas est retiré. */
const CONFIG = {
  ALLOWED_TAGS: [
    "p", "br", "strong", "em", "u", "s", "blockquote",
    "h2", "h3", "h4",
    "ul", "ol", "li",
    "a", "img", "figure", "figcaption",
    "code", "pre", "hr",
    "table", "thead", "tbody", "tr", "th", "td",
  ],
  ALLOWED_ATTR: ["href", "title", "target", "rel", "src", "alt", "loading"],
  // Bloque javascript:, data: et consorts dans href et src.
  ALLOWED_URI_REGEXP: /^(?:https?:|mailto:|tel:|\/|#)/i,
};

export default function RichText({ html, className = "prose" }) {
  const clean = useMemo(() => {
    if (!html) return "";

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
