import { useState } from "react";
import { IconEye, IconEdit, IconTrash } from "./icons";
import { formatLongDate, formatDateTime } from "../lib/format";

/* ------------------------------------------------------------------
   Liste des articles
   ------------------------------------------------------------------ */
export function ArticleList({ articles, onDelete }) {
  return (
    <>
      <header className="adm__head">
        <div>
          <h1 className="adm__title">Articles</h1>
          <p className="adm__subtitle">
            {articles.length} article{articles.length > 1 ? "s" : ""} au total
          </p>
        </div>
        <div className="adm__actions">
          <a className="btn-ghost" href="#/administration/articles/nouveau">
            + Article
          </a>
        </div>
      </header>

      {articles.length === 0 ? (
        <p className="adm__empty">
          Aucun article pour le moment. Créez le premier avec « + Article ».
        </p>
      ) : (
        <ul className="rows">
          {articles.map((article) => (
            <li className="row" key={article.slug}>
              <span className="row__title">{article.title}</span>

              <span className="row__side">
                <span className={`tag ${article.status === "PUBLISHED" ? "tag--ok" : ""}`}>
                  {article.status === "PUBLISHED" ? "Publié" : "Brouillon"}
                </span>
                <span className="row__meta">
                  {article.publishedAt
                    ? formatLongDate(article.publishedAt)
                    : "Non publié"}
                </span>

                <a className="row__act" href={`#/blog/${article.slug}`} title="Prévisualiser">
                  <IconEye />
                </a>
                <a
                  className="row__act"
                  href={`#/administration/articles/${article.slug}`}
                  title="Modifier"
                >
                  <IconEdit />
                </a>
                <button
                  className="row__act row__act--danger"
                  type="button"
                  title="Supprimer"
                  onClick={() => onDelete(article)}
                >
                  <IconTrash />
                </button>
              </span>
            </li>
          ))}
        </ul>
      )}
    </>
  );
}

/* ------------------------------------------------------------------
   Liste des événements
   ------------------------------------------------------------------ */
function EventRows({ events, onDelete }) {
  return (
    <ul className="rows">
      {events.map((event) => (
        <li className="row" key={event.slug}>
          <span className="row__title">{event.title}</span>

          <span className="row__side">
            {event.status === "DRAFT" && <span className="tag">Brouillon</span>}
            <span className="row__meta">{formatLongDate(event.date)}</span>
            <span className="row__meta">
              {event._count?.registrations ?? 0} inscrit
              {(event._count?.registrations ?? 0) > 1 ? "s" : ""}
            </span>

            <a className="row__act" href={`#/evenement/${event.slug}`} title="Prévisualiser">
              <IconEye />
            </a>
            <a
              className="row__act"
              href={`#/administration/evenements/${event.slug}`}
              title="Modifier"
            >
              <IconEdit />
            </a>
            <button
              className="row__act row__act--danger"
              type="button"
              title="Supprimer"
              onClick={() => onDelete(event)}
            >
              <IconTrash />
            </button>
          </span>
        </li>
      ))}
    </ul>
  );
}

export function EventList({ upcoming, past, onDelete }) {
  const total = upcoming.length + past.length;

  return (
    <>
      <header className="adm__head">
        <div>
          <h1 className="adm__title">Événements</h1>
          <p className="adm__subtitle">
            {total} événement{total > 1 ? "s" : ""} au total
          </p>
        </div>
        <div className="adm__actions">
          <a className="btn-ghost" href="#/administration/evenements/nouveau">
            + Événement
          </a>
        </div>
      </header>

      <section className="adm__panel">
        <h2 className="adm__panel-title">À venir</h2>
        {upcoming.length === 0 ? (
          <p className="adm__empty">Aucun événement à venir.</p>
        ) : (
          <EventRows events={upcoming} onDelete={onDelete} />
        )}
      </section>

      <section className="adm__panel">
        <h2 className="adm__panel-title">Passés</h2>
        {past.length === 0 ? (
          <p className="adm__empty">Aucun événement passé.</p>
        ) : (
          <EventRows events={past} onDelete={onDelete} />
        )}
      </section>
    </>
  );
}

/* ------------------------------------------------------------------
   Inscriptions, par événement
   ------------------------------------------------------------------ */
export function RegistrationList({ events, loadRegistrations }) {
  const [openSlug, setOpenSlug] = useState(null);
  const [data, setData] = useState({});
  const [busy, setBusy] = useState(null);
  const [error, setError] = useState("");

  const toggle = async (slug) => {
    if (openSlug === slug) {
      setOpenSlug(null);
      return;
    }
    setOpenSlug(slug);
    if (data[slug]) return;

    setBusy(slug);
    setError("");
    try {
      const result = await loadRegistrations(slug);
      setData((current) => ({ ...current, [slug]: result }));
    } catch (err) {
      setError(err.message);
    } finally {
      setBusy(null);
    }
  };

  // On liste d'abord les événements à venir : ce sont eux dont les
  // inscriptions bougent encore.
  const all = [...events.upcoming, ...events.past];

  return (
    <>
      <header className="adm__head">
        <div>
          <h1 className="adm__title">Inscriptions</h1>
          <p className="adm__subtitle">Choisissez un événement pour voir ses inscrits</p>
        </div>
      </header>

      {all.length === 0 ? (
        <p className="adm__empty">Aucun événement, donc aucune inscription.</p>
      ) : (
        <ul className="rows">
          {all.map((event) => {
            const count = event._count?.registrations ?? 0;
            const isOpen = openSlug === event.slug;
            const detail = data[event.slug];

            return (
              <li className="row row--stack" key={event.slug}>
                <button
                  className="row__toggle"
                  type="button"
                  onClick={() => toggle(event.slug)}
                  aria-expanded={isOpen}
                >
                  <span className="row__title">{event.title}</span>
                  <span className="row__side">
                    <span className="row__meta">{formatLongDate(event.date)}</span>
                    <span className={`tag ${count > 0 ? "tag--ok" : ""}`}>
                      {count} inscrit{count > 1 ? "s" : ""}
                    </span>
                  </span>
                </button>

                {isOpen && (
                  <div className="row__panel">
                    {busy === event.slug && <p className="adm__empty">Chargement…</p>}
                    {error && <p className="adm__empty">{error}</p>}

                    {detail && detail.registrations.length === 0 && (
                      <p className="adm__empty">Personne ne s'est encore inscrit.</p>
                    )}

                    {detail && detail.registrations.length > 0 && (
                      <>
                        <p className="row__total">
                          {detail.count} inscription{detail.count > 1 ? "s" : ""} —{" "}
                          {detail.totalPeople} personne{detail.totalPeople > 1 ? "s" : ""}{" "}
                          attendue{detail.totalPeople > 1 ? "s" : ""}
                        </p>

                        {/* Le tableau défile horizontalement sur mobile
                            plutôt que d'écraser les colonnes. */}
                        <div className="table-scroll">
                          <table className="table">
                            <thead>
                              <tr>
                                <th>Nom</th>
                                <th>E-mail</th>
                                <th>Téléphone</th>
                                <th>Pers.</th>
                                <th>Inscrit le</th>
                              </tr>
                            </thead>
                            <tbody>
                              {detail.registrations.map((r) => (
                                <tr key={r.id}>
                                  <td>{r.name}</td>
                                  <td>
                                    <a href={`mailto:${r.email}`}>{r.email}</a>
                                  </td>
                                  <td>
                                    {r.phone ? <a href={`tel:${r.phone}`}>{r.phone}</a> : "—"}
                                  </td>
                                  <td>{r.numberOfPeople}</td>
                                  <td>{formatDateTime(r.createdAt)}</td>
                                </tr>
                              ))}
                            </tbody>
                          </table>
                        </div>
                      </>
                    )}
                  </div>
                )}
              </li>
            );
          })}
        </ul>
      )}
    </>
  );
}
