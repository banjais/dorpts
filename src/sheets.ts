import { API_BASE } from "./utils/apiBase";

export const fetchSheetData = async (spreadsheetId: string, range: string, accessToken: string) => {
  const response = await fetch(`${API_BASE}/api/sheets/${spreadsheetId}/${range}`, {
    headers: { Authorization: `Bearer ${accessToken}` },
  });
  if (!response.ok) {
    throw new Error('Failed to fetch sheet data');
  }
  return response.json();
};

export const fetchSpreadsheetMeta = async (spreadsheetId: string, accessToken: string) => {
  const response = await fetch(`${API_BASE}/api/sheets-meta/${spreadsheetId}`, {
    headers: { Authorization: `Bearer ${accessToken}` },
  });
  if (!response.ok) {
    throw new Error('Failed to fetch sheet metadata');
  }
  return response.json();
};
