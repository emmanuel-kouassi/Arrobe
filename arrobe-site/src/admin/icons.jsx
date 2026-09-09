/** Icônes de l'administration. Traits uniformes, taille héritée du CSS. */
const S = {
  fill: "none",
  stroke: "currentColor",
  strokeWidth: 1.7,
  strokeLinecap: "round",
  strokeLinejoin: "round",
};

const wrap = (children) => (
  <svg className="adm__icon" viewBox="0 0 24 24" aria-hidden="true">
    {children}
  </svg>
);

export const IconDashboard = () =>
  wrap(
    <>
      <rect x="3" y="3" width="7" height="7" rx="1.6" {...S} />
      <rect x="14" y="3" width="7" height="7" rx="1.6" {...S} />
      <rect x="3" y="14" width="7" height="7" rx="1.6" {...S} />
      <rect x="14" y="14" width="7" height="7" rx="1.6" {...S} />
    </>
  );

export const IconArticle = () =>
  wrap(
    <>
      <path d="M6 3h8l4 4v14H6z" {...S} />
      <path d="M14 3v4h4M9 12h6M9 16h6" {...S} />
    </>
  );

export const IconCalendar = () =>
  wrap(
    <>
      <rect x="3" y="5" width="18" height="16" rx="2.2" {...S} />
      <path d="M3 10h18M8 3v4M16 3v4" {...S} />
    </>
  );

export const IconList = () =>
  wrap(
    <>
      <rect x="5" y="3" width="14" height="18" rx="2" {...S} />
      <path d="M9 8h6M9 12h6M9 16h4" {...S} />
    </>
  );

export const IconLogout = () =>
  wrap(
    <>
      <path d="M14 4H6a2 2 0 00-2 2v12a2 2 0 002 2h8" {...S} />
      <path d="M17 8l4 4-4 4M21 12H10" {...S} />
    </>
  );

export const IconEye = () =>
  wrap(
    <>
      <path d="M2 12s3.8-6.5 10-6.5S22 12 22 12s-3.8 6.5-10 6.5S2 12 2 12z" {...S} />
      <circle cx="12" cy="12" r="2.6" {...S} />
    </>
  );

export const IconEdit = () =>
  wrap(
    <>
      <path d="M4 20h4L19 9a2.1 2.1 0 10-3-3L5 17z" {...S} />
      <path d="M14.5 6.5l3 3" {...S} />
    </>
  );

export const IconTrash = () =>
  wrap(
    <>
      <path d="M4 7h16M9 7V5h6v2M6 7l1 13h10l1-13" {...S} />
      <path d="M10 11v6M14 11v6" {...S} />
    </>
  );

export const IconPlus = () => wrap(<path d="M12 5v14M5 12h14" {...S} />);

export const IconMenu = () => wrap(<path d="M4 7h16M4 12h16M4 17h16" {...S} />);
