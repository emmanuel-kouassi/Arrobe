import useReveal from "../hooks/useReveal";

/**
 * Anciennement un compteur de vues. La base ne stocke pas les vues :
 * les compter demanderait une écriture à chaque affichage, avec les
 * questions de robots et de vie privée qui vont avec. On affiche le
 * temps de lecture, qui est une information utile et déjà en base.
 */
function ClockIcon() {
  return (
    <svg className="post__eye" viewBox="0 0 24 24" aria-hidden="true">
      <circle
        cx="12"
        cy="12"
        r="9"
        fill="none"
        stroke="currentColor"
        strokeWidth="1.7"
      />
      <path
        d="M12 7v5.3l3.4 2"
        fill="none"
        stroke="currentColor"
        strokeWidth="1.7"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  );
}
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
        {/* Visible uniquement pour l'admin : l'API n'envoie les
            brouillons qu'aux requêtes authentifiées. */}
        {post.status === "DRAFT" && <span className="post__draft">Brouillon</span>}
        <h3 className="post__title">{post.title}</h3>
        <p className="post__excerpt">{post.excerpt}</p>

        <div className="post__footer">
          <span className="post__views">
            <ClockIcon />
            {post.readingTime} min de lecture
          </span>

          <a className="post__cta" href={`#/blog/${post.id}`}>
            En savoir plus
          </a>
        </div>
      </div>
    </article>
  );
}