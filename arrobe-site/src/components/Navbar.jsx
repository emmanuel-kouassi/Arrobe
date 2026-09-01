import { useEffect, useState } from "react";

/* ===================================================================
   TON LOGO
   Pose ton fichier dans  src/assets/  puis adapte le nom ci-dessous.
   =================================================================== */
import logoIcone from "../assets/logo_icone.png";

const LOGO_ALT = "Logo de l'association @Rrobe";

const LINKS = [
  { label: "Accueil", href: "#/" },
  { label: "Evenement", href: "#/evenement" },
  { label: "Blog", href: "#/blog" },
  { label: "Contact", href: "#/contact" },
];

export default function Navbar({ route = "/" }) {
  const [scrolled, setScrolled] = useState(false);
  const [open, setOpen] = useState(false);

  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 20);
    onScroll();
    window.addEventListener("scroll", onScroll, { passive: true });
    return () => window.removeEventListener("scroll", onScroll);
  }, []);

  const isActive = (link) => {
    if (link.scrollTo) return false;
    if (link.href === "#/") return route === "/";
    return route.startsWith(link.href.replace("#", ""));
  };

  // Blog et Contact restent sur la page en cours et défilent vers la section.
  const handleClick = (link) => (e) => {
    setOpen(false);
    if (!link.scrollTo) return;
    e.preventDefault();
    document
      .getElementById(link.scrollTo)
      ?.scrollIntoView({ behavior: "smooth", block: "start" });
  };

  return (
    <header
      className={`nav ${scrolled ? "is-scrolled" : ""} ${open ? "is-open" : ""}`}
    >
      <div className="nav__inner">
        <a className="nav__logo" href="#/" aria-label="Retour à l'accueil">
          <img src={logoIcone} alt={LOGO_ALT} />
        </a>

        <nav aria-label="Navigation principale">
          <ul className="nav__links" id="menu-principal">
            {LINKS.map((link) => (
              <li key={link.label}>
                <a
                  className={`nav__link ${isActive(link) ? "is-active" : ""}`}
                  href={link.href}
                  onClick={handleClick(link)}
                >
                  {link.label}
                </a>
              </li>
            ))}
            {!route.startsWith("/connexion") && (
              <li>
                <a
                  className="btn"
                  href="#/connexion"
                  onClick={() => setOpen(false)}
                >
                  Se connecter
                </a>
              </li>
            )}
          </ul>
        </nav>

        <button
          className="nav__burger"
          aria-label={open ? "Fermer le menu" : "Ouvrir le menu"}
          aria-expanded={open}
          aria-controls="menu-principal"
          onClick={() => setOpen((v) => !v)}
        >
          <span />
          <span />
          <span />
        </button>
      </div>
    </header>
  );
}