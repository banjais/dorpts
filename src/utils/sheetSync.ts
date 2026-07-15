import { fetchSheetData } from '../sheets';
import {
  parseGoogleSheetsCSV,
  parseCSVLine,
  DEFAULT_INDICATORS,
} from '../data';
import { getOfficeByEmail } from './officeDetector';

const SPREADSHEET_ID = '1ohBXufi7WEvKVAdMavbM5ZQfWnjxveFxgR0FJZf4EJM';

export const PUBLISHED_CSV_URLS = {
  dashboard: `https://docs.google.com/spreadsheets/d/e/2PACX-1vQElDgCZtxw83cOi2p7MPCASAVlt1jFC0QnEW3LagOZeu4ecVCKcqrG9M2IumCgeyi4vgvhYTSn2mTl/pub?output=csv&gid=0`,
  offices: `https://docs.google.com/spreadsheets/d/e/2PACX-1vQElDgCZtxw83cOi2p7MPCASAVlt1jFC0QnEW3LagOZeu4ecVCKcqrG9M2IumCgeyi4vgvhYTSn2mTl/pub?output=csv&gid=40941786`,
};

export async function fetchPublishedCsv(url: string): Promise<string | null> {
  try {
    const res = await fetch(url);
    if (!res.ok) throw new Error('Failed to fetch published CSV');
    return await res.text();
  } catch {
    return null;
  }
}

export function buildCsvText(values: any[][]): string {
  return values
    .map((row) =>
      row
        .map((val) => {
          const str = String(val === undefined || val === null ? '' : val);
          return `"${str.replace(/"/g, '""')}"`;
        })
        .join(','),
    )
    .join('\n');
}

export function parseSheetCsv(csvText: string) {
  const lines = csvText.split('\n').map((line) => line.trim()).filter((line) => line.length > 0);
  const body = lines
    .map((line) => {
      const cols = parseCSVLine(line);
      return cols
        .map((val) => {
          const str = String(val === undefined || val === null ? '' : val);
          return `"${str.replace(/"/g, '""')}"`;
        })
        .join(',');
    })
    .join('\n');
  return parseGoogleSheetsCSV(body);
}

export function resolveOfficesFromSheet(indicators: any[]) {
  indicators.forEach((ind: any) => {
    if ((!ind.office || ind.office.trim() === '') && (ind.gmail || ind.updatedBy)) {
      ind.office = getOfficeByEmail(ind.gmail || ind.updatedBy) || ind.office;
    }
  });
  return indicators;
}

export async function syncPublishedSheets() {
  const [dashboardCsv, officesCsv] = await Promise.all([
    fetchPublishedCsv(PUBLISHED_CSV_URLS.dashboard),
    fetchPublishedCsv(PUBLISHED_CSV_URLS.offices),
  ]);

  if (!dashboardCsv) throw new Error('Dashboard sheet fetch failed');

  const { indicators, metadata } = parseSheetCsv(dashboardCsv);
  const finalIndicators = resolveOfficesFromSheet(indicators);

  const parsedOffices: { name: string; updated: string }[] = [];
  if (officesCsv) {
    const officesLines = officesCsv.split('\n').map((line) => line.trim()).filter((line) => line.length > 0);
    let headerRowIdx = -1;
    let officeColIdx = 1;
    for (let i = 0; i < officesLines.length; i++) {
      const cols = parseCSVLine(officesLines[i]);
      if (
        cols.some((val: string) => String(val).toLowerCase().includes('office') || String(val).toLowerCase().includes('कार्यालय'))
      ) {
        headerRowIdx = i;
        officeColIdx = cols.findIndex((val: string) => String(val).toLowerCase().includes('office') || String(val).toLowerCase().includes('कार्यालय'));
        if (officeColIdx === -1) officeColIdx = 1;
        break;
      }
    }
    const startRow = headerRowIdx !== -1 ? headerRowIdx + 1 : 0;
    for (let i = startRow; i < officesLines.length; i++) {
      const cols = parseCSVLine(officesLines[i]);
      if (!cols || cols.length <= officeColIdx) continue;
      const officeName = String(cols[officeColIdx] || '').trim();
      if (
        officeName &&
        officeName !== 'Total' &&
        officeName !== 'कुल' &&
        !officeName.toLowerCase().includes('note:') &&
        !officeName.includes('To be updated') &&
        !officeName.startsWith('=') &&
        officeName.length > 3
      ) {
        parsedOffices.push({ name: officeName, updated: 'Updated recently' });
      }
    }
  }

  return { indicators: finalIndicators, metadata, offices: parsedOffices };
}
