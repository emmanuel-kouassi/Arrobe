import { useEffect, useState } from "react";
import RichText from "../components/RichText";
import { api } from "../lib/api";
import { formatLongDate } from "../lib/format";

function ArrowLeft() {
  return (
    <svg className="back__icon" viewBox="0 0 24 24" aria-hidden="true">
      <path
        d="M14.5 5.5L8 12l6.5 6.5"
        fill="none"
        stroke="currentColor"
        strokeWidth="2"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  );
}

export default function ArticleDetail({ slug }) {
  const [article, setArticle] = useState(null);
  const [state, setState] = useState("loading");
  const [error, setError] = useState("");

  // Changement de slug pendant le rendu : on remet l'état à zéro sans
  // passer par un effet, motif recommandé par React. Sinon l'ancien
  // contenu resterait affiché pendant le chargement du nouveau.
  const [lastSlug, setLastSlug] = useState(slug);
  if (slug !== lastSlug) {
    setLastSlug(slug);
    setState("loading");
    setError("");
  }

  useEffect(() => {
    let cancelled = false;

    api
      .getArticle(slug)
      .then((data) => {
        if (cancelled) return;
        setArticle(data);
        setState("ready");
      })
      .catch((err) => {
        if (cancelled) return;
        setError(err.message);
        // 404 et erreur serveur ne méritent pas le même message.
        setState(err.status === 404 ? "missing" : "error");
      });

    return () => {
      cancelled = true;
    };
  }, [slug]);

  if (state === "loading") {
    return (
      <main className="detail">
        <div className="container">
          <p className="empty">Chargement de l'article…</p>
        </div>
      </main>
    );
  }

  if (state !== "ready") {
    return (
      <main className="detail">
        <div className="container">
          <p className="empty">
            <span className="empty__title">
              {state === "missing" ? "Article introuvable" : "Chargement impossible"}
            </span>
            {state === "missing"
              ? "Cet article n'existe pas ou n'est plus publié."
              : error}
          </p>
          <p className="detail__back-empty">
            <a className="btn" href="#/blog">
              Retour au blog
            </a>
          </p>
        </div>
      </main>
    );
  }

  return (
    <main className="detail">
      <header className="detail__hero">
        <div className="container">
          <a className="back" href="#/blog">
            <ArrowLeft />
            Tous les articles
          </a>

          <p className="detail__eyebrow">{article.category}</p>
          <h1 className="detail__title">{article.title}</h1>

          <p className="detail__meta">
            {article.publishedAt && (
              <span>Publié le {formatLongDate(article.publishedAt)}</span>
            )}
            <span>{article.readingTime} min de lecture</span>
            {article.status === "DRAFT" && (
              <span className="post__draft">Brouillon</span>
            )}
          </p>
        </div>
      </header>

      <div className="container">
        {article.image && (
          <figure className="detail__media">
            <img src={article.image} alt="" loading="lazy" />
          </figure>
        )}

        <p className="detail__excerpt">{article.excerpt}</p>

        {/* Contenu HTML : nettoyé par RichText avant injection. */}
        <RichText html={article.content} />
      </div>
    </main>
  );
}
