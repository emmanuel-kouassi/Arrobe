import { useState } from "react";
import { api, ApiError } from "../lib/api";

/* ===================================================================
   LOGO AFFICHÉ DANS LA CARTE DE CONNEXION
   =================================================================== */
import logoIcone from "../assets/logo_icone.png";

const LOGO_ALT = "Logo de l'association @Rrobe";

function ArrowLeft() {
  return (
    <svg className="back__icon" viewBox="0 0 24 24" aria-hidden="true">
      <path
        d="M14.5 5.5L8 12l6.5 6.5"
        fill="none"
        stroke="currentColor"
        strokeWidth="2"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  );
}

function EyeToggle({ visible }) {
  return (
    <svg viewBox="0 0 24 24" aria-hidden="true">
      <path
        d="M2 12s3.8-6.5 10-6.5S22 12 22 12s-3.8 6.5-10 6.5S2 12 2 12z"
        fill="none"
        stroke="currentColor"
        strokeWidth="1.7"
      />
      <circle cx="12" cy="12" r="2.6" fill="currentColor" />
      {visible && (
        <path
          d="M4 20L20 4"
          fill="none"
          stroke="currentColor"
          strokeWidth="1.9"
          strokeLinecap="round"
        />
      )}
    </svg>
  );
}

export default function Login() {
  const [identifiant, setIdentifiant] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState("");
  const [shake, setShake] = useState(false);
  const [busy, setBusy] = useState(false);

  const goBack = () => {
    // Retour à la page précédente si l'utilisateur vient du site,
    // sinon retour à l'accueil.
    if (window.history.length > 1) window.history.back();
    else window.location.hash = "#/";
  };

  const refuse = (message) => {
    setError(message);
    setShake(true);
    setTimeout(() => setShake(false), 500);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (busy) return;

    if (!identifiant.trim() || !password) {
      refuse("Merci de renseigner votre identifiant et votre mot de passe.");
      return;
    }

    setError("");
    setBusy(true);

    try {
      await api.login(identifiant.trim(), password);
      // Le mot de passe ne reste pas en mémoire une fois utilisé.
      setPassword("");
      window.location.hash = "#/administration";
    } catch (err) {
      // L'API renvoie volontairement le même message que l'identifiant
      // soit inconnu ou le mot de passe faux. On le relaie tel quel.
      const message =
        err instanceof ApiError && err.status === 0
          ? "Serveur injoignable. Vérifie que l'API est démarrée."
          : err.message;
      refuse(message);
    } finally {
      setBusy(false);
    }
  };

  return (
    <main className="login">
      <div className="container">
        <button type="button" className="back" onClick={goBack}>
          <ArrowLeft />
          Retour
        </button>

        <section className={`login__card ${shake ? "is-shaking" : ""}`}>
          <img className="login__logo" src={logoIcone} alt={LOGO_ALT} />

          <form onSubmit={handleSubmit} noValidate>
            <div className="field" style={{ "--delay": "180ms" }}>
              <label htmlFor="login-identifiant">Identifiant :</label>
              <input
                id="login-identifiant"
                type="text"
                autoComplete="username"
                autoCapitalize="none"
                spellCheck="false"
                placeholder="Identifiant"
                value={identifiant}
                onChange={(e) => setIdentifiant(e.target.value)}
                disabled={busy}
              />
            </div>

            <div className="field" style={{ "--delay": "280ms" }}>
              <label htmlFor="login-password">Mot de passe :</label>

              <div className="field__wrap">
                <input
                  id="login-password"
                  type={showPassword ? "text" : "password"}
                  autoComplete="current-password"
                  placeholder="Mot de passe"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  disabled={busy}
                />
                <button
                  type="button"
                  className="field__toggle"
                  aria-label={
                    showPassword
                      ? "Masquer le mot de passe"
                      : "Afficher le mot de passe"
                  }
                  onClick={() => setShowPassword((v) => !v)}
                >
                  <EyeToggle visible={showPassword} />
                </button>
              </div>
            </div>

            <a className="login__forgot" href="#/mot-de-passe-oublie">
              Mot de passe oublié ?
            </a>

            {error && (
              <p className="login__error" role="alert">
                {error}
              </p>
            )}

            <button type="submit" className="login__submit" disabled={busy}>
              {busy ? "Connexion…" : "Connexion"}
            </button>
          </form>
        </section>
      </div>
    </main>
  );
}