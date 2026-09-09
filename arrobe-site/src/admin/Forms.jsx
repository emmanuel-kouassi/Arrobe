import { useState } from "react";
import Editor from "./Editor";

/** Champ texte simple, pour ne pas répéter le même balisage. */
function Field({ id, label, hint, children }) {
  return (
    <div className="form__field">
      <label htmlFor={id}>{label}</label>
      {children}
      {hint && <p className="form__hint">{hint}</p>}
    </div>
  );
}

/** Barre d'actions commune aux deux formulaires. */
function Actions({ busy, isNew, onCancel, error }) {
  return (
    <>
      {error && (
        <p className="form__error" role="alert">
          {error}
        </p>
      )}
      <div className="form__actions">
        <button type="submit" className="form__submit" disabled={busy}>
          {busy ? "Enregistrement…" : isNew ? "Créer" : "Enregistrer"}
        </button>
        <button type="button" className="btn-ghost" onClick={onCancel} disabled={busy}>
          Annuler
        </button>
      </div>
    </>
  );
}

/* ------------------------------------------------------------------
   Article
   ------------------------------------------------------------------ */
export function ArticleForm({ initial, onSave, onCancel }) {
  const isNew = !initial;
  const [form, setForm] = useState({
    title: initial?.title ?? "",
    excerpt: initial?.excerpt ?? "",
    category: initial?.category ?? "Tuto",
    readingTime: initial?.readingTime ?? 5,
    image: initial?.image ?? "",
    status: initial?.status ?? "DRAFT",
    content: initial?.content ?? "",
  });
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");

  const set = (field) => (e) =>
    setForm((c) => ({ ...c, [field]: e.target.value }));

  const submit = async (e) => {
    e.preventDefault();
    if (busy) return;

    setBusy(true);
    setError("");
    try {
      await onSave({
        ...form,
        readingTime: Number(form.readingTime),
        image: form.image.trim() || null,
      });
    } catch (err) {
      setError(err.details?.join(" ") ?? err.message);
      setBusy(false);
    }
  };

  return (
    <>
      <header className="adm__head">
        <div>
          <h1 className="adm__title">{isNew ? "Nouvel article" : "Modifier l'article"}</h1>
          <p className="adm__subtitle">
            {isNew
              ? "Il sera créé en brouillon si vous ne changez pas le statut."
              : initial.slug}
          </p>
        </div>
      </header>

      <form className="adm__form" onSubmit={submit} noValidate>
        <Field id="a-title" label="Titre *">
          <input id="a-title" type="text" value={form.title} onChange={set("title")} required />
        </Field>

        <Field id="a-excerpt" label="Résumé *" hint="Affiché sur les cartes du blog.">
          <textarea id="a-excerpt" rows="3" value={form.excerpt} onChange={set("excerpt")} required />
        </Field>

        <div className="form__row">
          <Field id="a-category" label="Catégorie *">
            <input id="a-category" type="text" value={form.category} onChange={set("category")} required />
          </Field>

          <Field id="a-reading" label="Temps de lecture (min) *">
            <input
              id="a-reading"
              type="number"
              min="1"
              max="240"
              value={form.readingTime}
              onChange={set("readingTime")}
              required
            />
          </Field>
        </div>

        <div className="form__row">
          <Field
            id="a-image"
            label="Image"
            hint="Chemin public, par exemple /images/articles/tuto.jpg"
          >
            <input id="a-image" type="text" value={form.image} onChange={set("image")} />
          </Field>

          <Field
            id="a-status"
            label="Statut"
            hint="La date de publication est posée automatiquement au premier passage en « Publié »."
          >
            <select id="a-status" value={form.status} onChange={set("status")}>
              <option value="DRAFT">Brouillon</option>
              <option value="PUBLISHED">Publié</option>
            </select>
          </Field>
        </div>

        <div className="form__field">
          <label>Contenu *</label>
          <Editor
            value={form.content}
            onChange={(html) => setForm((c) => ({ ...c, content: html }))}
            placeholder="Contenu de l'article"
          />
        </div>

        <Actions busy={busy} isNew={isNew} onCancel={onCancel} error={error} />
      </form>
    </>
  );
}

/* ------------------------------------------------------------------
   Événement
   ------------------------------------------------------------------ */

/** Convertit une date ISO en valeur pour <input type="datetime-local">. */
function toLocalInput(iso) {
  if (!iso) return "";
  const d = new Date(iso);
  if (Number.isNaN(d.getTime())) return "";
  const pad = (n) => String(n).padStart(2, "0");
  return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}T${pad(d.getHours())}:${pad(d.getMinutes())}`;
}

export function EventForm({ initial, onSave, onCancel }) {
  const isNew = !initial;
  const [form, setForm] = useState({
    title: initial?.title ?? "",
    description: initial?.description ?? "",
    category: initial?.category ?? "Atelier",
    date: toLocalInput(initial?.date),
    location: initial?.location ?? "Saint-Germain-sur-Morin",
    organizer: initial?.organizer ?? "Association @Rrobe",
    image: initial?.image ?? "",
    status: initial?.status ?? "DRAFT",
    content: initial?.content ?? "",
    recap: initial?.recap ?? "",
  });
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");

  const set = (field) => (e) => setForm((c) => ({ ...c, [field]: e.target.value }));

  // Le compte rendu ne sert qu'après coup. On n'affiche son éditeur que
  // pour un événement dont la date est passée, ou qui en a déjà un —
  // sinon c'est un champ inutile qui encombre la saisie.
  const eventDate = form.date ? new Date(form.date) : null;
  const isPast = eventDate ? eventDate < new Date() : false;
  const showRecap = isPast || Boolean(initial?.recap);

  const submit = async (e) => {
    e.preventDefault();
    if (busy) return;

    if (!form.date) {
      setError("La date est obligatoire.");
      return;
    }

    setBusy(true);
    setError("");
    try {
      await onSave({
        ...form,
        // datetime-local n'a pas de fuseau : on repasse par un Date
        // pour envoyer une ISO complète, sinon le serveur interprète
        // l'heure selon SON fuseau.
        date: new Date(form.date).toISOString(),
        image: form.image.trim() || null,
        recap: form.recap.trim() || null,
      });
    } catch (err) {
      setError(err.details?.join(" ") ?? err.message);
      setBusy(false);
    }
  };

  return (
    <>
      <header className="adm__head">
        <div>
          <h1 className="adm__title">
            {isNew ? "Nouvel événement" : "Modifier l'événement"}
          </h1>
          <p className="adm__subtitle">
            {isNew ? "Il sera créé en brouillon par défaut." : initial.slug}
          </p>
        </div>
      </header>

      <form className="adm__form" onSubmit={submit} noValidate>
        <Field id="e-title" label="Titre *">
          <input id="e-title" type="text" value={form.title} onChange={set("title")} required />
        </Field>

        <Field id="e-desc" label="Résumé court *" hint="Affiché sur les cartes.">
          <textarea id="e-desc" rows="3" value={form.description} onChange={set("description")} required />
        </Field>

        <div className="form__row">
          <Field
            id="e-date"
            label="Date et heure *"
            hint="Le classement à venir / passé se calcule à partir de cette date."
          >
            <input id="e-date" type="datetime-local" value={form.date} onChange={set("date")} required />
          </Field>

          <Field id="e-category" label="Catégorie *">
            <input id="e-category" type="text" value={form.category} onChange={set("category")} required />
          </Field>
        </div>

        <div className="form__row">
          <Field id="e-location" label="Lieu *">
            <input id="e-location" type="text" value={form.location} onChange={set("location")} required />
          </Field>

          <Field id="e-organizer" label="Organisateur *">
            <input id="e-organizer" type="text" value={form.organizer} onChange={set("organizer")} required />
          </Field>
        </div>

        <div className="form__row">
          <Field id="e-image" label="Image" hint="Chemin public, ex. /images/evenements/atelier.jpg">
            <input id="e-image" type="text" value={form.image} onChange={set("image")} />
          </Field>

          <Field id="e-status" label="Statut">
            <select id="e-status" value={form.status} onChange={set("status")}>
              <option value="DRAFT">Brouillon</option>
              <option value="PUBLISHED">Publié</option>
            </select>
          </Field>
        </div>

        <div className="form__field">
          <label>Programme *</label>
          <p className="form__hint">
            Infos pratiques affichées avant l'événement.
          </p>
          <Editor
            value={form.content}
            onChange={(html) => setForm((c) => ({ ...c, content: html }))}
            placeholder="Programme de l'événement"
          />
        </div>

        {showRecap && (
          <div className="form__field">
            <label>Compte rendu</label>
            <p className="form__hint">
              Rédigé après l'événement. S'il est rempli, il remplace le
              programme sur la page publique.
            </p>
            <Editor
              value={form.recap}
              onChange={(html) => setForm((c) => ({ ...c, recap: html }))}
              placeholder="Compte rendu de l'événement"
            />
          </div>
        )}

        <Actions busy={busy} isNew={isNew} onCancel={onCancel} error={error} />
      </form>
    </>
  );
}
