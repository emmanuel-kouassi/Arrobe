import useReveal from "../hooks/useReveal";

function EyeIcon() {
  return (
    <svg className="post__eye" viewBox="0 0 24 24" aria-hidden="true">
      <path
        d="M2 12s3.8-6.5 10-6.5S22 12 22 12s-3.8 6.5-10 6.5S2 12 2 12z"
        fill="none"
        stroke="currentColor"
        strokeWidth="1.7"
      />
      <circle cx="12" cy="12" r="2.6" fill="currentColor" />
    </svg>
  );
}

/**
 * Carte d'article.
 * props :
 *   post  -> objet venant de src/data/posts.js
 *   view  -> "grid" ou "list"
 *   index -> position, sert au décalage de l'animation
 */
export default function PostCard({ post, view = "grid", index = 0 }) {
  const [ref, shown] = useReveal({ threshold: 0.12 });

  return (
    <article
      ref={ref}
      className={`post post--${view} reveal ${shown ? "is-visible" : ""}`}
      style={{ "--delay": `${index * 110}ms` }}
    >
      <div className="post__media">
        <img src={post.image} alt={post.title} loading="lazy" />
      </div>

      <div className="post__body">
        <h3 className="post__title">{post.title}</h3>
        <p className="post__excerpt">{post.excerpt}</p>

        <div className="post__footer">
          <span className="post__views">
            <EyeIcon />
            {post.views} Vues
          </span>

          <a className="post__cta" href={`#/blog/${post.id}`}>
            En savoir plus
          </a>
        </div>
      </div>
    </article>
  );
}