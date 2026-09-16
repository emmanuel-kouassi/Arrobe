import { useEffect, useId, useRef } from "react";
import { createPortal } from "react-dom";

/**
 * Fenêtre modale du site.
 * ===================================================================
 * Construite sur l'élément natif <dialog> ouvert avec showModal(). Le
 * navigateur fournit alors gratuitement ce qu'il faudrait sinon coder
 * et tester à la main : le focus enfermé dans la fenêtre, la touche
 * Échap, l'arrière-plan rendu inerte pour les lecteurs d'écran, et le
 * retour du focus sur le bouton d'origine à la fermeture.
 *
 * Rendue dans <body> via un portail : placée dans une section, elle en
 * hériterait les styles (les h2 et p de .newsletter, par exemple).
 *
 *   <Modal open={open} onClose={() => setOpen(false)} title="…">
 *     <p>Contenu</p>
 *   </Modal>
 * ===================================================================
 */
export default function Modal({ open, onClose, title, children, closeLabel = "Fermer" }) {
  const dialogRef = useRef(null);
  const pressStartedOnBackdrop = useRef(false);
  const titleId = useId();

  // L'état React pilote le <dialog>, jamais l'inverse.
  useEffect(() => {
    const dialog = dialogRef.current;
    if (!dialog) return;
    if (open && !dialog.open) dialog.showModal();
    if (!open && dialog.open) dialog.close();
  }, [open]);

  // Un clic sur le voile referme la fenêtre. Le clic arrive alors sur
  // le <dialog> lui-même, le contenu étant dans un enfant. On vérifie
  // aussi où le clic a commencé : sélectionner du texte dans la fenêtre
  // et relâcher sur le voile ne doit pas la fermer.
  const handlePointerDown = (event) => {
    pressStartedOnBackdrop.current = event.target === dialogRef.current;
  };
  const handleClick = (event) => {
    if (pressStartedOnBackdrop.current && event.target === dialogRef.current) {
      onClose();
    }
  };

  return createPortal(
    <dialog
      ref={dialogRef}
      className="modal"
      aria-labelledby={titleId}
      // Échap déclenche « close » : on resynchronise l'état React.
      onClose={onClose}
      onPointerDown={handlePointerDown}
      onClick={handleClick}
    >
      {open && (
        <div className="modal__body">
          <h2 className="modal__title" id={titleId}>
            {title}
          </h2>
          <div className="modal__content">{children}</div>
          <div className="modal__actions">
            {/* autoFocus : showModal() place le focus ici, l'action
                attendue, plutôt que sur le premier lien du contenu. */}
            <button type="button" className="btn modal__close" onClick={onClose} autoFocus>
              {closeLabel}
            </button>
          </div>
        </div>
      )}
    </dialog>,
    document.body
  );
}
