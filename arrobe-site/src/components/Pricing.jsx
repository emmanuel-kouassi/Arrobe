import useReveal from "../hooks/useReveal";

const BENEFITS = [
  "Maintenir au mieux de sa forme son PC",
  "Maîtriser sa boîte mail",
  "Naviguer sur Internet",
  "Reconnaître les faux sites, les mails frauduleux",
  "Créer un diaporama avec musique",
  "Installer et utiliser les logiciels libres",
  "S'initier à l'impression 3D",
  "Maîtriser vos démarches sur le web",
];

function CheckIcon() {
  return (
    <svg className="pricing__check" viewBox="0 0 24 24" aria-hidden="true">
      <circle
        cx="12"
        cy="12"
        r="10"
        fill="none"
        stroke="currentColor"
        strokeWidth="1.8"
      />
      <path
        d="M7.5 12.4l3 3 6-6.4"
        fill="none"
        stroke="currentColor"
        strokeWidth="2"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  );
}

export default function Pricing() {
  const [titleRef, titleShown] = useReveal();
  const [cardRef, cardShown] = useReveal({ threshold: 0.12 });

  return (
    <section className="section" id="adhesion">
      <div className="container">
        <p
          ref={titleRef}
          className={`eyebrow reveal-left ${titleShown ? "is-visible" : ""}`}
        >
          Tarifs &amp; Adhésion
        </p>

        <div
          ref={cardRef}
          className={`pricing__card reveal ${cardShown ? "is-visible" : ""}`}
        >
          <div className="pricing__head">
            <h2 className="pricing__name">ADHESION ANNUELLE</h2>
            <p className="pricing__price">25&nbsp;€/an</p>

            <a className="btn btn-lg" href="#inscription">
              Devenir membre
            </a>
          </div>

          <ul className="pricing__list">
            {BENEFITS.map((benefit, i) => (
              <li
                key={benefit}
                className="pricing__item"
                style={{ "--delay": `${250 + i * 85}ms` }}
              >
                <CheckIcon />
                <span>{benefit}</span>
              </li>
            ))}
          </ul>
        </div>
      </div>
    </section>
  );
}