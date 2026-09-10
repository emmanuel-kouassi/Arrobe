import { ApiError, getToken } from "./api.js";

/**
 * Envoi d'une image vers /api/upload.
 *
 * Le fichier part en corps binaire brut : pas de FormData, le type MIME
 * voyage dans Content-Type et le nom d'origine en query string. C'est ce
 * qu'attend la route serveur.
 *
 * Le wrapper `request` de api.js n'est pas réutilisable ici : il sérialise
 * le corps en JSON. On refait donc l'appel à la main, mais on emprunte sa
 * session (getToken) et son type d'erreur (ApiError) pour que les erreurs
 * d'upload se traitent comme les autres.
 */

export const MAX_SIZE = 4 * 1024 * 1024;

export const ALLOWED_TYPES = [
  "image/jpeg",
  "image/png",
  "image/webp",
  "image/gif",
  "image/avif",
];

/**
 * Validation locale, miroir de celle du serveur.
 *
 * Elle ne remplace pas le contrôle serveur — seule barrière réelle — mais
 * elle évite d'envoyer 4 Mo pour rien et donne un retour instantané.
 *
 * @returns {string|null} le message d'erreur, ou null si le fichier est bon
 */
export function validateImage(file) {
  if (!file) return "Aucun fichier sélectionné.";

  if (!ALLOWED_TYPES.includes(file.type)) {
    return "Format non supporté. Utilise JPG, PNG, WebP, GIF ou AVIF.";
  }

  if (file.size === 0) return "Le fichier est vide.";

  if (file.size > MAX_SIZE) {
    const mo = (file.size / 1024 / 1024).toFixed(1);
    return `Image trop lourde (${mo} Mo). Maximum : 4 Mo.`;
  }

  return null;
}

/** Formate une taille en octets pour l'affichage : 214503 -> "210 Ko" */
export function formatSize(octets) {
  if (octets < 1024) return `${octets} o`;
  if (octets < 1024 * 1024) return `${Math.round(octets / 1024)} Ko`;
  return `${(octets / 1024 / 1024).toFixed(1)} Mo`;
}

/**
 * Envoie le fichier et renvoie l'URL publique Vercel Blob.
 *
 * @param {File} file
 * @param {{ signal?: AbortSignal }} [options]
 * @returns {Promise<string>} l'URL publique
 * @throws {ApiError} avec un message directement affichable à l'admin
 */
export async function uploadImage(file, { signal } = {}) {
  const invalide = validateImage(file);
  if (invalide) throw new ApiError(invalide, 400);

  const token = getToken();
  const url = `/api/upload?filename=${encodeURIComponent(file.name)}`;

  let response;
  try {
    response = await fetch(url, {
      method: "POST",
      headers: {
        "Content-Type": file.type,
        ...(token ? { Authorization: `Bearer ${token}` } : {}),
      },
      body: file,
      signal,
    });
  } catch (error) {
    if (error.name === "AbortError") throw error;
    throw new ApiError("Connexion impossible. Vérifie ta connexion internet.", 0);
  }

  let data = {};
  try {
    data = await response.json();
  } catch {
    // Réponse non-JSON : on retombe sur le message générique ci-dessous.
  }

  if (!response.ok) {
    if (response.status === 401) {
      throw new ApiError("Session expirée. Reconnecte-toi et réessaie.", 401);
    }
    throw new ApiError(
      data.error ?? `L'envoi a échoué (erreur ${response.status}).`,
      response.status,
      data.details,
    );
  }

  if (!data.url) throw new ApiError("Réponse inattendue du serveur.", 502);

  return data.url;
}