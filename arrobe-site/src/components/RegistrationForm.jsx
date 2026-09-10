import { useState } from "react";
import { api } from "../lib/api";

/**
 * Formulaire d'inscription à un événement.
 * ===================================================================
 * Placé en bas de la page de détail : on lit le programme, puis on
 * s'inscrit, sans changer de page.
 *
 * Route publique, donc l'API revalide tout de son côté. La validation
 * ci-dessous n'est là que pour éviter un aller-retour inutile.
 * ===================================================================
 */
export default function RegistrationForm({ slug, title }) {
  const [form, setForm] = useState({
    name: "",
    email: "",
    phone: "",
    numberOfPeople: 1,
  });
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");
  const [done, setDone] = useState(false);

  const update = (field) => (e) =>
    setForm((current) => ({ ...current, [field]: e.target.value }));

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (busy) return;

    if (!form.name.trim() || !form.email.trim()) {
      setError("Le nom et l'adresse e-mail sont obligatoires.");
      return;
    }

    setError("");
    setBusy(true);

    try {
      await api.register(slug, {
        name: form.name.trim(),
        email: form.email.trim(),
        phone: form.phone.trim() || null,
        numberOfPeople: Number(form.numberOfPeople) || 1,
      });
      setDone(true);
    } catch (err) {
      // L'API détaille les champs fautifs dans `details`.
      setError(err.details?.join(" ") ?? err.message);
    } finally {
      setBusy(false);
    }
  };

  if (done) {
    return (
      <section className="register" id="inscription">
        <div className="register__card register__card--done">
          <h2>Inscription enregistrée</h2>
          <p>
            Merci {form.name.trim()}, votre inscription à «&nbsp;{title}&nbsp;»
            est bien prise en compte. Nous vous attendons&nbsp;!
          </p>
          <p className="register__note">
            Vous n'avez pas reçu de confirmation par e-mail&nbsp;: l'envoi
            automatique n'est pas encore en place. En cas de doute,
            contactez-nous.
          </p>
        </div>
      </section>
    );
  }

  return (
    <section className="register" id="inscription">
      <div className="register__card">
        <h2>S'inscrire à cet événement</h2>
        <p className="register__lead">
          Laissez-nous vos coordonnées, nous vous réservons une place.
        </p>

        <form onSubmit={handleSubmit} noValidate>
          <div className="form__row">
            <div className="form__field">
              <label htmlFor="reg-name">Nom et prénom *</label>
              <input
                id="reg-name"
                type="text"
                autoComplete="name"
                value={form.name}
                onChange={update("name")}
                disabled={busy}
                required
              />
            </div>

            <div className="form__field">
              <label htmlFor="reg-email">Adresse e-mail *</label>
              <input
                id="reg-email"
                type="email"
                autoComplete="email"
                value={form.email}
                onChange={update("email")}
                disabled={busy}
                required
              />
            </div>
          </div>

          <div className="form__row">
            <div className="form__field">
              <label htmlFor="reg-phone">Téléphone</label>
              <input
                id="reg-phone"
                type="tel"
                autoComplete="tel"
                placeholder="Facultatif"
                value={form.phone}
                onChange={update("phone")}
                disabled={busy}
              />
            </div>

            <div className="form__field">
              <label htmlFor="reg-people">Nombre de personnes</label>
              <input
                id="reg-people"
                type="number"
                min="1"
                max="20"
                value={form.numberOfPeople}
                onChange={update("numberOfPeople")}
                disabled={busy}
              />
            </div>
          </div>

          {error && (
            <p className="form__error" role="alert">
              {error}
            </p>
          )}

          <button type="submit" className="form__submit" disabled={busy}>
            {busy ? "Envoi…" : "Je m'inscris"}
          </button>

          <p className="register__note">
            Vos coordonnées servent uniquement à organiser cet événement et ne
            sont transmises à personne.
          </p>
        </form>
      </div>
    </section>
  );
}
