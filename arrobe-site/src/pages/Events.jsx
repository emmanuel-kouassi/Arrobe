import { useEffect, useState } from "react";
import useReveal from "../hooks/useReveal";
import EventCard from "../components/EventCard";
import { api } from "../lib/api";
import atelierPleinAir from "../assets/Image8.jpg";

const INTRO_ALT = "Atelier informatique en plein air lors de la fête du village";

/**
 * Affiché à la place de la grille quand la liste est vide.
 * Tant que la base est neuve, c'est ce que verront les visiteurs.
 */
function EmptyState({ children }) {
  return (
    <p className="empty">
      <span className="empty__title">Aucun événement pour le moment</span>
      {children}
    </p>
  );
}

/**
 * Rend une section : chargement, erreur, liste vide ou cartes.
 * Les quatre états sont traités au même endroit pour qu'aucun ne
 * puisse être oublié.
 */
function EventSection({ state, events, cta, emptyText, error }) {
  if (state === "loading") {
    return <p className="empty">Chargement des événements…</p>;
  }
  if (state === "error") {
    return (
      <p className="empty">
        <span className="empty__title">Chargement impossible</span>
        {error}
      </p>
    );
  }
  if (events.length === 0) {
    return <EmptyState>{emptyText}</EmptyState>;
  }
  return (
    <div className="event-grid">
      {events.map((event, i) => (
        <EventCard key={event.id} event={event} cta={cta} index={i} />
      ))}
    </div>
  );
}

export default function Events() {
  // « à venir » / « passés » viennent déjà séparés par l'API, qui
  // compare la date de chaque événement à l'instant de la requête.
  const [upcoming, setUpcoming] = useState([]);
  const [past, setPast] = useState([]);
  const [state, setState] = useState("loading");
  const [error, setError] = useState("");

  useEffect(() => {
    let cancelled = false;

    api
      .listEvents()
      .then((data) => {
        if (cancelled) return;
        setUpcoming(data.upcoming);
        setPast(data.past);
        setState("ready");
      })
      .catch((err) => {
        if (cancelled) return;
        setError(err.message);
        setState("error");
      });

    // Évite un setState sur un composant démonté si l'utilisateur
    // change de page pendant le chargement.
    return () => {
      cancelled = true;
    };
  }, []);

  const [titleRef, titleShown] = useReveal();
  const [imgRef, imgShown] = useReveal({ threshold: 0.2 });
  const [textRef, textShown] = useReveal({ threshold: 0.2 });
  const [nextRef, nextShown] = useReveal();
  const [pastRef, pastShown] = useReveal();

  return (
    <main className="events">
      <section className="section events__head">
        <div className="container">
          <h1
            ref={titleRef}
            className={`events__title reveal ${titleShown ? "is-visible" : ""}`}
          >
            Nos Evenements
          </h1>

          <div className="events__intro">
            <figure
              ref={imgRef}
              className={`events__photo reveal-zoom ${imgShown ? "is-visible" : ""}`}
            >
              <img src={atelierPleinAir} alt={INTRO_ALT} />
            </figure>

            <div
              ref={textRef}
              className={`events__pitch reveal ${textShown ? "is-visible" : ""}`}
              style={{ "--delay": "160ms" }}
            >
              <h2 className="events__pitch-title">
                <span className="events__amp" aria-hidden="true">
                  &amp;
                </span>
                <span className="events__pitch-line1">Nos rendez-vous</span>
                <span className="events__pitch-line2">Ateliers pratiques</span>
              </h2>

              <p>
                Tout au long de l'année, l'association propose des ateliers
                collectifs et des moments d'échange pour vous former à votre
                rythme. Que vous souhaitiez sécuriser vos équipements, vous
                initier à l'impression 3D ou poser vos questions du quotidien,
                découvrez nos prochaines dates et venez nous rencontrer à
                Saint-Germain-sur-Morin&nbsp;!
              </p>
            </div>
          </div>
        </div>
      </section>

      <section className="section section--tight" id="prochains">
        <div className="container">
          <h2
            ref={nextRef}
            className={`eyebrow eyebrow--lg reveal-left ${nextShown ? "is-visible" : ""}`}
          >
            Prochain évènement
          </h2>

          <EventSection
            state={state}
            events={upcoming}
            cta="Voir"
            error={error}
            emptyText="Aucun événement à venir pour le moment. Revenez bientôt, les prochains ateliers seront annoncés ici."
          />
        </div>
      </section>

      <section className="section section--tight" id="passes">
        <div className="container">
          <h2
            ref={pastRef}
            className={`eyebrow eyebrow--lg reveal-left ${pastShown ? "is-visible" : ""}`}
          >
            Evenement passés
          </h2>

          <EventSection
            state={state}
            events={past}
            cta="Voir"
            error={error}
            emptyText="Les événements déjà passés apparaîtront ici une fois la date écoulée."
          />
        </div>
      </section>
    </main>
  );
}