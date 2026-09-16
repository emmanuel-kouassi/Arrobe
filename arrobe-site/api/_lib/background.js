/**
 * Tâches de fond après une réponse HTTP
 * ===================================================================
 *   runInBackground("newsletter", () => notifySubscribers(...));
 *   return sendJson(res, 200, { article });   // part immédiatement
 *
 * Pour les envois d'e-mails déclenchés par une route : la réponse part
 * sans attendre, et une erreur dans la tâche ne peut jamais la faire
 * échouer.
 *
 * Sur Vercel, une fonction est gelée dès que sa réponse est envoyée :
 * une tâche lancée « en fond » serait coupée en route. waitUntil()
 * demande à Vercel de laisser vivre la fonction jusqu'à la fin de la
 * tâche — dans la limite de sa durée maximale d'exécution. Hors Vercel
 * (serveur local, o2switch), waitUntil() ne fait rien : le processus
 * Node reste en vie et la tâche se termine normalement.
 * ===================================================================
 */

import { waitUntil } from "@vercel/functions";

/**
 * @param {string} label       préfixe des journaux, ex. "newsletter"
 * @param {() => Promise<unknown>} start  lance la tâche
 */
export function runInBackground(label, start) {
  let task;
  try {
    task = Promise.resolve(start()).catch((error) => {
      console.error(`[${label}] échec de la tâche de fond :`, error);
    });
  } catch (error) {
    console.error(`[${label}] impossible de lancer la tâche de fond :`, error);
    return;
  }

  try {
    waitUntil(task);
  } catch (error) {
    // La tâche est déjà partie ; seul le maintien en vie de la fonction
    // Vercel n'a pas pu être demandé.
    console.error(`[${label}] waitUntil indisponible :`, error);
  }
}
