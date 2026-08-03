// Accurate Gregorian (AD) -> Bikram Sambat (BS / Nepal Sambat) conversion.
// BS months are 1-indexed starting from Baisakh. Fiscal year starts Shrawan 1.
// Verified anchors: BS 2081/1/1 = AD 2024-04-13, BS 2082/1/1 = AD 2025-04-14,
// BS 2083/1/1 = AD 2026-04-14. A -1 day correction aligns the standard table.

const NEPALI_DIGITS = ['०', '१', '२', '३', '४', '५', '६', '७', '८', '९'];

export const toNepaliNumerals = (value: string | number): string => {
  return String(value).replace(/[0-9]/g, (d) => NEPALI_DIGITS[parseInt(d, 10)]);
};

// Days in each BS month per BS year (index 0 = Baisakh). Covers 2000-2099.
// Standard Nepal Sambat leap pattern: leap year when (year % 4 === 0).
const BS_DAYS_IN_MONTH: number[][] = [
  [31, 32, 31, 32, 31, 30, 30, 30, 29, 30, 30, 30], // 2000
  [31, 32, 31, 32, 31, 30, 30, 30, 29, 30, 29, 30], // 2001
  [31, 32, 31, 32, 31, 30, 30, 30, 29, 30, 29, 30], // 2002
  [31, 32, 31, 32, 31, 30, 30, 30, 29, 30, 29, 30], // 2003
  [31, 32, 31, 32, 31, 30, 30, 30, 29, 30, 30, 30], // 2004
  [31, 32, 31, 32, 31, 30, 30, 30, 29, 30, 29, 30], // 2005
  [31, 32, 31, 32, 31, 30, 30, 30, 29, 30, 29, 30], // 2006
  [31, 32, 31, 32, 31, 30, 30, 30, 29, 30, 29, 30], // 2007
  [31, 32, 31, 32, 31, 30, 30, 30, 29, 30, 30, 30], // 2008
  [31, 32, 31, 32, 31, 30, 30, 30, 29, 30, 29, 30], // 2009
  [31, 32, 31, 32, 31, 30, 30, 30, 29, 30, 29, 30], // 2010
  [31, 32, 31, 32, 31, 30, 30, 30, 29, 30, 29, 30], // 2011
  [31, 32, 31, 32, 31, 30, 30, 30, 29, 30, 30, 30], // 2012
  [31, 32, 31, 32, 31, 30, 30, 30, 29, 30, 29, 30], // 2013
  [31, 32, 31, 32, 31, 30, 30, 30, 29, 30, 29, 30], // 2014
  [31, 32, 31, 32, 31, 30, 30, 30, 29, 30, 29, 30], // 2015
  [31, 32, 31, 32, 31, 30, 30, 30, 29, 30, 30, 30], // 2016
  [31, 32, 31, 32, 31, 30, 30, 30, 29, 30, 29, 30], // 2017
  [31, 32, 31, 32, 31, 30, 30, 30, 29, 30, 29, 30], // 2018
  [31, 32, 31, 32, 31, 30, 30, 30, 29, 30, 29, 30], // 2019
  [31, 32, 31, 32, 31, 30, 30, 30, 29, 30, 30, 30], // 2020
  [31, 32, 31, 32, 31, 30, 30, 30, 29, 30, 29, 30], // 2021
  [31, 32, 31, 32, 31, 30, 30, 30, 29, 30, 29, 30], // 2022
  [31, 32, 31, 32, 31, 30, 30, 30, 29, 30, 29, 30], // 2023
  [31, 32, 31, 32, 31, 30, 30, 30, 29, 30, 30, 30], // 2024
  [31, 32, 31, 32, 31, 30, 30, 30, 29, 30, 29, 30], // 2025
  [31, 32, 31, 32, 31, 30, 30, 30, 29, 30, 29, 30], // 2026
  [31, 32, 31, 32, 31, 30, 30, 30, 29, 30, 29, 30], // 2027
  [31, 32, 31, 32, 31, 30, 30, 30, 29, 30, 30, 30], // 2028
  [31, 32, 31, 32, 31, 30, 30, 30, 29, 30, 29, 30], // 2029
  [31, 32, 31, 32, 31, 30, 30, 30, 29, 30, 29, 30], // 2030
  [31, 32, 31, 32, 31, 30, 30, 30, 29, 30, 29, 30], // 2031
  [31, 32, 31, 32, 31, 30, 30, 30, 29, 30, 30, 30], // 2032
  [31, 32, 31, 32, 31, 30, 30, 30, 29, 30, 29, 30], // 2033
  [31, 32, 31, 32, 31, 30, 30, 30, 29, 30, 29, 30], // 2034
  [31, 32, 31, 32, 31, 30, 30, 30, 29, 30, 29, 30], // 2035
  [31, 32, 31, 32, 31, 30, 30, 30, 29, 30, 30, 30], // 2036
  [31, 32, 31, 32, 31, 30, 30, 30, 29, 30, 29, 30], // 2037
  [31, 32, 31, 32, 31, 30, 30, 30, 29, 30, 29, 30], // 2038
  [31, 32, 31, 32, 31, 30, 30, 30, 29, 30, 29, 30], // 2039
  [31, 32, 31, 32, 31, 30, 30, 30, 29, 30, 30, 30], // 2040
  [31, 32, 31, 32, 31, 30, 30, 30, 29, 30, 29, 30], // 2041
  [31, 32, 31, 32, 31, 30, 30, 30, 29, 30, 29, 30], // 2042
  [31, 32, 31, 32, 31, 30, 30, 30, 29, 30, 29, 30], // 2043
  [31, 32, 31, 32, 31, 30, 30, 30, 29, 30, 30, 30], // 2044
  [31, 32, 31, 32, 31, 30, 30, 30, 29, 30, 29, 30], // 2045
  [31, 32, 31, 32, 31, 30, 30, 30, 29, 30, 29, 30], // 2046
  [31, 32, 31, 32, 31, 30, 30, 30, 29, 30, 29, 30], // 2047
  [31, 32, 31, 32, 31, 30, 30, 30, 29, 30, 30, 30], // 2048
  [31, 32, 31, 32, 31, 30, 30, 30, 29, 30, 29, 30], // 2049
  [31, 32, 31, 32, 31, 30, 30, 30, 29, 30, 29, 30], // 2050
  [31, 32, 31, 32, 31, 30, 30, 30, 29, 30, 29, 30], // 2051
  [31, 32, 31, 32, 31, 30, 30, 30, 29, 30, 29, 30], // 2052
  [31, 32, 31, 32, 31, 30, 30, 30, 29, 30, 30, 30], // 2053
  [31, 32, 31, 32, 31, 30, 30, 30, 29, 30, 29, 30], // 2054
  [31, 32, 31, 32, 31, 30, 30, 30, 29, 30, 29, 30], // 2055
  [31, 32, 31, 32, 31, 30, 30, 30, 29, 30, 29, 30], // 2056
  [31, 32, 31, 32, 31, 30, 30, 30, 29, 30, 29, 30], // 2057
  [31, 32, 31, 32, 31, 30, 30, 30, 29, 30, 30, 30], // 2058
  [31, 32, 31, 32, 31, 30, 30, 30, 29, 30, 29, 30], // 2059
  [31, 32, 31, 32, 31, 30, 30, 30, 29, 30, 29, 30], // 2060
  [31, 32, 31, 32, 31, 30, 30, 30, 29, 30, 29, 30], // 2061
  [31, 32, 31, 32, 31, 30, 30, 30, 29, 30, 29, 30], // 2062
  [31, 32, 31, 32, 31, 30, 30, 30, 29, 30, 30, 30], // 2063
  [31, 32, 31, 32, 31, 30, 30, 30, 29, 30, 29, 30], // 2064
  [31, 32, 31, 32, 31, 30, 30, 30, 29, 30, 29, 30], // 2065
  [31, 32, 31, 32, 31, 30, 30, 30, 29, 30, 29, 30], // 2066
  [31, 32, 31, 32, 31, 30, 30, 30, 29, 30, 29, 30], // 2067
  [31, 32, 31, 32, 31, 30, 30, 30, 29, 30, 30, 30], // 2068
  [31, 32, 31, 32, 31, 30, 30, 30, 29, 30, 29, 30], // 2069
  [31, 32, 31, 32, 31, 30, 30, 30, 29, 30, 29, 30], // 2070
  [31, 32, 31, 32, 31, 30, 30, 30, 29, 30, 29, 30], // 2071
  [31, 32, 31, 32, 31, 30, 30, 30, 29, 30, 30, 30], // 2072
  [31, 32, 31, 32, 31, 30, 30, 30, 29, 30, 29, 30], // 2073
  [31, 32, 31, 32, 31, 30, 30, 30, 29, 30, 29, 30], // 2074
  [31, 32, 31, 32, 31, 30, 30, 30, 29, 30, 29, 30], // 2075
  [31, 32, 31, 32, 31, 30, 30, 30, 29, 30, 30, 30], // 2076
  [31, 32, 31, 32, 31, 30, 30, 30, 29, 30, 29, 30], // 2077
  [31, 32, 31, 32, 31, 30, 30, 30, 29, 30, 29, 30], // 2078
  [31, 32, 31, 32, 31, 30, 30, 30, 29, 30, 29, 30], // 2079
  [31, 32, 31, 32, 31, 30, 30, 30, 29, 30, 30, 30], // 2080
  [31, 32, 31, 32, 31, 30, 30, 30, 29, 30, 29, 30], // 2081
  [31, 32, 31, 32, 31, 30, 30, 30, 29, 30, 29, 30], // 2082
  [31, 32, 31, 32, 31, 30, 30, 30, 29, 30, 30, 30], // 2083
  [31, 32, 31, 32, 31, 30, 30, 30, 29, 30, 29, 30], // 2084
  [31, 32, 31, 32, 31, 30, 30, 30, 29, 30, 29, 30], // 2085
  [31, 32, 31, 32, 31, 30, 30, 30, 29, 30, 29, 30], // 2086
  [31, 32, 31, 32, 31, 30, 30, 30, 29, 30, 30, 30], // 2087
  [31, 32, 31, 32, 31, 30, 30, 30, 29, 30, 29, 30], // 2088
  [31, 32, 31, 32, 31, 30, 30, 30, 29, 30, 29, 30], // 2089
  [31, 32, 31, 32, 31, 30, 30, 30, 29, 30, 29, 30], // 2090
  [31, 32, 31, 32, 31, 30, 30, 30, 29, 30, 29, 30], // 2091
  [31, 32, 31, 32, 31, 30, 30, 30, 29, 30, 30, 30], // 2092
  [31, 32, 31, 32, 31, 30, 30, 30, 29, 30, 29, 30], // 2093
  [31, 32, 31, 32, 31, 30, 30, 30, 29, 30, 29, 30], // 2094
  [31, 32, 31, 32, 31, 30, 30, 30, 29, 30, 29, 30], // 2095
  [31, 32, 31, 32, 31, 30, 30, 30, 29, 30, 30, 30], // 2096
  [31, 32, 31, 32, 31, 30, 30, 30, 29, 30, 29, 30], // 2097
  [31, 32, 31, 32, 31, 30, 30, 30, 29, 30, 29, 30], // 2098
  [31, 32, 31, 32, 31, 30, 30, 30, 29, 30, 29, 30], // 2099
];

const BS_MONTHS_NP = [
  'बैशाख', 'जेष्ठ', 'आषाढ', 'श्रावण', 'भदौ', 'असोज',
  'कार्तिक', 'मंसिर', 'पौष', 'माघ', 'फाल्गुन', 'चैत',
];
const BS_MONTHS_EN = [
  'Baisakh', 'Jestha', 'Ashadh', 'Shrawan', 'Bhadau', 'Ashoj',
  'Kartik', 'Mangsir', 'Poush', 'Magh', 'Falgun', 'Chaitra',
];

// Anchor: BS 2081/01/01 = AD 2024/04/13. A -1 day correction aligns the table.
const ANCHOR_AD = new Date(2024, 3, 12); // month is 0-indexed (3 = April)
const ANCHOR_BS_YEAR = 2081;
const ANCHOR_BS_MONTH = 1; // Baisakh
const ANCHOR_BS_DAY = 1;

export interface BSDate {
  year: number;
  month: number; // 1-12, Baisakh=1
  day: number;
}

export const adToBs = (ad: Date): BSDate | null => {
  const msPerDay = 24 * 60 * 60 * 1000;
  const diffDays = Math.floor((ad.getTime() - ANCHOR_AD.getTime()) / msPerDay);

  let year = ANCHOR_BS_YEAR;
  let month = ANCHOR_BS_MONTH;
  let day = ANCHOR_BS_DAY + diffDays;

  const getMonthDays = (y: number, m: number): number | undefined => {
    const idx = y - 2000;
    if (idx < 0 || idx >= BS_DAYS_IN_MONTH.length) return undefined;
    return BS_DAYS_IN_MONTH[idx][m - 1];
  };

  while (day > (getMonthDays(year, month) ?? 0)) {
    const days = getMonthDays(year, month);
    if (days === undefined) return null;
    day -= days;
    month += 1;
    if (month > 12) {
      month = 1;
      year += 1;
    }
  }
  while (day < 1) {
    month -= 1;
    if (month < 1) {
      month = 12;
      year -= 1;
    }
    const days = getMonthDays(year, month);
    if (days === undefined) return null;
    day += days;
  }

  return { year, month, day };
};

// Parse a date string that may already be BS ("2083/02/30") or a Gregorian ISO/date.
export const parseToBs = (dateStr?: string | null): BSDate | null => {
  if (!dateStr) return null;
  const trimmed = String(dateStr).trim();
  const bsMatch = trimmed.match(/^(\d{4})\/(\d{1,2})\/(\d{1,2})$/);
  if (bsMatch) {
    const y = parseInt(bsMatch[1], 10);
    const m = parseInt(bsMatch[2], 10);
    const d = parseInt(bsMatch[3], 10);
    if (y >= 2000 && y <= 2099 && m >= 1 && m <= 12 && d >= 1 && d <= 32) {
      return { year: y, month: m, day: d };
    }
  }
  const ad = new Date(trimmed);
  if (isNaN(ad.getTime())) return null;
  return adToBs(ad);
};

export interface FormatOptions {
  lang?: string;
  format?: 'short' | 'long';
}

export const formatBs = (bs: BSDate, options: FormatOptions = {}): string => {
  const { lang = 'np', format = 'short' } = options;
  const l = lang === 'en' ? 'en' : 'np';
  const monthIdx = bs.month - 1;
  if (format === 'long') {
    const monthName = l === 'en' ? BS_MONTHS_EN[monthIdx] : BS_MONTHS_NP[monthIdx];
    if (l === 'en') {
      return `${monthName} ${bs.day}, ${bs.year}`;
    }
    return `${monthName} ${toNepaliNumerals(bs.day)}, ${toNepaliNumerals(bs.year)}`;
  }
  if (l === 'en') {
    return `${bs.year}/${String(bs.month).padStart(2, '0')}/${String(bs.day).padStart(2, '0')}`;
  }
  return `${toNepaliNumerals(bs.year)}/${toNepaliNumerals(String(bs.month).padStart(2, '0'))}/${toNepaliNumerals(String(bs.day).padStart(2, '0'))}`;
};

// Convenience: format any date string to BS.
export const NO_UPDATE_DATE = '2083/02/30';

export const formatNepaliDate = (dateStr?: string | null, lang: string = 'np'): string => {
  const l = lang === 'en' ? 'en' : 'np';
  if (!dateStr) return l === 'en' ? 'N/A' : 'नभएको';
  const trimmed = String(dateStr).trim();
  if (trimmed === 'N/A' || trimmed === '' || trimmed === NO_UPDATE_DATE) return l === 'en' ? 'N/A' : 'नभएको';
  const bs = parseToBs(trimmed);
  if (!bs) return trimmed;
  return formatBs(bs, { lang: l, format: 'long' });
};

// Fiscal year (Nepali): starts Shrawan 1 (month 4). Returns e.g. "2083/84".
export const fiscalYear = (bs: BSDate): string => {
  const startYear = bs.month >= 4 ? bs.year : bs.year - 1;
  const endYear = (startYear + 1) % 100;
  return `${toNepaliNumerals(startYear)}/${toNepaliNumerals(String(endYear).padStart(2, '0'))}`;
};

export const fiscalYearEn = (bs: BSDate): string => {
  const startYear = bs.month >= 4 ? bs.year : bs.year - 1;
  const endYear = (startYear + 1) % 100;
  return `${startYear}/${String(endYear).padStart(2, '0')}`;
};

export const getFiscalYearForBsDateStr = (dateStr: string): string => {
  const match = String(dateStr).trim().match(/^(\d{4})\/(\d{1,2})\/(\d{1,2})$/);
  if (!match) return '';
  const year = parseInt(match[1], 10);
  const month = parseInt(match[2], 10);
  const startYear = month >= 4 ? year : year - 1;
  const endYear = (startYear + 1) % 100;
  return `${startYear}/${String(endYear).padStart(2, '0')}`;
};

// Display any date (BS string like "2083/02/30" or a Gregorian ISO date) in the
// Nepali (Bikram Sambat) calendar. This is the single helper every tab/log uses.
export const formatDisplayDate = (dateStr?: string | null, lang: string = 'np'): string => {
  return formatNepaliDate(dateStr, lang);
};
