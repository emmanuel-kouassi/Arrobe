import { useCallback, useMemo, useRef, useState } from "react";
import ReactQuill from "react-quill-new";
import "react-quill-new/dist/quill.snow.css";

import { uploadImage } from "../lib/uploadImage.js";

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
  const fileInputRef = useRef(null);
  const [uploading, setUploading] = useState(false);

  /**
   * Téléversement direct depuis l'ordinateur.
   *
   * On garde la main sur le sélecteur de fichier plutôt que de laisser
   * faire Quill : son comportement par défaut encode l'image en base64
   * DANS le HTML. Une photo de 2 Mo devient ~2,7 Mo de texte stocké
   * dans la colonne `content` — la base gonfle, les requêtes ralentissent
   * et l'image n'est jamais mise en cache par le navigateur.
   *
   * Ici le fichier part vers Vercel Blob et seule son URL est insérée.
   */
  const openFilePicker = useCallback(() => {
    fileInputRef.current?.click();
  }, []);

  const handleFile = useCallback(async (event) => {
    const file = event.target.files?.[0];
    // Réinitialisé tout de suite : sans ça, resélectionner le même
    // fichier après une erreur ne déclencherait aucun événement change.
    event.target.value = "";
    if (!file) return;

    const editor = quillRef.current?.getEditor();
    if (!editor) return;

    // Position mémorisée AVANT l'attente réseau : l'insertion doit se
    // faire là où l'admin a cliqué, pas là où le curseur a pu dériver.
    const range = editor.getSelection(true) ?? { index: editor.getLength() };

    setUploading(true);
    // Éditeur gelé pendant l'envoi : une frappe décalerait la position
    // mémorisée et l'image atterrirait au mauvais endroit.
    editor.enable(false);

    try {
      const url = await uploadImage(file);
      editor.enable(true);
      editor.insertEmbed(range.index, "image", url, "user");
      editor.setSelection(range.index + 1, 0);
    } catch (error) {
      editor.enable(true);
      window.alert(error.message);
    } finally {
      setUploading(false);
    }
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
        handlers: { image: openFilePicker },
      },
      clipboard: {
        // Réduit la mise en forme parasite d'un collage depuis Word :
        // seuls les FORMATS ci-dessus survivent.
        matchVisual: false,
      },
    }),
    [openFilePicker]
  );

  return (
    <div className="ed" aria-busy={uploading}>
      <input
        ref={fileInputRef}
        type="file"
        accept="image/*"
        onChange={handleFile}
        style={{ display: "none" }}
        tabIndex={-1}
      />

      <ReactQuill
        ref={quillRef}
        theme="snow"
        value={value ?? ""}
        onChange={onChange}
        modules={modules}
        formats={FORMATS}
        placeholder={placeholder}
      />

      {uploading && (
        <p className="ed__status" role="status">
          Envoi de l'image en cours…
        </p>
      )}
    </div>
  );
}