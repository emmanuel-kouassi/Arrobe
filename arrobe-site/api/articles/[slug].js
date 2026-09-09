/**
 * GET    /api/articles/:slug   détail
 * PUT    /api/articles/:slug   modification (admin)
 * DELETE /api/articles/:slug   suppression (admin)
 * ===================================================================
 */

import { prisma } from "../_lib/prisma.js";
import { readAdmin, requireAdmin } from "../_lib/auth.js";
import { route, readJsonBody, sendJson, sendError, getSlug } from "../_lib/http.js";
import { validateArticle } from "../_lib/validate.js";

async function getArticle(req, res) {
  const slug = getSlug(req);
  const admin = await readAdmin(req);

  const article = await prisma.article.findUnique({ where: { slug } });

  // Un brouillon est invisible du public. On renvoie 404 et non 403 :
  // un 403 confirmerait que le slug existe.
  if (!article || (!admin && article.status !== "PUBLISHED")) {
    return sendError(res, 404, "Article introuvable.");
  }

  return sendJson(res, 200, { article });
}

async function updateArticle(req, res) {
  if (!(await requireAdmin(req, res))) return;

  const slug = getSlug(req);
  const body = await readJsonBody(req);
  const check = validateArticle(body, { partial: true });

  if (!check.valid) {
    return sendError(res, 422, "Données invalides.", check.errors);
  }

  const existing = await prisma.article.findUnique({ where: { slug } });
  if (!existing) return sendError(res, 404, "Article introuvable.");

  const data = check.value;

  // Première publication : on horodate. Republication d'un article
  // déjà publié : on conserve la date d'origine, sinon un simple
  // passage en brouillon puis retour le ferait remonter en tête de
  // liste comme s'il était neuf.
  if (data.status === "PUBLISHED" && !existing.publishedAt) {
    data.publishedAt = new Date();
  }

  const article = await prisma.article.update({ where: { slug }, data });
  return sendJson(res, 200, { article });
}

async function deleteArticle(req, res) {
  if (!(await requireAdmin(req, res))) return;

  const slug = getSlug(req);
  const existing = await prisma.article.findUnique({ where: { slug } });
  if (!existing) return sendError(res, 404, "Article introuvable.");

  await prisma.article.delete({ where: { slug } });
  return sendJson(res, 200, { deleted: slug });
}

export default (req, res) =>
  route(req, res, { GET: getArticle, PUT: updateArticle, DELETE: deleteArticle });
