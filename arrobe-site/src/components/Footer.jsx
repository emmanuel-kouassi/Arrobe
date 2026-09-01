import useReveal from "../hooks/useReveal";

const SERVICES = [
  { label: "Accueil", href: "#/" },
  { label: "Evenement", href: "#/evenement" },
  { label: "Blog", href: "#/blog" },
  { label: "Se connecter", href: "#/connexion" },
  { label: "Devenir membre", href: "#/adhesion" },
];

export default function Footer() {
  const [ref, shown] = useReveal({ threshold: 0.2 });

  return (
    <footer className="footer" id="pied-de-page">
      <div className="container">
        <div className="footer__grid" ref={ref}>
          <div className={`reveal ${shown ? "is-visible" : ""}`}>
            <h3>Nos produits &amp; Services</h3>
            <ul>
              {SERVICES.map((item) => (
                <li key={item.label}>
                  <a href={item.href}>{item.label}</a>
                </li>
              ))}
            </ul>
          </div>

          <div
            className={`reveal ${shown ? "is-visible" : ""}`}
            style={{ "--delay": "140ms" }}
          >
            <h3>Rejoignez-nous</h3>
            <ul>
              <li>
                <a href="#/contact">Contact</a>
              </li>
              <li>
                <a href="mailto:association.arrobe@sfr.fr">
                  association.arrobe@sfr.fr
                </a>
              </li>
            </ul>
          </div>
        </div>

        <p className="footer__bottom">
          © {new Date().getFullYear()} Association @Rrobe — Saint-Germain-sur-Morin
        </p>
      </div>
    </footer>
  );
}