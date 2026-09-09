import { useCallback, useEffect, useRef, useState } from "react";

/**
 * Éditeur riche sans dépendance
 * ===================================================================
 * Un div contentEditable piloté par document.execCommand.
 *
 * execCommand est marqué déprécié par la spécification, mais aucun
 * navigateur ne l'a retiré ni ne prévoit de le faire : c'est le socle
 * de tous les éditeurs du web depuis vingt ans. Le remplacer par une
 * bibliothèque coûterait ici plusieurs centaines de kilo-octets pour
 * une barre d'outils de huit boutons.
 *
 * Produit du HTML, stocké tel quel en base et nettoyé par RichText au
 * moment de l'affichage. On ne nettoie pas à la saisie : un nettoyage
 * côté éditeur serait contournable, seul celui de l'affichage compte.
 * Le collage fait exception, voir plus bas.
 * ===================================================================
 */

/** Balises autorisées au collage. Miroir de la liste de RichText. */
const PASTE_TAGS = new Set([
  "P", "BR", "STRONG", "B", "EM", "I", "U", "S",
  "H2", "H3", "H4", "UL", "OL", "LI", "A", "BLOCKQUOTE",
]);

/**
 * Nettoie un fragment collé : retire les balises et attributs non
 * prévus. Sans ça, un copier-coller depuis Word ou un site web injecte
 * des dizaines de `<span style="...">` illisibles dans la base.
 */
function cleanPastedHtml(html) {
  const holder = document.createElement("div");
  holder.innerHTML = html;

  const walk = (node) => {
    for (const child of [...node.children]) {
      walk(child);

      if (!PASTE_TAGS.has(child.tagName)) {
        // On garde le texte, on jette l'enveloppe.
        child.replaceWith(...child.childNodes);
        continue;
      }

      for (const attr of [...child.attributes]) {
        const keep =
          child.tagName === "A" && attr.name === "href" && /^(https?:|mailto:|tel:|\/|#)/i.test(attr.value);
        if (!keep) child.removeAttribute(attr.name);
      }
    }
  };

  walk(holder);
  return holder.innerHTML;
}

function Button({ active, onClick, title, children, disabled }) {
  return (
    <button
      type="button"
      className={`ed__btn ${active ? "is-active" : ""}`}
      // Empêche le div de perdre le focus, donc la sélection, au clic.
      onMouseDown={(e) => e.preventDefault()}
      onClick={onClick}
      title={title}
      aria-label={title}
      aria-pressed={active}
      disabled={disabled}
    >
      {children}
    </button>
  );
}

export default function Editor({ value, onChange, placeholder }) {
  const ref = useRef(null);
  const [active, setActive] = useState({});

  /**
   * On n'écrit dans le DOM que si le contenu diffère vraiment.
   * Réinjecter le HTML à chaque frappe replacerait le curseur au
   * début : c'est le piège classique de contentEditable avec React.
   */
  useEffect(() => {
    const el = ref.current;
    if (el && el.innerHTML !== (value ?? "")) {
      el.innerHTML = value ?? "";
    }
  }, [value]);

  /** Relit l'état des boutons selon la position du curseur. */
  const refreshActive = useCallback(() => {
    if (!ref.current?.contains(document.getSelection()?.anchorNode)) return;

    const block = document.queryCommandValue("formatBlock")?.toLowerCase();
    setActive({
      bold: document.queryCommandState("bold"),
      italic: document.queryCommandState("italic"),
      underline: document.queryCommandState("underline"),
      ul: document.queryCommandState("insertUnorderedList"),
      ol: document.queryCommandState("insertOrderedList"),
      h2: block === "h2",
      h3: block === "h3",
      h4: block === "h4",
      quote: block === "blockquote",
    });
  }, []);

  useEffect(() => {
    document.addEventListener("selectionchange", refreshActive);
    return () => document.removeEventListener("selectionchange", refreshActive);
  }, [refreshActive]);

  const emit = () => onChange(ref.current?.innerHTML ?? "");

  const exec = (command, argument) => {
    ref.current?.focus();
    document.execCommand(command, false, argument);
    emit();
    refreshActive();
  };

  /** Bascule un bloc : recliquer sur « T2 » repasse en paragraphe. */
  const toggleBlock = (tag) => {
    const current = document.queryCommandValue("formatBlock")?.toLowerCase();
    exec("formatBlock", current === tag ? "p" : tag);
  };

  const setLink = () => {
    const selection = document.getSelection();
    if (!selection || selection.isCollapsed) {
      window.alert("Sélectionnez d'abord le texte à transformer en lien.");
      return;
    }
    const url = window.prompt("Adresse du lien :", "https://");
    if (url === null) return;
    if (url.trim() === "") return exec("unlink");
    if (!/^(https?:|mailto:|tel:|\/|#)/i.test(url.trim())) {
      window.alert("Adresse refusée. Utilisez https://, mailto: ou tel:");
      return;
    }
    exec("createLink", url.trim());
  };

  const handlePaste = (e) => {
    e.preventDefault();
    const html = e.clipboardData.getData("text/html");
    const text = e.clipboardData.getData("text/plain");
    if (html) document.execCommand("insertHTML", false, cleanPastedHtml(html));
    else document.execCommand("insertText", false, text);
    emit();
  };

  const handleKeyDown = (e) => {
    // Ctrl+K pour le lien, comme dans la plupart des éditeurs.
    if ((e.ctrlKey || e.metaKey) && e.key.toLowerCase() === "k") {
      e.preventDefault();
      setLink();
    }
  };

  const isEmpty = !value || value === "<br>" || value === "<p></p>";

  return (
    <div className="ed">
      <div className="ed__bar" role="toolbar" aria-label="Mise en forme">
        <Button title="Gras" active={active.bold} onClick={() => exec("bold")}>
          <strong>G</strong>
        </Button>
        <Button title="Italique" active={active.italic} onClick={() => exec("italic")}>
          <em>I</em>
        </Button>
        <Button title="Souligné" active={active.underline} onClick={() => exec("underline")}>
          <u>S</u>
        </Button>

        <span className="ed__sep" />

        {[2, 3, 4].map((level) => (
          <Button
            key={level}
            title={`Titre ${level}`}
            active={active[`h${level}`]}
            onClick={() => toggleBlock(`h${level}`)}
          >
            T{level}
          </Button>
        ))}

        <span className="ed__sep" />

        <Button title="Liste à puces" active={active.ul} onClick={() => exec("insertUnorderedList")}>
          •—
        </Button>
        <Button title="Liste numérotée" active={active.ol} onClick={() => exec("insertOrderedList")}>
          1—
        </Button>
        <Button title="Citation" active={active.quote} onClick={() => toggleBlock("blockquote")}>
          ❝
        </Button>

        <span className="ed__sep" />

        <Button title="Lien (Ctrl+K)" onClick={setLink}>
          🔗
        </Button>
        <Button title="Retirer la mise en forme" onClick={() => exec("removeFormat")}>
          ⌫
        </Button>

        <span className="ed__sep" />

        <Button title="Annuler" onClick={() => exec("undo")}>
          ↶
        </Button>
        <Button title="Rétablir" onClick={() => exec("redo")}>
          ↷
        </Button>
      </div>

      <div className="ed__zone">
        {isEmpty && placeholder && (
          <p className="ed__placeholder" aria-hidden="true">
            {placeholder}
          </p>
        )}
        <div
          ref={ref}
          className="ed__area prose"
          contentEditable
          suppressContentEditableWarning
          role="textbox"
          aria-multiline="true"
          onInput={emit}
          onBlur={emit}
          onPaste={handlePaste}
          onKeyDown={handleKeyDown}
        />
      </div>
    </div>
  );
}
