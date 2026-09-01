import { useEffect, useRef, useState } from "react";

/**
 * Déclenche une animation quand l'élément entre dans l'écran.
 *
 *   const [ref, visible] = useReveal();
 *   <div ref={ref} className={`reveal ${visible ? "is-visible" : ""}`}>…</div>
 */
export default function useReveal({ threshold = 0.18, once = true } = {}) {
  const ref = useRef(null);
  const [visible, setVisible] = useState(false);

  useEffect(() => {
    const el = ref.current;
    if (!el) return;

    // Navigateur trop ancien : on affiche tout de suite.
    if (typeof IntersectionObserver === "undefined") {
      setVisible(true);
      return;
    }

    const observer = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting) {
          setVisible(true);
          if (once) observer.unobserve(el);
        } else if (!once) {
          setVisible(false);
        }
      },
      { threshold, rootMargin: "0px 0px -12% 0px" }
    );

    observer.observe(el);
    return () => observer.disconnect();
  }, [threshold, once]);

  return [ref, visible];
}