import { useState } from "react";
import useReveal from "../hooks/useReveal";

export default function Newsletter() {
  const [email, setEmail] = useState("");
  const [sent, setSent] = useState(false);
  const [ref, shown] = useReveal({ threshold: 0.25 });

  const handleSubmit = (e) => {
    e.preventDefault();
    if (!email.trim()) return;
    // TODO : branche ici ton service (Brevo, Mailchimp, ton API…)
    setSent(true);
    setEmail("");
  };

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
            <form className="newsletter__form" onSubmit={handleSubmit}>
              <label
                htmlFor="newsletter-email"
                style={{ position: "absolute", left: "-9999px" }}
              >
                Votre adresse e-mail
              </label>
              <input
                id="newsletter-email"
                type="email"
                required
                placeholder="Votre adresse e-mail..."
                value={email}
                onChange={(e) => setEmail(e.target.value)}
              />
              <button className="btn newsletter__submit" type="submit">
                S'inscrire
              </button>
            </form>

            {sent && (
              <p className="newsletter__done">
                Inscription enregistrée. À bientôt dans votre boîte mail.
              </p>
            )}

            <p className="newsletter__note">
              * Pas de spam. Désinscription possible à tout moment via le lien
              en bas de nos e-mails.
            </p>
          </div>
        </div>
      </div>
    </section>
  );
}