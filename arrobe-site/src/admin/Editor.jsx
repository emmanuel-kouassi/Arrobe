import { useCallback, useMemo, useRef } from "react";
import ReactQuill from "react-quill-new";
import "react-quill-new/dist/quill.snow.css";

/**
 * Éditeur riche — Quill 2 via react-quill-new
 * ===================================================================
 * `react-quill` (le paquet d'origine) s'arrête à React 18 : il repose
 * sur findDOMNode, supprimé de React 19. `react-quill-new` est le fork
 * maintenu qui déclare React 19 dans ses dépendances.
 *
 * Produit du HTML, stocké tel quel en base et nettoyé par RichText au
 * moment de l'affichage. La liste blanche de RichText doit rester
 * cohérente avec les FORMATS ci-dessous : un format activé ici mais
 * absent là-bas serait saisi puis perdu à l'affichage.
 * ===================================================================
 */

/**
 * Formats autorisés. Volontairement restreint : couleurs, polices et
 * tailles produiraient des articles au style disparate, incohérents
 * avec la charte du site. L'apparence relève du CSS, pas de la saisie.
 */
const FORMATS = [
  "header",
  "bold",
  "italic",
  "underline",
  "strike",
  "list",
  "blockquote",
  "code-block",
  "link",
  "image",
  "align",
  "indent",
];

export default function Editor({ value, onChange, placeholder }) {
  const quillRef = useRef(null);

  /**
   * Insertion d'image par URL, et non par téléversement.
   *
   * Le bouton image de Quill ouvre par défaut un sélecteur de fichier
   * et encode l'image en base64 DANS le HTML. Une photo de 2 Mo devient
   * ~2,7 Mo de texte stocké dans la colonne `content` : la base gonfle,
   * les requêtes ralentissent, et l'image n'est jamais mise en cache
   * par le navigateur puisqu'elle fait partie de la page.
   *
   * En attendant une vraie route de téléversement, on demande une URL.
   */
  const insertImage = useCallback(() => {
    const editor = quillRef.current?.getEditor();
    if (!editor) return;

    const url = window.prompt(
      "Adresse de l'image.\n\n" +
        "Dépose le fichier dans public/images/ puis saisis son chemin, " +
        "par exemple : /images/articles/atelier.jpg"
    );
    if (!url) return;

    const clean = url.trim();
    if (!/^(https?:\/\/|\/)/i.test(clean)) {
      window.alert("Adresse refusée. Utilise https:// ou un chemin commençant par /");
      return;
    }

    const range = editor.getSelection(true);
    editor.insertEmbed(range.index, "image", clean, "user");
    editor.setSelection(range.index + 1, 0);
  }, []);

  /**
   * Mémorisé : sans useMemo, un nouvel objet à chaque rendu ferait
   * réinitialiser Quill en boucle et le curseur sauterait à chaque
   * frappe. C'est le piège classique de react-quill.
   */
  const modules = useMemo(
    () => ({
      toolbar: {
        container: [
          [{ header: [2, 3, 4, false] }], // h1 reste au titre de la page
          ["bold", "italic", "underline", "strike"],
          [{ list: "bullet" }, { list: "ordered" }],
          ["blockquote", "code-block"],
          [{ align: [] }],
          [{ indent: "-1" }, { indent: "+1" }],
          ["link", "image"],
          ["clean"],
        ],
        handlers: { image: insertImage },
      },
      clipboard: {
        // Réduit la mise en forme parasite d'un collage depuis Word :
        // seuls les FORMATS ci-dessus survivent.
        matchVisual: false,
      },
    }),
    [insertImage]
  );

  return (
    <div className="ed">
      <ReactQuill
        ref={quillRef}
        theme="snow"
        value={value ?? ""}
        onChange={onChange}
        modules={modules}
        formats={FORMATS}
        placeholder={placeholder}
      />
    </div>
  );
}