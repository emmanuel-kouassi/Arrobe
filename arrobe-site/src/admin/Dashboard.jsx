import { IconEye, IconEdit, IconTrash } from "./icons";
import { formatLongDate } from "../lib/format";

/** Bloc chiffré de la vue d'ensemble. */
function Kpi({ label, value }) {
  return (
    <div className="kpi">
      <p className="kpi__label">{label}</p>
      <p className="kpi__value">{value}</p>
    </div>
  );
}

/** Liste avec son propre état vide : une base neuve n'est pas une erreur. */
function Panel({ title, empty, children, rows }) {
  return (
    <section className="adm__panel">
      <h2 className="adm__panel-title">{title}</h2>
      {rows === 0 ? <p className="adm__empty">{empty}</p> : <ul className="rows">{children}</ul>}
    </section>
  );
}

export default function Dashboard({ data, onDeleteArticle, onDeleteEvent }) {
  const { counts, recentArticles, upcomingEvents, recentRegistrations } = data;

  return (
    <>
      <header className="adm__head">
        <div>
          <h1 className="adm__title">Bonjour {data.identifiant}</h1>
          <p className="adm__subtitle">Voici l'activité du site</p>
        </div>

        <div className="adm__actions">
          <a className="btn-ghost" href="#/administration/articles/nouveau">
            + Article
          </a>
          <a className="btn-ghost" href="#/administration/evenements/nouveau">
            + Événement
          </a>
        </div>
      </header>

      <div className="kpis">
        <Kpi label="Articles publiés" value={counts.published} />
        <Kpi label="Brouillons" value={counts.drafts} />
        <Kpi label="Événements à venir" value={counts.upcoming} />
        <Kpi label="Inscrits ce mois" value={counts.registrationsThisMonth} />
      </div>

      <Panel
        title="Derniers articles"
        rows={recentArticles.length}
        empty="Aucun article pour le moment. Créez le premier avec « + Article »."
      >
        {recentArticles.map((article) => (
          <li className="row" key={article.slug}>
            <span className="row__title">{article.title}</span>

            <span className="row__side">
              <span className={`tag ${article.status === "PUBLISHED" ? "tag--ok" : ""}`}>
                {article.status === "PUBLISHED" ? "Publié" : "Brouillon"}
              </span>

              {article.publishedAt && (
                <span className="row__meta">{formatLongDate(article.publishedAt)}</span>
              )}

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
                onClick={() => onDeleteArticle(article)}
              >
                <IconTrash />
              </button>
            </span>
          </li>
        ))}
      </Panel>

      <Panel
        title="Prochains événements"
        rows={upcomingEvents.length}
        empty="Aucun événement à venir. Programmez le prochain avec « + Événement »."
      >
        {upcomingEvents.map((event) => (
          <li className="row" key={event.slug}>
            <span className="row__title">{event.title}</span>

            <span className="row__side">
              {event.status === "DRAFT" && <span className="tag">Brouillon</span>}
              <span className="row__meta">{formatLongDate(event.date)}</span>
              <span className="row__meta">
                {event._count.registrations} inscrit
                {event._count.registrations > 1 ? "s" : ""}
              </span>

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
                onClick={() => onDeleteEvent(event)}
              >
                <IconTrash />
              </button>
            </span>
          </li>
        ))}
      </Panel>

      <Panel
        title="Dernières inscriptions"
        rows={recentRegistrations.length}
        empty="Aucune inscription pour le moment."
      >
        {recentRegistrations.map((registration) => (
          <li className="row" key={registration.id}>
            <span className="row__title">{registration.name}</span>
            <span className="row__side">
              <span className="row__meta">{registration.event.title}</span>
            </span>
          </li>
        ))}
      </Panel>
    </>
  );
}
