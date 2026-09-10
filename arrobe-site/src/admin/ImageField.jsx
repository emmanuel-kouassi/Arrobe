import { useEffect, useRef, useState } from "react";


import { formatSize, validateImage } from "../lib/uploadImage.js";

/**
 * Champ de sélection d'image avec aperçu immédiat.
 *
 * Composant contrôlé : il n'envoie rien lui-même. Il expose le fichier
 * choisi au parent, qui décide du moment de l'upload — à la soumission
 * du formulaire, pas à la sélection. Un article abandonné ne laisse donc
 * pas d'image orpheline dans le store.
 *
 * @param {object}   props
 * @param {string}   [props.value]      URL déjà enregistrée (mode édition)
 * @param {File}     [props.file]       fichier choisi mais pas encore envoyé
 * @param {Function} props.onChange     (file: File|null) => void
 * @param {boolean}  [props.disabled]   grise le champ pendant l'envoi
 * @param {string}   [props.error]      erreur d'upload remontée par le parent
 */
export default function ImageField({
  id = "image-field-input",
  label = "Image de couverture",
  value,
  file,
  onChange,
  disabled = false,
  error,
}) {
  const inputRef = useRef(null);
  const [previewUrl, setPreviewUrl] = useState(null);
  const [localError, setLocalError] = useState(null);

  // URL.createObjectURL réserve de la mémoire jusqu'à révocation explicite.
  // Sans ce nettoyage, chaque image essayée reste en mémoire tant que
  // l'onglet est ouvert.
  useEffect(() => {
    if (!file) {
      setPreviewUrl(null);
      return;
    }

    const objectUrl = URL.createObjectURL(file);
    setPreviewUrl(objectUrl);

    return () => URL.revokeObjectURL(objectUrl);
  }, [file]);

  function handleChange(event) {
    const choisi = event.target.files?.[0] ?? null;
    setLocalError(null);

    if (!choisi) {
      onChange(null);
      return;
    }

    const invalide = validateImage(choisi);
    if (invalide) {
      setLocalError(invalide);
      onChange(null);
      // Réinitialise l'input : sans ça, resélectionner le même fichier
      // après correction ne déclencherait aucun événement change.
      event.target.value = "";
      return;
    }

    onChange(choisi);
  }

  function handleRemove() {
    setLocalError(null);
    onChange(null);
    if (inputRef.current) inputRef.current.value = "";
  }

  // L'aperçu local prime sur l'image déjà enregistrée : l'admin voit ce
  // qu'il vient de choisir, pas ce qu'il est en train de remplacer.
  const affichage = previewUrl ?? value ?? null;
  const messageErreur = localError ?? error ?? null;

  return (
    <div className="image-field">
      <label className="image-field__label" htmlFor="image-field-input">
        {label}
      </label>

      {affichage && (
        <div className="image-field__preview">
          <img src={affichage} alt="Aperçu de l'image sélectionnée" />
          {file && (
            <p className="image-field__meta">
              {file.name} — {formatSize(file.size)}
              <span className="image-field__badge">Pas encore envoyée</span>
            </p>
          )}
        </div>
      )}

      <div className="image-field__actions">
        <input
          ref={inputRef}
          id="image-field-input"
          type="file"
          accept="image/*"
          onChange={handleChange}
          disabled={disabled}
        />

        {file && (
          <button type="button" onClick={handleRemove} disabled={disabled}>
            Annuler
          </button>
        )}
      </div>

      {messageErreur && (
        <p className="image-field__error" role="alert">
          {messageErreur}
        </p>
      )}

      {!affichage && !messageErreur && (
        <p className="image-field__hint">
          JPG, PNG, WebP, GIF ou AVIF — 4 Mo maximum.
        </p>
      )}
    </div>
  );
}