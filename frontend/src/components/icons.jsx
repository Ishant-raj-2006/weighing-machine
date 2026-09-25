// Minimal hand-picked icon set (stroke-based, 20x20) so the app has no
// extra icon-library dependency to install.

const base = {
  fill: 'none',
  stroke: 'currentColor',
  strokeWidth: 1.6,
  strokeLinecap: 'round',
  strokeLinejoin: 'round',
}

export const IconDashboard = (p) => (
  <svg viewBox="0 0 20 20" width="18" height="18" {...base} {...p}>
    <rect x="2.5" y="2.5" width="6.5" height="6.5" rx="1" />
    <rect x="11" y="2.5" width="6.5" height="4" rx="1" />
    <rect x="11" y="8.5" width="6.5" height="9" rx="1" />
    <rect x="2.5" y="11" width="6.5" height="6.5" rx="1" />
  </svg>
)

export const IconScale = (p) => (
  <svg viewBox="0 0 20 20" width="18" height="18" {...base} {...p}>
    <path d="M10 2.5v15" />
    <path d="M4 5.5h12" />
    <path d="M4 5.5 1.5 11a2.5 2.5 0 0 0 5 0L4 5.5Z" />
    <path d="M16 5.5 13.5 11a2.5 2.5 0 0 0 5 0L16 5.5Z" />
    <path d="M6.5 17.5h7" />
  </svg>
)

export const IconPlus = (p) => (
  <svg viewBox="0 0 20 20" width="18" height="18" {...base} {...p}>
    <path d="M10 4v12M4 10h12" />
  </svg>
)

export const IconHistory = (p) => (
  <svg viewBox="0 0 20 20" width="18" height="18" {...base} {...p}>
    <path d="M3 10a7 7 0 1 0 2.1-5" />
    <path d="M3 3.5V7h3.5" />
    <path d="M10 6.5V10l2.5 1.5" />
  </svg>
)

export const IconUsers = (p) => (
  <svg viewBox="0 0 20 20" width="18" height="18" {...base} {...p}>
    <circle cx="7" cy="6.5" r="2.5" />
    <path d="M2 17c0-3 2.5-5 5-5s5 2 5 5" />
    <circle cx="14.5" cy="7.5" r="2" />
    <path d="M13 12.2c2 .2 4 1.9 4 4.8" />
  </svg>
)

export const IconLogout = (p) => (
  <svg viewBox="0 0 20 20" width="17" height="17" {...base} {...p}>
    <path d="M8 17H4.5A1.5 1.5 0 0 1 3 15.5v-11A1.5 1.5 0 0 1 4.5 3H8" />
    <path d="M13 14l4-4-4-4" />
    <path d="M17 10H8" />
  </svg>
)

export const IconSearch = (p) => (
  <svg viewBox="0 0 20 20" width="16" height="16" {...base} {...p}>
    <circle cx="8.5" cy="8.5" r="5.5" />
    <path d="m17 17-4-4" />
  </svg>
)

export const IconDownload = (p) => (
  <svg viewBox="0 0 20 20" width="16" height="16" {...base} {...p}>
    <path d="M10 3v10" />
    <path d="m5.5 9 4.5 4.5L14.5 9" />
    <path d="M3.5 16.5h13" />
  </svg>
)

export const IconCheck = (p) => (
  <svg viewBox="0 0 20 20" width="16" height="16" {...base} {...p}>
    <path d="m4 10.5 4 4 8-9" />
  </svg>
)

export const IconChevronRight = (p) => (
  <svg viewBox="0 0 20 20" width="16" height="16" {...base} {...p}>
    <path d="m7.5 4.5 6 5.5-6 5.5" />
  </svg>
)

export const IconTrash = (p) => (
  <svg viewBox="0 0 20 20" width="16" height="16" {...base} {...p}>
    <path d="M4 6h12" />
    <path d="M7.5 6V4.2A1.2 1.2 0 0 1 8.7 3h2.6a1.2 1.2 0 0 1 1.2 1.2V6" />
    <path d="M5.5 6 6 16.3A1.2 1.2 0 0 0 7.2 17.5h5.6a1.2 1.2 0 0 0 1.2-1.2L14.5 6" />
  </svg>
)
