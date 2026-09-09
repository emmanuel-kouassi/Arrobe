import { useCallback, useEffect, useState } from "react";
import AdminShell from "../admin/AdminShell";
import Dashboard from "../admin/Dashboard";
import { ArticleList, EventList, RegistrationList } from "../admin/Lists";
import { ArticleForm, EventForm } from "../admin/Forms";
import { api, isLoggedIn } from "../lib/api";

/**
 * Point d'entrée de l'administration.
 * ===================================================================
 * Garde d'accès : sans jeton, on renvoie vers la connexion. Ce n'est
 * qu'un confort d'affichage — la vraie protection est côté API, qui
 * refuse toute requête sans jeton valide. Masquer l'interface ne
 * protège rien en soi.
 *
 * Sous-routes gérées :
 *   #/administration                          tableau de bord
 *   #/administration/articles                 liste
 *   #/administration/articles/nouveau         création
 *   #/administration/articles/<slug>          modification
 *   #/administration/evenements[...]          idem
 *   #/administration/inscriptions             inscrits par événement
 * ===================================================================
 */
export default function Admin({ route }) {
  const [, , section = "", target = ""] = route.split("/");

  const [payload, setPayload] = useState(null);
  const [state, setState] = useState("loading");
  const [error, setError] = useState("");

  // Rechargement après une création, une modification ou une suppression.
  const [version, setVersion] = useState(0);
  const refresh = useCallback(() => setVersion((v) => v + 1), []);

  useEffect(() => {
    if (!isLoggedIn()) {
      window.location.hash = "#/connexion";
      return;
    }

    let cancelled = false;

    const load = async () => {
      try {
        let data;

        if (section === "articles" && target && target !== "nouveau") {
          data = { article: await api.getArticle(target) };
        } else if (section === "articles") {
          data = { articles: await api.adminArticles() };
        } else if (section === "evenements" && target && target !== "nouveau") {
          data = { event: await api.getEvent(target) };
        } else if (section === "evenements" || section === "inscriptions") {
          data = { events: await api.adminEvents() };
        } else {
          data = { stats: await api.stats() };
        }

        if (cancelled) return;
        setPayload(data);
        setState("ready");
      } catch (err) {
        if (cancelled) return;
        // Jeton expiré : api.js l'a déjà effacé, on repart à la connexion.
        if (err.status === 401) {
          window.location.hash = "#/connexion";
          return;
        }
        setError(err.message);
        setState("error");
      }
    };

    // Pas de formulaire de création à charger : il part d'un objet vide.
    if (target === "nouveau") {
      setPayload({});
      setState("ready");
    } else {
      setState("loading");
      load();
    }

    return () => {
      cancelled = true;
    };
  }, [section, target, version]);

  /* --- Suppressions, avec confirmation ---------------------------- */

  const deleteArticle = async (article) => {
    if (!window.confirm(`Supprimer définitivement « ${article.title} » ?`)) return;
    try {
      await api.deleteArticle(article.slug);
      refresh();
    } catch (err) {
      window.alert(err.message);
    }
  };

  const deleteEvent = async (event) => {
    if (!window.confirm(`Supprimer définitivement « ${event.title} » ?`)) return;
    try {
      await api.deleteEvent(event.slug);
      refresh();
    } catch (err) {
      // 409 : l'événement compte des inscrits. On redemande, en
      // annonçant clairement que la liste partira aussi.
      if (err.status === 409) {
        const forced = window.confirm(
          `${err.message}\n\nSupprimer quand même l'événement ET ses inscriptions ?`
        );
        if (!forced) return;
        try {
          await api.deleteEvent(event.slug, { force: true });
          refresh();
        } catch (second) {
          window.alert(second.message);
        }
        return;
      }
      window.alert(err.message);
    }
  };

  const goTo = (hash) => {
    window.location.hash = hash;
  };

  /* --- Rendu ------------------------------------------------------- */

  const identifiant = payload?.stats?.identifiant;

  const body = () => {
    if (state === "loading") return <p className="adm__empty">Chargement…</p>;
    if (state === "error") {
      return (
        <p className="adm__empty">
          Chargement impossible : {error}
        </p>
      );
    }

    if (section === "articles" && target === "nouveau") {
      return (
        <ArticleForm
          onSave={async (body) => {
            await api.createArticle(body);
            goTo("#/administration/articles");
          }}
          onCancel={() => goTo("#/administration/articles")}
        />
      );
    }

    if (section === "articles" && target) {
      return (
        <ArticleForm
          initial={payload.article}
          onSave={async (body) => {
            await api.updateArticle(payload.article.slug, body);
            goTo("#/administration/articles");
          }}
          onCancel={() => goTo("#/administration/articles")}
        />
      );
    }

    if (section === "articles") {
      return <ArticleList articles={payload.articles} onDelete={deleteArticle} />;
    }

    if (section === "evenements" && target === "nouveau") {
      return (
        <EventForm
          onSave={async (body) => {
            await api.createEvent(body);
            goTo("#/administration/evenements");
          }}
          onCancel={() => goTo("#/administration/evenements")}
        />
      );
    }

    if (section === "evenements" && target) {
      return (
        <EventForm
          initial={payload.event}
          onSave={async (body) => {
            await api.updateEvent(payload.event.slug, body);
            goTo("#/administration/evenements");
          }}
          onCancel={() => goTo("#/administration/evenements")}
        />
      );
    }

    if (section === "evenements") {
      return (
        <EventList
          upcoming={payload.events.upcoming}
          past={payload.events.past}
          onDelete={deleteEvent}
        />
      );
    }

    if (section === "inscriptions") {
      return (
        <RegistrationList
          events={payload.events}
          loadRegistrations={(slug) => api.listRegistrations(slug)}
        />
      );
    }

    return (
      <Dashboard
        data={payload.stats}
        onDeleteArticle={deleteArticle}
        onDeleteEvent={deleteEvent}
      />
    );
  };

  return (
    <AdminShell section={section} identifiant={identifiant}>
      {body()}
    </AdminShell>
  );
}
