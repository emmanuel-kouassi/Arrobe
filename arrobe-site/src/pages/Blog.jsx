import { useMemo, useState } from "react";
import useReveal from "../hooks/useReveal";
import PostCard from "../components/PostCard";
import { POSTS, CATEGORIES, SORT_OPTIONS, sortPosts } from "../data/posts";

function FilterIcon() {
  return (
    <svg className="blog__filter-icon" viewBox="0 0 24 24" aria-hidden="true">
      <path
        d="M3 5h18l-7 8v6l-4 2v-8L3 5z"
        fill="none"
        stroke="currentColor"
        strokeWidth="1.7"
        strokeLinejoin="round"
      />
    </svg>
  );
}

function GridIcon() {
  return (
    <svg viewBox="0 0 24 24" aria-hidden="true">
      <rect x="3" y="3" width="7.5" height="7.5" rx="1.5" fill="currentColor" />
      <rect x="13.5" y="3" width="7.5" height="7.5" rx="1.5" fill="currentColor" />
      <rect x="3" y="13.5" width="7.5" height="7.5" rx="1.5" fill="currentColor" />
      <rect x="13.5" y="13.5" width="7.5" height="7.5" rx="1.5" fill="currentColor" />
    </svg>
  );
}

function ListIcon() {
  return (
    <svg viewBox="0 0 24 24" aria-hidden="true">
      <rect x="3" y="4.5" width="18" height="3" rx="1.5" fill="currentColor" />
      <rect x="3" y="10.5" width="18" height="3" rx="1.5" fill="currentColor" />
      <rect x="3" y="16.5" width="18" height="3" rx="1.5" fill="currentColor" />
    </svg>
  );
}

export default function Blog() {
  const [sort, setSort] = useState("recent");
  const [category, setCategory] = useState("all");
  const [view, setView] = useState("grid");

  const [headRef, headShown] = useReveal({ threshold: 0.1 });
  const [barRef, barShown] = useReveal({ threshold: 0.1 });

  // Filtre + tri : tout se fait dans le navigateur pour l'instant.
  const visiblePosts = useMemo(() => {
    const filtered =
      category === "all"
        ? POSTS
        : POSTS.filter((post) => post.category === category);
    return sortPosts(filtered, sort);
  }, [category, sort]);

  return (
    <main className="blog">
      <section className="blog__hero">
        <div className="container">
          <div ref={headRef} className={`reveal ${headShown ? "is-visible" : ""}`}>
            <h1 className="blog__title">Notre Blog</h1>
            <p className="blog__intro">
              Retrouvez ici tous les articles rédigés par l'équipe d'Arrobe :
              astuces du quotidien, tutoriels informatiques et coulisses de nos
              projets, comme le montage de notre imprimante 3D&nbsp;! Un espace
              pensé pour continuer à apprendre et échanger en dehors des
              ateliers.
            </p>
          </div>
        </div>
      </section>

      <section className="section section--tight">
        <div className="container">
          <div
            ref={barRef}
            className={`blog__toolbar reveal ${barShown ? "is-visible" : ""}`}
          >
            <div className="blog__sort">
              <FilterIcon />
              <label htmlFor="blog-sort">Trier par :</label>
              <select
                id="blog-sort"
                value={sort}
                onChange={(e) => setSort(e.target.value)}
              >
                {SORT_OPTIONS.map((option) => (
                  <option key={option.id} value={option.id}>
                    {option.label}
                  </option>
                ))}
              </select>
            </div>

            <div className="blog__views" role="group" aria-label="Mode d'affichage">
              <button
                type="button"
                className={`blog__view ${view === "grid" ? "is-active" : ""}`}
                aria-pressed={view === "grid"}
                aria-label="Affichage en grille"
                onClick={() => setView("grid")}
              >
                <GridIcon />
              </button>
              <button
                type="button"
                className={`blog__view ${view === "list" ? "is-active" : ""}`}
                aria-pressed={view === "list"}
                aria-label="Affichage en liste"
                onClick={() => setView("list")}
              >
                <ListIcon />
              </button>
            </div>
          </div>

          <div className="blog__chips">
            {CATEGORIES.map((cat) => (
              <button
                key={cat.id}
                type="button"
                className={`chip ${category === cat.id ? "is-active" : ""}`}
                aria-pressed={category === cat.id}
                onClick={() => setCategory(cat.id)}
              >
                {cat.label}
              </button>
            ))}
          </div>

          {visiblePosts.length === 0 ? (
            <p className="blog__empty">
              Aucun article dans cette catégorie pour le moment. Revenez bientôt.
            </p>
          ) : (
            <div
              className={`post-grid post-grid--${view}`}
              /* la clé force le rejeu des animations au changement de vue */
              key={`${view}-${sort}-${category}`}
            >
              {visiblePosts.map((post, i) => (
                <PostCard key={post.id} post={post} view={view} index={i} />
              ))}
            </div>
          )}
        </div>
      </section>
    </main>
  );
}