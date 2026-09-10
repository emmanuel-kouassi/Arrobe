import dotenv from "dotenv";

import { fileURLToPath } from "node:url";
import { dirname, join } from "node:path";

// Chemins absolus : le serveur fonctionne quel que soit le dossier
// depuis lequel on le lance.
const racine = join(dirname(fileURLToPath(import.meta.url)), "..");

// Ordre significatif : le premier fichier gagne sur le second.
dotenv.config({ path: [join(racine, ".env.local"), join(racine, ".env")] });
import { createServer } from "node:http";

import login from "../api/admin/login.js";
import stats from "../api/admin/stats.js";
import articles from "../api/articles/index.js";
import article from "../api/articles/[slug].js";
import events from "../api/events/index.js";
import event from "../api/events/[slug].js";
import register from "../api/events/[slug]/register.js";
import registrations from "../api/events/[slug]/registrations.js";
import upload from "../api/upload.js";

const PORT = Number(process.env.API_PORT ?? 3001);

/**
 * Table de routage explicite plutôt qu'un balayage du dossier :
 * on voit d'un coup d'œil ce qui est exposé, et une route ajoutée par
 * mégarde ne devient pas accessible sans qu'on l'ait décidé.
 *
 * `:slug` capture un segment et le range dans req.query.slug, comme
 * le ferait Vercel avec un fichier [slug].js.
 */
const ROUTES = [
  { pattern: ["api", "admin", "login"], handler: login },
  { pattern: ["api", "admin", "stats"], handler: stats },
  { pattern: ["api", "articles"], handler: articles },
  { pattern: ["api", "articles", ":slug"], handler: article },
  { pattern: ["api", "events"], handler: events },
  { pattern: ["api", "events", ":slug"], handler: event },
  { pattern: ["api", "events", ":slug", "register"], handler: register },
  { pattern: ["api", "events", ":slug", "registrations"], handler: registrations },
    { pattern: ["api", "upload"], handler: upload },
];

function match(segments) {
  for (const route of ROUTES) {
    if (route.pattern.length !== segments.length) continue;

    const params = {};
    let ok = true;

    for (let i = 0; i < route.pattern.length; i++) {
      const part = route.pattern[i];
      if (part.startsWith(":")) {
        params[part.slice(1)] = decodeURIComponent(segments[i]);
      } else if (part !== segments[i]) {
        ok = false;
        break;
      }
    }

    if (ok) return { handler: route.handler, params };
  }
  return null;
}

const server = createServer(async (req, res) => {
  const url = new URL(req.url, `http://${req.headers.host ?? "localhost"}`);
  const segments = url.pathname.split("/").filter(Boolean);

  const found = match(segments);

  if (!found) {
    res.statusCode = 404;
    res.setHeader("Content-Type", "application/json; charset=utf-8");
    res.end(JSON.stringify({ error: "Route inconnue." }));
    return;
  }

  // On reproduit ce que Vercel fournit aux fonctions : req.query
  // contient à la fois les segments dynamiques et la query string.
  req.query = { ...found.params };
  for (const [key, value] of url.searchParams) {
    if (!(key in req.query)) req.query[key] = value;
  }

  try {
    await found.handler(req, res);
  } catch (error) {
    console.error("[serveur] erreur non rattrapée :", error);
    if (!res.headersSent) {
      res.statusCode = 500;
      res.setHeader("Content-Type", "application/json; charset=utf-8");
      res.end(JSON.stringify({ error: "Erreur interne du serveur." }));
    }
  }
});

server.listen(PORT, () => {
  console.log(`\n  API à l'écoute sur http://localhost:${PORT}`);
  console.log("  Routes exposées :");
  for (const route of ROUTES) console.log(`    /${route.pattern.join("/")}`);
  console.log("");
});
