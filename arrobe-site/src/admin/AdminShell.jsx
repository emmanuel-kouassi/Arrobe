import { useEffect, useState } from "react";
import { logout } from "../lib/api";
import {
  IconDashboard,
  IconArticle,
  IconCalendar,
  IconList,
  IconLogout,
  IconMenu,
} from "./icons";

/**
 * Coquille de l'administration : barre latérale + zone de contenu.
 * ===================================================================
 * Sur mobile, la barre latérale devient un tiroir déclenché par un
 * bouton. Elle n'est pas simplement empilée au-dessus du contenu :
 * cinq entrées de menu à faire défiler avant d'atteindre la page
 * seraient pénibles à chaque navigation.
 * ===================================================================
 */

const SECTIONS = [
  { id: "", label: "Tableau de bord", Icon: IconDashboard },
  { id: "articles", label: "Articles", Icon: IconArticle },
  { id: "evenements", label: "Événements", Icon: IconCalendar },
  { id: "inscriptions", label: "Inscriptions", Icon: IconList },
];

export default function AdminShell({ section, identifiant, children }) {
  const [open, setOpen] = useState(false);

  // Le tiroir se referme quand on change de page.
  const [lastSection, setLastSection] = useState(section);
  if (section !== lastSection) {
    setLastSection(section);
    setOpen(false);
  }

  useEffect(() => {
    if (!open) return;
    const onKey = (e) => e.key === "Escape" && setOpen(false);
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [open]);

  const handleLogout = () => {
    logout();
    window.location.hash = "#/connexion";
  };

  return (
    <div className={`adm ${open ? "is-open" : ""}`}>
      <button
        className="adm__burger"
        type="button"
        aria-label="Ouvrir le menu d'administration"
        aria-expanded={open}
        onClick={() => setOpen((v) => !v)}
      >
        <IconMenu />
      </button>

      {/* Voile cliquable derrière le tiroir, sur mobile seulement. */}
      {open && (
        <div className="adm__veil" onClick={() => setOpen(false)} aria-hidden="true" />
      )}

      <aside className="adm__side">
        <p className="adm__brand">Arrobe admin</p>

        <nav className="adm__nav" aria-label="Sections de l'administration">
          {SECTIONS.map(({ id, label, Icon }) => (
            <a
              key={id || "dashboard"}
              className={`adm__link ${section === id ? "is-active" : ""}`}
              href={`#/administration${id ? `/${id}` : ""}`}
              aria-current={section === id ? "page" : undefined}
            >
              <Icon />
              {label}
            </a>
          ))}
        </nav>

        <div className="adm__side-foot">
          {identifiant && <p className="adm__who">Connecté : {identifiant}</p>}
          <button className="adm__link adm__logout" type="button" onClick={handleLogout}>
            <IconLogout />
            Déconnexion
          </button>
        </div>
      </aside>

      <main className="adm__main">{children}</main>
    </div>
  );
}
