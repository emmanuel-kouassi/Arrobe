/**
 * Échappement HTML
 * ===================================================================
 * Toute donnée insérée dans du HTML construit à la main (page de
 * désinscription, corps des newsletters) passe par ici. La validation
 * des e-mails est permissive et les titres sont saisis librement dans
 * l'administration : sans échappement, un « < » casserait la mise en
 * page, au pire injecterait du code.
 * ===================================================================
 */
export function escapeHtml(value) {
  return String(value ?? "")
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;")
    .replaceAll("'", "&#39;");
}
