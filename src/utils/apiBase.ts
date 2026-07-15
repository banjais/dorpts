// Absolute base URL for the API backend.
// Used so the app works identically whether served from dorpts.web.app
// (Firebase Hosting with rewrites to Cloud Function) or dorpts.pages.dev (Cloudflare Pages).
export const API_BASE = typeof window !== 'undefined' ? window.location.origin : '';
