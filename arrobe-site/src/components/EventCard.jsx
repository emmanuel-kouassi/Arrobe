import useReveal from "../hooks/useReveal";

/**
 * Une carte événement : pastille de date à gauche, visuel + infos à droite.
 *
 * props :
 *   event   -> objet venant de src/data/events.js
 *   cta     -> texte du bouton ("S'inscrire" ou "Voir")
 *   index   -> position dans la liste, sert au décalage de l'animation
 */
export default function EventCard({ event, cta = "S'inscrire", index = 0 }) {
  const [ref, shown] = useReveal({ threshold: 0.15 });

  return (
    <article
      ref={ref}
      className={`event reveal ${shown ? "is-visible" : ""}`}
      style={{ "--delay": `${index * 140}ms` }}
    >
      <div className="event__date" aria-hidden="true">
        <span className="event__day">{event.day}</span>
        <span className="event__month">{event.month}</span>
        <span className="event__year">{event.year}</span>
      </div>

      <div className="event__card">
        <div className="event__media">
          {event.image ? (
            <img src={event.image} alt={event.title} loading="lazy" />
          ) : (
            <div className="event__media--empty" aria-hidden="true" />
          )}
        </div>

        <div className="event__body">
          <h3 className="event__title">{event.title}</h3>
          <p className="event__organizer">Organisateur : {event.organizer}</p>

          <p className="event__meta">
            {event.place}
            <br />
            {event.schedule}
          </p>

          <a className="btn-outline" href={`#/evenement/${event.id}`}>
            {cta}
          </a>
        </div>
      </div>
    </article>
  );
}