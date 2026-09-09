/**
 * GET  /api/articles   liste
 * POST /api/articles   création (admin)
 * ===================================================================
 * Public  : uniquement les articles PUBLISHED, du plus récent au plus
 *           ancien selon publishedAt.
 * Admin   : tout, brouillons compris, triés par dernière modification
 *           — publishedAt étant null sur un brouillon, trier dessus
 *           remonterait les brouillons n'importe où.
 * ===================================================================
 */

import { prisma } from "../_lib/prisma.js";
import { readAdmin, requireAdmin } from "../_lib/auth.js";
import { route, readJsonBody, sendJson, sendError, getQuery } from "../_lib/http.js";
import { validateArticle, slugify } from "../_lib/validate.js";

/** Champs renvoyés en liste : inutile de transporter tout le HTML. */
const LIST_FIELDS = {
  id: true,
  slug: true,
  title: true,
  excerpt: true,
  image: true,
  category: true,
  readingTime: true,
  status: true,
  publishedAt: true,
  updatedAt: true,
};

async function listArticles(req, res) {
  const admin = await readAdmin(req);
  const category = getQuery(req, "category");

  const where = {};
  if (!admin) where.status = "PUBLISHED";
  if (category && category !== "all") where.category = category;

  const articles = await prisma.article.findMany({
    where,
    select: LIST_FIELDS,
    orderBy: admin ? { updatedAt: "desc" } : { publishedAt: "desc" },
  });

  // Base vide : tableau vide, code 200. Pas une erreur.
  return sendJson(res, 200, { articles });
}

async function createArticle(req, res) {
  if (!(await requireAdmin(req, res))) return;

  const body = await readJsonBody(req);
  const check = validateArticle(body);

  if (!check.valid) {
    return sendError(res, 422, "Données invalides.", check.errors);
  }

  const data = check.value;
  data.slug = data.slug ?? slugify(data.title);

  // publishedAt n'est renseignée qu'au moment réel de la publication.
  data.publishedAt = data.status === "PUBLISHED" ? new Date() : null;

  const article = await prisma.article.create({ data });

  res.setHeader("Location", `/api/articles/${article.slug}`);
  return sendJson(res, 201, { article });
}

export default (req, res) =>
  route(req, res, { GET: listArticles, POST: createArticle });
