import {
  parseGoogleSheetsCSV,
  parseCSVLine,
} from '../data';
import { getOfficeByEmail } from './officeDetector';
import { Indicator } from '../types';

export const PUBLISHED_CSV_URLS = {
  dashboard: `https://docs.google.com/spreadsheets/d/e/2PACX-1vQElDgCZtxw83cOi2p7MPCASAVlt1jFC0QnEW3LagOZeu4ecVCKcqrG9M2IumCgeyi4vgvhYTSn2mTl/pub?output=csv&gid=0`,
  offices: `https://docs.google.com/spreadsheets/d/e/2PACX-1vQElDgCZtxw83cOi2p7MPCASAVlt1jFC0QnEW3LagOZeu4ecVCKcqrG9M2IumCgeyi4vgvhYTSn2mTl/pub?output=csv&gid=40941786`,
};

export async function fetchPublishedCsv(url: string): Promise<string | null> {
  try {
    const res = await fetch(url);
    if (!res.ok) throw new Error('Failed to fetch published CSV');
    const text = await res.text();
    if (typeof window !== 'undefined' && 'caches' in window) {
      try {
        const cache = await caches.open('indicator-overall-weight-csv-cache');
        await cache.put(url, new Response(text, { status: 200, headers: { 'Content-Type': 'text/csv' } }));
      } catch (_) {}
    }
    return text;
  } catch {
    if (typeof window !== 'undefined' && 'caches' in window) {
      try {
        const cache = await caches.open('indicator-overall-weight-csv-cache');
        const match = await cache.match(url);
        if (match) {
          return await match.text();
        }
      } catch (_) {}
    }
    return null;
  }
}

export function buildCsvText(values: unknown[][]): string {
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

export function resolveOfficesFromSheet(indicators: Indicator[]) {
  indicators.forEach((ind) => {
    if ((!ind.office || ind.office.trim() === '') && (ind.gmail || ind.updatedBy)) {
      ind.office = getOfficeByEmail(ind.gmail || ind.updatedBy || '') || ind.office;
    }
  });
  return indicators;
}

export async function syncPublishedSheets(urls?: { dashboard?: string; offices?: string }) {
  const dashboardUrl = urls?.dashboard || PUBLISHED_CSV_URLS.dashboard;
  const officesUrl = urls?.offices || PUBLISHED_CSV_URLS.offices;
  const [dashboardCsv, officesCsv] = await Promise.all([
    fetchPublishedCsv(dashboardUrl),
    fetchPublishedCsv(officesUrl),
  ]);

  if (!dashboardCsv) throw new Error('Dashboard sheet fetch failed');

  const { indicators, metadata } = parseSheetCsv(dashboardCsv);
  const finalIndicators = resolveOfficesFromSheet(indicators);

  const parsedOffices: { 
    name: string; 
    officeId: string; 
    shortName: string; 
    updated: string; 
    avgCompletion: number; 
    total: number 
  }[] = [];
  if (officesCsv) {
    const officesLines = officesCsv.split('\n').map((line) => line.trim()).filter((line) => line.length > 0);
    let headerRowIdx = -1;
    let officeColIdx = 1;
    let totalRowValues: number[] = [];

    // Find the Total summary row first
    for (let i = 0; i < officesLines.length; i++) {
      const cols = parseCSVLine(officesLines[i]);
      if (cols.some((val: string) => String(val).trim() === 'Total' || String(val).trim() === 'कुल')) {
        totalRowValues = cols.map((val: string) => {
          const num = parseFloat(String(val || '').replace(/,/g, ''));
          return isNaN(num) ? 0 : num;
        });
        break;
      }
    }

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
        !officeName ||
        officeName === 'Total' ||
        officeName === 'कुल' ||
        officeName.toLowerCase().includes('note:') ||
        officeName.includes('To be updated') ||
        officeName.startsWith('=') ||
        officeName.includes('कि.मि.') ||
        officeName.includes('कि. मि.') ||
        officeName.includes('Sum of') ||
        officeName.length <= 3
      ) {
        continue;
      }

      const dashIdx = officeName.indexOf('-');
      const officeId = dashIdx !== -1 ? officeName.slice(0, dashIdx).trim() : (officeName.match(/\d+/)?.[0] || '33701');
      const shortName = dashIdx !== -1 ? officeName.slice(dashIdx + 1).trim() : officeName;

      if (!officeId && !shortName) continue;

      let sumWeightedCompletion = 0;
      let totalWeightSum = 0;
      let count = 0;
      if (totalRowValues.length > 0) {
        for (let c = officeColIdx + 1; c < Math.min(cols.length, totalRowValues.length); c++) {
          const totalVal = totalRowValues[c];
          const officeVal = parseFloat(String(cols[c] || '').replace(/,/g, ''));
          const indIdx = c - (officeColIdx + 1);
          const weight = (finalIndicators[indIdx] && typeof finalIndicators[indIdx].weight === 'number' && finalIndicators[indIdx].weight! > 0)
            ? finalIndicators[indIdx].weight!
            : 1;
          if (!isNaN(officeVal) && officeVal >= 0 && totalVal > 0) {
            const completionPct = Math.min(100, (officeVal / totalVal) * 100);
            sumWeightedCompletion += completionPct * weight;
            totalWeightSum += weight;
            count++;
          }
        }
      }

      const avgCompletion = totalWeightSum > 0 
        ? Math.round(sumWeightedCompletion / totalWeightSum)
        : 0;

      console.log(`[SheetSync Verification] ${officeName} => Avg Weighted Completion: ${avgCompletion}% (Weighted Sum: ${sumWeightedCompletion.toFixed(1)} / Total Weight: ${totalWeightSum})`);

      parsedOffices.push({ 
        name: officeName, 
        officeId: officeId || '33701', 
        shortName, 
        updated: 'Updated recently',
        avgCompletion,
        total: count || 1
      });
    }
  }

  return { indicators: finalIndicators, metadata, offices: parsedOffices };
}
