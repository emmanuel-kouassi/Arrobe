import { isLoggedIn } from "../lib/api";

/**
 * Bandeau de retour vers l'administration
 * ===================================================================
 * Affiché en haut des pages de détail, mais UNIQUEMENT si un jeton de
 * session est présent. Un visiteur ordinaire ne voit rien : inutile de
 * lui signaler l'existence d'un back-office.
 *
 * Le lien pointe vers une route explicite et non vers history.back().
 * Le retour navigateur est imprévisible ici : l'admin a pu arriver par
 * un lien direct, avoir rechargé la page, ou venir d'un autre onglet —
 * dans ces cas il repartirait n'importe où, voire hors du site.
 * ===================================================================
 */
export default function AdminBackBar({ to, label = "Retour à l'administration" }) {
  // Simple présence du jeton : sa validité est vérifiée par l'API à la
  // première requête. Un jeton expiré affiche donc encore le bandeau,
  // et le clic renverra vers la page de connexion. C'est le bon
  // comportement, mieux vaut ça qu'un bandeau qui disparaît sans
  // explication.
  if (!isLoggedIn()) return null;

  return (
    <div className="admin-bar">
      <div className="container admin-bar__inner">
        <span className="admin-bar__tag">Prévisualisation</span>

        <a className="admin-bar__link" href={to}>
          <svg viewBox="0 0 24 24" aria-hidden="true">
            <path
              d="M14.5 5.5L8 12l6.5 6.5"
              fill="none"
              stroke="currentColor"
              strokeWidth="2"
              strokeLinecap="round"
              strokeLinejoin="round"
            />
          </svg>
          {label}
        </a>
      </div>
    </div>
  );
}