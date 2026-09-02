import useReveal from "../hooks/useReveal";
import photoAssociation from "../assets/Image3.png";

const ABOUT_ALT = "Deux bénévoles de l'association lors d'un atelier";

export default function About() {
  const [titleRef, titleShown] = useReveal();
  const [cardRef, cardShown] = useReveal();
  const [mediaRef, mediaShown] = useReveal({ threshold: 0.25 });

  return (
    <section className="section section--center" id="association">
      <div className="container">
        <h2
          ref={titleRef}
          className={`section__title reveal ${titleShown ? "is-visible" : ""}`}
        >
          Association Arrobe
        </h2>

        <div className="about__grid">
          <div
            ref={cardRef}
            className={`about__card reveal ${cardShown ? "is-visible" : ""}`}
          >
            <h3>Qui sommes-nous&nbsp;?</h3>

            <p className="about__lead">
              Un espace numérique de proximité au service des particuliers et
              des entreprises de Saint-Germain-sur-Morin.
            </p>

            <p>
              L'association @Rrobe accompagne la population et les acteurs
              locaux dans l'utilisation, l'installation et la maîtrise des
              outils informatiques.
            </p>

            <p>
              Animée par une équipe de passionnés et d'experts, notre mission
              est de vous proposer des solutions performantes, sécurisées et
              adaptées à votre budget, tout en rendant le numérique accessible à
              tous à travers des ateliers collectifs et des formations.
            </p>
          </div>

          <figure
            ref={mediaRef}
            className={`about__media reveal-zoom ${mediaShown ? "is-visible" : ""}`}
            style={{ "--delay": "150ms" }}
          >
            <img src={photoAssociation} alt={ABOUT_ALT} loading="lazy" />
          </figure>
        </div>
      </div>
    </section>
  );
}