import { useState } from "react";

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
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState("");
  const [shake, setShake] = useState(false);

  const goBack = () => {
    // Retour à la page précédente si l'utilisateur vient du site,
    // sinon retour à l'accueil.
    if (window.history.length > 1) window.history.back();
    else window.location.hash = "#/";
  };

  const handleSubmit = (e) => {
    e.preventDefault();

    if (!email.trim() || !password.trim()) {
      setError("Merci de renseigner votre adresse mail et votre mot de passe.");
      setShake(true);
      setTimeout(() => setShake(false), 500);
      return;
    }

    setError("");
    // TODO : brancher ici l'appel à ton API d'authentification.
    console.log("Connexion demandée pour", email);
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
              <label htmlFor="login-email">Adresse mail :</label>
              <input
                id="login-email"
                type="email"
                autoComplete="email"
                placeholder="Adresse mail"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
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

            <button type="submit" className="login__submit">
              Connexion
            </button>
          </form>
        </section>
      </div>
    </main>
  );
}