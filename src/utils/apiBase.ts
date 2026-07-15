// Absolute base URL for the API backend.
// Cloudflare Pages serves the Pages Functions API.
// Firebase Hosting is static-only, so API calls are routed to Cloudflare Pages.
export const API_BASE = typeof window !== 'undefined'
  ? window.location.hostname === 'dorpts.web.app'
    ? 'https://master.dorpts.pages.dev'
    : window.location.origin
  : '';
