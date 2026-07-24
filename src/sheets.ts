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

export interface SheetPermission {
  emailAddress?: string;
  role: string;
  type: string;
  displayName?: string;
}

export const fetchSheetPermissions = async (fileId: string, accessToken: string): Promise<SheetPermission[]> => {
  const response = await fetch(`${API_BASE}/api/sheets-permissions/${encodeURIComponent(fileId)}`, {
    headers: { Authorization: `Bearer ${accessToken}` },
  });
  if (!response.ok) {
    const err = await response.json().catch(() => ({ error: 'Failed to fetch permissions' }));
    throw new Error(err.error || 'Failed to fetch sheet permissions');
  }
  const data = await response.json();
  return data.permissions || [];
};
