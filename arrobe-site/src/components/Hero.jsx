/* ===================================================================
   PHOTO DE FOND DU HERO
   Pose ton fichier dans  src/assets/  puis adapte le nom ci-dessous.
   =================================================================== */
import heroAtelier from "../assets/image 7.jpg";

export default function Hero() {
  return (
    <section className="hero" id="accueil">
      <img
        className="hero__bg"
        src={heroAtelier}
        alt=""
        aria-hidden="true"
        fetchPriority="high"
      />

      <div className="hero__veil" />

      <div className="hero__content">
        <h1 className="hero__title">
          Apprenez l'informatique et les nouvelles technologies
          <br />à Saint-Germain-sur-Morin
        </h1>

        <a className="btn btn-lg hero__cta" href="#adhesion">
          Devenir membre
        </a>
      </div>
    </section>
  );
}