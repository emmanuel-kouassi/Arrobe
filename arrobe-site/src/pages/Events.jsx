import useReveal from "../hooks/useReveal";
import EventCard from "../components/EventCard";
import { UPCOMING_EVENTS, PAST_EVENTS } from "../data/events";

/* ===================================================================
   PHOTO D'INTRODUCTION DE LA PAGE ÉVÉNEMENTS
   Pose ton fichier dans  src/assets/  puis adapte le nom ci-dessous.
   =================================================================== */
import atelierPleinAir from "../assets/Image 8.jpg";

const INTRO_ALT = "Atelier informatique en plein air lors de la fête du village";

export default function Events() {
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

          <div className="event-grid">
            {UPCOMING_EVENTS.map((event, i) => (
              <EventCard
                key={event.id}
                event={event}
                cta="S'inscrire"
                index={i}
              />
            ))}
          </div>
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

          <div className="event-grid">
            {PAST_EVENTS.map((event, i) => (
              <EventCard key={event.id} event={event} cta="Voir" index={i} />
            ))}
          </div>
        </div>
      </section>
    </main>
  );
}