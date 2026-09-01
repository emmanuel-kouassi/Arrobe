import { useState } from "react";
import useReveal from "../hooks/useReveal";

/* ===================================================================
   CARTE
   Pour recentrer sur ta vraie adresse : openstreetmap.org, cherche
   l'adresse, bouton « Partager », coche « Inclure un marqueur »,
   et copie l'URL du champ HTML dans MAP_SRC ci-dessous.
   =================================================================== */
const MAP_SRC =
  "https://www.openstreetmap.org/export/embed.html?bbox=2.8433%2C48.8805%2C2.8533%2C48.8856&layer=mapnik&marker=48.883063%2C2.848324";

// Lien « itinéraire » sous la carte
const MAP_DIRECTIONS =
  "https://www.openstreetmap.org/directions?to=48.883063%2C2.848324";

const INFOS = [
  {
    id: "adresse",
    label: "Notre local",
    lines: ["12 rue Lorem Ipsum", "77860 Saint-Germain-sur-Morin"],
    icon: "pin",
  },
  {
    id: "mail",
    label: "Écrivez-nous",
    lines: ["association.arrobe@sfr.fr"],
    href: "mailto:association.arrobe@sfr.fr",
    icon: "mail",
  },
  {
    id: "tel",
    label: "Appelez-nous",
    lines: ["01 23 45 67 89"],
    href: "tel:+33123456789",
    icon: "phone",
  },
  {
    id: "horaires",
    label: "Nos permanences",
    lines: ["Mardi et jeudi : 14h - 18h", "Samedi : 10h - 12h"],
    icon: "clock",
  },
];

const SUBJECTS = [
  "Adhérer à l'association",
  "Question sur un atelier",
  "Dépannage informatique",
  "Impression 3D",
  "Autre demande",
];

const FAQ = [
  {
    q: "Faut-il être adhérent pour venir à un atelier ?",
    a: "Lorem ipsum dolor sit amet, consectetur adipiscing elit. Sed do eiusmod tempor incididunt ut labore et dolore magna aliqua. Ut enim ad minim veniam, quis nostrud exercitation.",
  },
  {
    q: "Quel est le délai de réponse à un message ?",
    a: "Duis aute irure dolor in reprehenderit in voluptate velit esse cillum dolore eu fugiat nulla pariatur. Excepteur sint occaecat cupidatat non proident.",
  },
  {
    q: "Puis-je venir avec mon propre ordinateur ?",
    a: "Sed ut perspiciatis unde omnis iste natus error sit voluptatem accusantium doloremque laudantium, totam rem aperiam eaque ipsa quae ab illo inventore.",
  },
];

function Icon({ name }) {
  const common = {
    fill: "none",
    stroke: "currentColor",
    strokeWidth: 1.8,
    strokeLinecap: "round",
    strokeLinejoin: "round",
  };
  return (
    <svg className="info__icon" viewBox="0 0 24 24" aria-hidden="true">
      {name === "pin" && (
        <>
          <path d="M12 21s7-5.6 7-11a7 7 0 10-14 0c0 5.4 7 11 7 11z" {...common} />
          <circle cx="12" cy="10" r="2.6" {...common} />
        </>
      )}
      {name === "mail" && (
        <>
          <rect x="3" y="5" width="18" height="14" rx="2.5" {...common} />
          <path d="M3.5 7l8.5 6 8.5-6" {...common} />
        </>
      )}
      {name === "phone" && (
        <path
          d="M6 3h3l2 5-2.5 1.5a12 12 0 006 6L16 13l5 2v3a2 2 0 01-2.2 2A17 17 0 014 5.2 2 2 0 016 3z"
          {...common}
        />
      )}
      {name === "clock" && (
        <>
          <circle cx="12" cy="12" r="9" {...common} />
          <path d="M12 7v5.4l3.4 2" {...common} />
        </>
      )}
    </svg>
  );
}

function InfoCard({ info, index }) {
  const [ref, shown] = useReveal({ threshold: 0.2 });
  const body = info.lines.map((line) => <span key={line}>{line}</span>);

  return (
    <li
      ref={ref}
      className={`info reveal ${shown ? "is-visible" : ""}`}
      style={{ "--delay": `${index * 110}ms` }}
    >
      <Icon name={info.icon} />
      <div>
        <h3>{info.label}</h3>
        <p>
          {info.href ? <a href={info.href}>{body}</a> : body}
        </p>
      </div>
    </li>
  );
}

function FaqItem({ item, index }) {
  const [open, setOpen] = useState(index === 0);
  const [ref, shown] = useReveal({ threshold: 0.2 });

  return (
    <div
      ref={ref}
      className={`faq ${open ? "is-open" : ""} reveal ${shown ? "is-visible" : ""}`}
      style={{ "--delay": `${index * 100}ms` }}
    >
      <button
        type="button"
        className="faq__head"
        aria-expanded={open}
        onClick={() => setOpen((v) => !v)}
      >
        <span>{item.q}</span>
        <span className="faq__sign" aria-hidden="true" />
      </button>

      <div className="faq__panel">
        <p>{item.a}</p>
      </div>
    </div>
  );
}

export default function Contact() {
  const [form, setForm] = useState({
    firstName: "",
    lastName: "",
    email: "",
    subject: SUBJECTS[0],
    message: "",
    consent: false,
  });
  const [sent, setSent] = useState(false);
  const [error, setError] = useState("");

  const [headRef, headShown] = useReveal({ threshold: 0.1 });
  const [formRef, formShown] = useReveal({ threshold: 0.12 });
  const [mapRef, mapShown] = useReveal({ threshold: 0.15 });
  const [faqRef, faqShown] = useReveal();

  const update = (key) => (e) => {
    const value = key === "consent" ? e.target.checked : e.target.value;
    setForm((prev) => ({ ...prev, [key]: value }));
  };

  const handleSubmit = (e) => {
    e.preventDefault();

    if (!form.firstName.trim() || !form.email.trim() || !form.message.trim()) {
      setError("Merci de remplir votre prénom, votre e-mail et votre message.");
      return;
    }
    if (!form.consent) {
      setError("Merci d'accepter que nous utilisions vos données pour vous répondre.");
      return;
    }

    setError("");
    setSent(true);
    // TODO : brancher ici l'envoi réel (API, EmailJS, Formspree…)
    console.log("Message de contact", form);
  };

  return (
    <main className="contact">
      <section className="contact__hero">
        <div className="container">
          <div ref={headRef} className={`reveal ${headShown ? "is-visible" : ""}`}>
            <h1 className="contact__title">Contactez-nous</h1>
            <p className="contact__intro">
              Une question sur un atelier, une envie d'adhérer ou simplement
              besoin d'un coup de main avec votre ordinateur&nbsp;? Lorem ipsum
              dolor sit amet, consectetur adipiscing elit, sed do eiusmod tempor
              incididunt ut labore et dolore magna aliqua.
            </p>
          </div>
        </div>
      </section>

      <section className="section">
        <div className="container">
          <div className="contact__grid">
            <div className="contact__aside">
              <h2 className="section__title section__title--sm is-visible">
                Nous joindre
              </h2>

              <ul className="info-list">
                {INFOS.map((info, i) => (
                  <InfoCard key={info.id} info={info} index={i} />
                ))}
              </ul>
            </div>

            <div
              ref={formRef}
              className={`contact__form-card reveal ${formShown ? "is-visible" : ""}`}
            >
              <h2>Écrivez-nous</h2>
              <p className="contact__form-lead">
                Remplissez ce formulaire, nous revenons vers vous sous 48&nbsp;heures
                ouvrées.
              </p>

              <form onSubmit={handleSubmit} noValidate>
                <div className="form__row">
                  <div className="form__field">
                    <label htmlFor="c-firstname">Prénom</label>
                    <input
                      id="c-firstname"
                      type="text"
                      placeholder="Jean"
                      value={form.firstName}
                      onChange={update("firstName")}
                    />
                  </div>

                  <div className="form__field">
                    <label htmlFor="c-lastname">Nom</label>
                    <input
                      id="c-lastname"
                      type="text"
                      placeholder="Dupont"
                      value={form.lastName}
                      onChange={update("lastName")}
                    />
                  </div>
                </div>

                <div className="form__field">
                  <label htmlFor="c-email">Adresse e-mail</label>
                  <input
                    id="c-email"
                    type="email"
                    placeholder="jean.dupont@exemple.fr"
                    value={form.email}
                    onChange={update("email")}
                  />
                </div>

                <div className="form__field">
                  <label htmlFor="c-subject">Sujet</label>
                  <select
                    id="c-subject"
                    value={form.subject}
                    onChange={update("subject")}
                  >
                    {SUBJECTS.map((s) => (
                      <option key={s} value={s}>
                        {s}
                      </option>
                    ))}
                  </select>
                </div>

                <div className="form__field">
                  <label htmlFor="c-message">Votre message</label>
                  <textarea
                    id="c-message"
                    rows="5"
                    placeholder="Décrivez votre demande en quelques lignes…"
                    value={form.message}
                    onChange={update("message")}
                  />
                </div>

                <label className="form__check">
                  <input
                    type="checkbox"
                    checked={form.consent}
                    onChange={update("consent")}
                  />
                  <span>
                    J'accepte que mes informations soient utilisées pour me
                    recontacter.
                  </span>
                </label>

                {error && (
                  <p className="form__error" role="alert">
                    {error}
                  </p>
                )}

                {sent && (
                  <p className="form__success" role="status">
                    Message envoyé. Merci, nous vous répondons très vite.
                  </p>
                )}

                <button type="submit" className="form__submit">
                  Envoyer le message
                </button>
              </form>
            </div>
          </div>
        </div>
      </section>

      <section className="section section--tight">
        <div className="container">
          <figure
            ref={mapRef}
            className={`contact__map reveal-zoom ${mapShown ? "is-visible" : ""}`}
          >
            <iframe
              title="Carte de Saint-Germain-sur-Morin"
              src={MAP_SRC}
              loading="lazy"
            />
            <figcaption>
              Le local se trouve à deux pas de la mairie, parking gratuit à
              proximité.{" "}
              <a href={MAP_DIRECTIONS} target="_blank" rel="noopener noreferrer">
                Calculer mon itinéraire
              </a>
            </figcaption>
          </figure>
        </div>
      </section>

      <section className="section section--tight">
        <div className="container">
          <h2
            ref={faqRef}
            className={`eyebrow eyebrow--lg reveal-left ${faqShown ? "is-visible" : ""}`}
          >
            Questions fréquentes
          </h2>

          <div className="faq-list">
            {FAQ.map((item, i) => (
              <FaqItem key={item.q} item={item} index={i} />
            ))}
          </div>
        </div>
      </section>
    </main>
  );
}