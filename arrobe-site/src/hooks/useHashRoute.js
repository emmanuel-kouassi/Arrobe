import { useEffect, useState } from "react";

/**
 * Mini-routeur basé sur le hash de l'URL.
 *   #/          -> "/"
 *   #/evenement -> "/evenement"
 *
 * Aucune dépendance à installer. Si un jour tu veux de vraies URL
 * (/evenement au lieu de #/evenement), tu remplaceras ce hook par
 * react-router-dom sans toucher aux pages.
 */
export default function useHashRoute() {
  const read = () => window.location.hash.replace(/^#/, "") || "/";
  const [route, setRoute] = useState(read);

  useEffect(() => {
    const onChange = () => {
      setRoute(read());
      window.scrollTo({ top: 0, behavior: "auto" });
    };
    window.addEventListener("hashchange", onChange);
    return () => window.removeEventListener("hashchange", onChange);
  }, []);

  return route;
}