import { useEffect, useState } from "react";
import RichText from "../components/RichText";
import AdminBackBar from "../components/AdminBackBar";
import RegistrationForm from "../components/RegistrationForm";
import { api } from "../lib/api";
import { formatDateTime } from "../lib/format";

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

function PinIcon() {
  return (
    <svg className="detail__icon" viewBox="0 0 24 24" aria-hidden="true">
      <path
        d="M12 21s7-5.6 7-11a7 7 0 10-14 0c0 5.4 7 11 7 11z"
        fill="none"
        stroke="currentColor"
        strokeWidth="1.8"
      />
      <circle cx="12" cy="10" r="2.6" fill="none" stroke="currentColor" strokeWidth="1.8" />
    </svg>
  );
}

function ClockIcon() {
  return (
    <svg className="detail__icon" viewBox="0 0 24 24" aria-hidden="true">
      <circle cx="12" cy="12" r="9" fill="none" stroke="currentColor" strokeWidth="1.8" />
      <path
        d="M12 7v5.3l3.4 2"
        fill="none"
        stroke="currentColor"
        strokeWidth="1.8"
        strokeLinecap="round"
      />
    </svg>
  );
}

export default function EventDetail({ slug }) {
  const [event, setEvent] = useState(null);
  const [state, setState] = useState("loading");
  const [error, setError] = useState("");

  // Changement de slug pendant le rendu : on remet l'état à zéro sans
  // passer par un effet, motif recommandé par React. Sinon l'ancien
  // contenu resterait affiché pendant le chargement du nouveau.
  const [lastSlug, setLastSlug] = useState(slug);
  if (slug !== lastSlug) {
    setLastSlug(slug);
    setState("loading");
    setError("");
  }

  useEffect(() => {
    let cancelled = false;

    api
      .getEvent(slug)
      .then((data) => {
        if (cancelled) return;
        setEvent(data);
        setState("ready");
      })
      .catch((err) => {
        if (cancelled) return;
        setError(err.message);
        setState(err.status === 404 ? "missing" : "error");
      });

    return () => {
      cancelled = true;
    };
  }, [slug]);

  const scrollToForm = (e) => {
    e.preventDefault();
    document
      .getElementById("inscription")
      ?.scrollIntoView({ behavior: "smooth", block: "start" });
  };

  if (state === "loading") {
    return (
      <main className="detail">
      <AdminBackBar to="#/administration/evenements" label="Retour aux événements" />
        <div className="container">
          <p className="empty">Chargement de l'événement…</p>
        </div>
      </main>
    );
  }

  if (state !== "ready") {
    return (
      <main className="detail">
      <AdminBackBar to="#/administration/evenements" label="Retour aux événements" />
        <div className="container">
          <p className="empty">
            <span className="empty__title">
              {state === "missing" ? "Événement introuvable" : "Chargement impossible"}
            </span>
            {state === "missing"
              ? "Cet événement n'existe pas ou n'est plus publié."
              : error}
          </p>
          <p className="detail__back-empty">
            <a className="btn" href="#/evenement">
              Retour aux événements
            </a>
          </p>
        </div>
      </main>
    );
  }

  // `isPast` est calculé par l'API à la lecture, jamais stocké : un
  // événement bascule tout seul le jour venu.
  const isPast = event.isPast;
  const hasRecap = Boolean(event.recap && event.recap.trim());

  return (
    <main className="detail">
      <AdminBackBar to="#/administration/evenements" label="Retour aux événements" />
      <header className="detail__hero">
        <div className="container">
          <a className="back" href="#/evenement">
            <ArrowLeft />
            Tous les événements
          </a>

          <p className="detail__eyebrow">{event.category}</p>
          <h1 className="detail__title">{event.title}</h1>

          <p className="detail__meta">
            <span>
              <ClockIcon />
              {formatDateTime(event.date)}
            </span>
            <span>
              <PinIcon />
              {event.location}
            </span>
            <span>Organisé par {event.organizer}</span>
          </p>

          {/* Le bouton d'inscription n'existe que pour un événement à
              venir. Passé, il n'aurait aucun sens : l'API refuserait
              l'inscription avec un 409. */}
          {isPast ? (
            <p className="detail__closed">Cet événement est terminé.</p>
          ) : (
            <a className="btn btn-lg" href="#inscription" onClick={scrollToForm}>
              S'inscrire
            </a>
          )}
        </div>
      </header>

      <div className="container">
        {event.image && (
          <figure className="detail__media">
            <img src={event.image} alt="" loading="lazy" />
          </figure>
        )}

        <p className="detail__excerpt">{event.description}</p>

        {/* Événement passé avec compte rendu : c'est lui qu'on montre,
            le programme n'a plus d'intérêt. Sans compte rendu, on
            retombe sur le programme, précédé de sa mention. */}
        {isPast && hasRecap ? (
          <>
            <h2 className="detail__section-title">Retour sur l'événement</h2>
            <RichText html={event.recap} />
          </>
        ) : (
          <>
            {isPast && (
              <p className="detail__notice">
                Cet événement est terminé. Le compte rendu n'a pas encore été
                publié&nbsp;; voici le programme qui avait été annoncé.
              </p>
            )}
            <RichText html={event.content} />
          </>
        )}
      </div>

      {!isPast && <RegistrationForm slug={event.slug} title={event.title} />}
    </main>
  );
}