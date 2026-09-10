/**
 * Client d'API côté navigateur
 * ===================================================================
 * Un seul endroit qui sait parler à /api : les pages ne manipulent
 * jamais fetch directement.
 *
 * Le jeton de session vit dans sessionStorage et non localStorage :
 * il disparaît à la fermeture de l'onglet, ce qui limite la casse sur
 * un poste partagé.
 * ===================================================================
 */

const TOKEN_KEY = "arrobe_admin_token";

/* ------------------------------------------------------------------
   Jeton de session
   ------------------------------------------------------------------ */

export function getToken() {
  try {
    return sessionStorage.getItem(TOKEN_KEY);
  } catch {
    // Navigation privée stricte : sessionStorage peut lever.
    return null;
  }
}

export function setToken(token) {
  try {
    if (token) sessionStorage.setItem(TOKEN_KEY, token);
    else sessionStorage.removeItem(TOKEN_KEY);
  } catch {
    /* rien à faire : l'utilisateur devra se reconnecter */
  }
}

export function isLoggedIn() {
  return Boolean(getToken());
}

export function logout() {
  setToken(null);
}

/* ------------------------------------------------------------------
   Appel générique
   ------------------------------------------------------------------ */

/** Erreur portant le code HTTP, pour que l'appelant puisse réagir. */
export class ApiError extends Error {
  constructor(message, status, details) {
    super(message);
    this.name = "ApiError";
    this.status = status;
    this.details = details;
  }
}

async function request(path, { method = "GET", body, auth = false } = {}) {
  const headers = {};
  if (body !== undefined) headers["Content-Type"] = "application/json";

  // `auth: true` exige le jeton ; sinon on l'envoie s'il existe, ce qui
  // permet à l'admin connecté de voir ses brouillons sur les pages
  // publiques sans code particulier.
  const token = getToken();
  if (token && (auth || method === "GET")) {
    headers.Authorization = `Bearer ${token}`;
  }

  let response;
  try {
    response = await fetch(path, {
      method,
      headers,
      body: body === undefined ? undefined : JSON.stringify(body),
    });
  } catch {
    throw new ApiError("Impossible de joindre le serveur.", 0);
  }

  // 401 sur une route protégée : le jeton a expiré (2 h) ou le secret
  // a changé. On le jette pour éviter de boucler sur des refus.
  if (response.status === 401 && auth) {
    setToken(null);
  }

  const payload = await response.json().catch(() => null);

  if (!response.ok) {
    throw new ApiError(
      payload?.error ?? `Erreur ${response.status}.`,
      response.status,
      payload?.details
    );
  }

  return payload;
}

/* ------------------------------------------------------------------
   Mise en forme pour les composants existants
   ------------------------------------------------------------------
   L'API renvoie les champs de la base. PostCard et EventCard, eux,
   attendent la forme de l'ancien fichier de données. On adapte ici
   plutôt que de réécrire les composants.
   ------------------------------------------------------------------ */

const MONTHS_SHORT = [
  "Jan", "Fév", "Mars", "Avr", "Mai", "Juin",
  "Juil", "Août", "Sept", "Oct", "Nov", "Déc",
];

/** Transforme un Event de l'API en objet attendu par EventCard. */
export function toEventCard(event) {
  const date = new Date(event.date);

  const schedule = date.toLocaleDateString("fr-FR", {
    day: "numeric",
    month: "long",
    year: "numeric",
  });
  const time = date.toLocaleTimeString("fr-FR", {
    hour: "2-digit",
    minute: "2-digit",
  });

  return {
    id: event.slug,
    day: String(date.getDate()),
    month: MONTHS_SHORT[date.getMonth()],
    year: String(date.getFullYear()),
    title: event.title,
    organizer: event.organizer,
    place: event.location,
    schedule: `${schedule} - ${time}`,
    image: event.image ?? null,
    status: event.status,
  };
}

/** Transforme un Article de l'API en objet attendu par PostCard. */
export function toPostCard(article) {
  return {
    id: article.slug,
    title: article.title,
    excerpt: article.excerpt,
    image: article.image ?? null,
    category: article.category,
    readingTime: article.readingTime,
    publishedAt: article.publishedAt,
    status: article.status,
  };
}

/* ------------------------------------------------------------------
   Routes
   ------------------------------------------------------------------ */

export const api = {
  async login(identifiant, password) {
    const data = await request("/api/admin/login", {
      method: "POST",
      body: { identifiant, password },
    });
    setToken(data.token);
    return data;
  },

  async listArticles({ category } = {}) {
    const query = category && category !== "all" ? `?category=${encodeURIComponent(category)}` : "";
    const data = await request(`/api/articles${query}`);
    return data.articles.map(toPostCard);
  },

  async getArticle(slug) {
    const data = await request(`/api/articles/${encodeURIComponent(slug)}`);
    return data.article;
  },

  async listEvents() {
    const data = await request("/api/events");
    // Les deux clés existent toujours, même vides : rien à vérifier
    // côté appelant.
    return {
      upcoming: data.upcoming.map(toEventCard),
      past: data.past.map(toEventCard),
    };
  },

  async getEvent(slug) {
    const data = await request(`/api/events/${encodeURIComponent(slug)}`);
    return data.event;
  },

  async register(slug, form) {
    return request(`/api/events/${encodeURIComponent(slug)}/register`, {
      method: "POST",
      body: form,
    });
  },

  async listRegistrations(slug) {
    return request(`/api/events/${encodeURIComponent(slug)}/registrations`, {
      auth: true,
    });
  },

  /* --- Administration --------------------------------------------- */

  async stats() {
    return request("/api/admin/stats", { auth: true });
  },

  /** Listes brutes pour l'admin : on garde les champs de la base. */
  async adminArticles() {
    const data = await request("/api/articles", { auth: true });
    return data.articles;
  },

  async adminEvents() {
    return request("/api/events", { auth: true });
  },

  async createArticle(body) {
    const data = await request("/api/articles", { method: "POST", body, auth: true });
    return data.article;
  },

  async updateArticle(slug, body) {
    const data = await request(`/api/articles/${encodeURIComponent(slug)}`, {
      method: "PUT",
      body,
      auth: true,
    });
    return data.article;
  },

  async deleteArticle(slug) {
    return request(`/api/articles/${encodeURIComponent(slug)}`, {
      method: "DELETE",
      auth: true,
    });
  },

  async createEvent(body) {
    const data = await request("/api/events", { method: "POST", body, auth: true });
    return data.event;
  },

  async updateEvent(slug, body) {
    const data = await request(`/api/events/${encodeURIComponent(slug)}`, {
      method: "PUT",
      body,
      auth: true,
    });
    return data.event;
  },

  async deleteEvent(slug, { force = false } = {}) {
    return request(
      `/api/events/${encodeURIComponent(slug)}${force ? "?force=1" : ""}`,
      { method: "DELETE", auth: true }
    );
  },
};
