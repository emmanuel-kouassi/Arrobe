import { useState } from "react";
import useReveal from "../hooks/useReveal";
import { api } from "../lib/api";
import Modal from "./Modal";

/** Même règle, volontairement permissive, que côté API. */
const EMAIL_PATTERN = /^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/;

const INVALID_EMAIL =
  "Cette adresse e-mail n'est pas valide. Vérifiez qu'elle contient un @ et un domaine, par exemple nom@exemple.fr.";

/**
 * Bloc d'inscription à la newsletter, affiché en bas des pages.
 * ===================================================================
 * Deux issues « réussies » s'affichent dans une fenêtre modale :
 *   - inscription enregistrée ;
 *   - adresse déjà inscrite — ce n'est pas une erreur, la personne
 *     reçoit déjà ce qu'elle demande.
 * Seules une adresse invalide ou une panne restent sous le champ,
 * là où l'on corrige sa saisie.
 * ===================================================================
 */
export default function Newsletter() {
  const [email, setEmail] = useState("");
  // Champ piège à robots, jamais visible ni rempli par un humain.
  const [website, setWebsite] = useState("");
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");
  // { status: "subscribed" | "already-subscribed", email } ou null
  const [result, setResult] = useState(null);
  const [ref, shown] = useReveal({ threshold: 0.25 });

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (busy) return;

    const value = email.trim();
    if (!value) {
      setError("Saisissez votre adresse e-mail pour vous inscrire.");
      return;
    }
    if (!EMAIL_PATTERN.test(value)) {
      setError(INVALID_EMAIL);
      return;
    }

    setError("");
    setBusy(true);

    try {
      const data = await api.subscribeNewsletter(value, website);
      setResult({ status: data.status, email: data.email || value });
      setEmail("");
    } catch (err) {
      setError(
        err.status === 422
          ? INVALID_EMAIL
          : err.status === 0
            ? "Le serveur est injoignable. Vérifiez votre connexion puis réessayez."
            : "L'inscription n'a pas pu être enregistrée. Réessayez dans quelques instants."
      );
    } finally {
      setBusy(false);
    }
  };

  const already = result?.status === "already-subscribed";

  return (
    <section className="newsletter" id="newsletter">
      <div className="container">
        <div className="newsletter__grid" ref={ref}>
          <div>
            <h2 className={`reveal ${shown ? "is-visible" : ""}`}>
              Restez informé des prochains ateliers &amp; astuces
            </h2>

            <p
              className={`reveal ${shown ? "is-visible" : ""}`}
              style={{ "--delay": "100ms" }}
            >
              Recevez nos derniers articles de blog et soyez prévenu dès qu'une
              nouvelle date de formation est disponible à
              Saint-Germain-sur-Morin.
            </p>
          </div>

          <div className={`reveal ${shown ? "is-visible" : ""}`} style={{ "--delay": "200ms" }}>
            <form className="newsletter__form" onSubmit={handleSubmit} noValidate>
              <label
                htmlFor="newsletter-email"
                style={{ position: "absolute", left: "-9999px" }}
              >
                Votre adresse e-mail
              </label>
              <input
                id="newsletter-email"
                type="email"
                autoComplete="email"
                inputMode="email"
                placeholder="Votre adresse e-mail..."
                value={email}
                onChange={(e) => {
                  setEmail(e.target.value);
                  if (error) setError("");
                }}
                // readOnly et non disabled : un champ désactivé perd le
                // focus, et la modale ne saurait plus où le rendre.
                readOnly={busy}
                aria-invalid={error ? "true" : undefined}
                aria-describedby={error ? "newsletter-error" : undefined}
              />

              {/* Piège à robots. Hors écran, hors tabulation, ignoré
                  des lecteurs d'écran et de l'autoremplissage. */}
              <div className="newsletter__trap" aria-hidden="true">
                <label htmlFor="newsletter-website">Ne pas remplir</label>
                <input
                  id="newsletter-website"
                  type="text"
                  name="website"
                  tabIndex={-1}
                  autoComplete="off"
                  value={website}
                  onChange={(e) => setWebsite(e.target.value)}
                />
              </div>

              {/* aria-disabled plutôt que disabled, pour la même raison :
                  le bouton garde le focus pendant l'envoi, et le focus
                  y revient à la fermeture de la modale. Le double envoi
                  est bloqué par le test `busy` de handleSubmit. */}
              <button
                className="btn newsletter__submit"
                type="submit"
                aria-disabled={busy ? "true" : undefined}
              >
                {busy ? "Inscription…" : "S'inscrire"}
              </button>
            </form>

            {error && (
              <p className="newsletter__error" id="newsletter-error" role="alert">
                {error}
              </p>
            )}

            <p className="newsletter__note">
              * Pas de spam. Désinscription possible à tout moment via le lien
              en bas de nos e-mails.
            </p>
          </div>
        </div>
      </div>

      <Modal
        open={result !== null}
        onClose={() => setResult(null)}
        title={already ? "Adresse déjà inscrite" : "Inscription confirmée"}
      >
        {already ? (
          <p>
            <strong>{result?.email}</strong> reçoit déjà nos nouveaux articles
            et événements. Vous n'avez rien d'autre à faire.
          </p>
        ) : (
          <>
            <p>
              Vous recevrez un e-mail à <strong>{result?.email}</strong> dès
              qu'un nouvel article ou événement est publié.
            </p>
            <p className="modal__note">
              Chaque e-mail contient un lien pour vous désinscrire à tout moment.
            </p>
          </>
        )}
      </Modal>
    </section>
  );
}
