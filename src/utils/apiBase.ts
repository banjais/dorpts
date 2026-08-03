// Absolute base URL for the API backend.
// Cloudflare Pages serves the Pages Functions API.
// Firebase Hosting is static-only.
export const API_BASE = typeof window !== 'undefined'
  ? window.location.hostname === 'localhost' || window.location.hostname === '127.0.0.1'
    ? window.location.origin
    : 'https://dorpts.pages.dev'
  : '';
