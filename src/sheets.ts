import { API_BASE } from "./utils/apiBase";

export const fetchSheetData = async (spreadsheetId: string, range: string, accessToken: string) => {
  const url = `${API_BASE}/api/sheets/${spreadsheetId}/${range}`;
  try {
    const response = await fetch(url, {
      headers: { Authorization: `Bearer ${accessToken}` },
    });
    if (!response.ok) {
      throw new Error('Failed to fetch sheet data');
    }
    const data = await response.json();
    if (typeof window !== 'undefined' && 'caches' in window) {
      try {
        const cache = await caches.open('critical-api-stats-cache');
        await cache.put(url, new Response(JSON.stringify(data), { status: 200, headers: { 'Content-Type': 'application/json' } }));
      } catch (_) {}
    }
    return data;
  } catch (err) {
    if (typeof window !== 'undefined' && 'caches' in window) {
      try {
        const cache = await caches.open('critical-api-stats-cache');
        const match = await cache.match(url);
        if (match) return await match.json();
      } catch (_) {}
    }
    throw err;
  }
};

export const fetchSpreadsheetMeta = async (spreadsheetId: string, accessToken: string) => {
  const url = `${API_BASE}/api/sheets-meta/${spreadsheetId}`;
  try {
    const response = await fetch(url, {
      headers: { Authorization: `Bearer ${accessToken}` },
    });
    if (!response.ok) {
      throw new Error('Failed to fetch sheet metadata');
    }
    const data = await response.json();
    if (typeof window !== 'undefined' && 'caches' in window) {
      try {
        const cache = await caches.open('critical-api-stats-cache');
        await cache.put(url, new Response(JSON.stringify(data), { status: 200, headers: { 'Content-Type': 'application/json' } }));
      } catch (_) {}
    }
    return data;
  } catch (err) {
    if (typeof window !== 'undefined' && 'caches' in window) {
      try {
        const cache = await caches.open('critical-api-stats-cache');
        const match = await cache.match(url);
        if (match) return await match.json();
      } catch (_) {}
    }
    throw err;
  }
};
