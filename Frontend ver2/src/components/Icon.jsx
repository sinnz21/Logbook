/**
 * The v2 design's line icons, as inline SVG — no icon library dependency.
 *
 * All paths are drawn on a 24×24 grid with a 1.75 stroke, so they sit
 * optically level with the UI text next to them. Colour comes from
 * `currentColor`, so an icon inherits whatever its container is set to.
 */

const PATHS = {
  // ── sidebar ──
  dashboard: <><rect x="3" y="3" width="7" height="7" rx="1.5" /><rect x="14" y="3" width="7" height="7" rx="1.5" /><rect x="3" y="14" width="7" height="7" rx="1.5" /><rect x="14" y="14" width="7" height="7" rx="1.5" /></>,
  plusSquare: <><rect x="3" y="3" width="18" height="18" rx="3" /><path d="M12 8v8M8 12h8" /></>,
  clipboard: <><path d="M9 4h6a1 1 0 0 1 1 1v1H8V5a1 1 0 0 1 1-1Z" /><path d="M8 6H6a2 2 0 0 0-2 2v11a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8a2 2 0 0 0-2-2h-2" /><path d="M9 12h6M9 16h4" /></>,
  flag: <><path d="M5 21V4" /><path d="M5 4h10l-1.5 3.5L15 11H5" /></>,
  search: <><circle cx="11" cy="11" r="7" /><path d="m20 20-3.5-3.5" /></>,
  box: <><path d="M12 3 4 7v10l8 4 8-4V7l-8-4Z" /><path d="m4 7 8 4 8-4M12 11v10" /></>,
  chart: <><path d="M4 20V10M10 20V4M16 20v-7M22 20H2" /></>,
  users: <><circle cx="9" cy="8" r="3.25" /><path d="M3 20a6 6 0 0 1 12 0" /><path d="M16 5.5a3.25 3.25 0 0 1 0 6.5M17.5 20a6 6 0 0 0-2-4.5" /></>,
  settings: <><circle cx="12" cy="12" r="3" /><path d="M12 3v2.5M12 18.5V21M3 12h2.5M18.5 12H21M5.6 5.6l1.8 1.8M16.6 16.6l1.8 1.8M18.4 5.6l-1.8 1.8M7.4 16.6l-1.8 1.8" /></>,
  signOut: <><path d="M9 21H6a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h3" /><path d="M16 17l5-5-5-5M21 12H9" /></>,

  // ── topbar ──
  menu: <><path d="M4 7h16M4 12h16M4 17h16" /></>,
  bell: <><path d="M18 9a6 6 0 1 0-12 0c0 5-2 6-2 6h16s-2-1-2-6Z" /><path d="M10.5 19a2 2 0 0 0 3 0" /></>,

  // ── KPI badges ──
  activity: <><path d="M3 12h4l2.5-7 4 14 2.5-7h5" /></>,
  calendar: <><rect x="3" y="5" width="18" height="16" rx="2.5" /><path d="M3 10h18M8 3v4M16 3v4" /></>,
  trendUp: <><path d="M7 17 17 7M17 7h-6M17 7v6" /></>,
  database: <><ellipse cx="12" cy="6" rx="8" ry="3" /><path d="M4 6v12c0 1.7 3.6 3 8 3s8-1.3 8-3V6" /><path d="M4 12c0 1.7 3.6 3 8 3s8-1.3 8-3" /></>,
  cloudUp: <><path d="M7 18a4 4 0 0 1 .5-8 5.5 5.5 0 0 1 10.6 1.5A3.5 3.5 0 0 1 17.5 18H7Z" /><path d="M12 21v-7M9.5 16.5 12 14l2.5 2.5" /></>,
  clipboardCheck: <><rect x="4" y="5" width="16" height="16" rx="2.5" /><path d="M9 3h6v3H9zM9 13l2 2 4-4" /></>,

  // ── inline / buttons ──
  download: <><path d="M12 4v11M8 11l4 4 4-4" /><path d="M4 19h16" /></>,
  printer: <><path d="M7 9V4h10v5" /><rect x="4" y="9" width="16" height="7" rx="2" /><path d="M7 14h10v6H7z" /></>,
  sliders: <><path d="M4 8h10M18 8h2M4 16h4M12 16h8" /><circle cx="16" cy="8" r="2" /><circle cx="10" cy="16" r="2" /></>,
  send: <><path d="m21 3-9.5 18-2.2-7.3L2 11.5 21 3Z" /><path d="M21 3 9.3 13.7" /></>,
  plus: <><path d="M12 5v14M5 12h14" /></>,
  pencil: <><path d="M4 20h4L19 9a2.1 2.1 0 0 0-3-3L5 17v3Z" /><path d="m15 6 3 3" /></>,
  trash: <><path d="M4 7h16M10 4h4M6 7l1 13h10l1-13" /><path d="M10 11v6M14 11v6" /></>,
  chevronLeft: <><path d="m14 6-6 6 6 6" /></>,
  chevronRight: <><path d="m10 6 6 6-6 6" /></>,
  user: <><circle cx="12" cy="8" r="3.5" /><path d="M5 20a7 7 0 0 1 14 0" /></>,
  lock: <><rect x="5" y="10" width="14" height="10" rx="2.5" /><path d="M8 10V7.5a4 4 0 0 1 8 0V10" /></>,
  clock: <><circle cx="12" cy="12" r="8.5" /><path d="M12 7.5V12l3 2" /></>,
  alert: <><path d="M12 4.5 2.8 20h18.4L12 4.5Z" /><path d="M12 10v4.5M12 17.2v.3" /></>,
};

export default function Icon({ name, size = 18, className = '', strokeWidth = 1.75, style }) {
  const path = PATHS[name];
  if (!path) return null;
  return (
    <svg
      className={`icon ${className}`}
      width={size}
      height={size}
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth={strokeWidth}
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-hidden="true"
      focusable="false"
      style={style}
    >
      {path}
    </svg>
  );
}
