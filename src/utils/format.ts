const toNepaliNumerals = (numStr: string | number): string => {
  const nepaliDigits = ['०', '१', '२', '३', '४', '५', '६', '७', '८', '९'];
  return String(numStr).replace(/[0-9]/g, (digit) => nepaliDigits[parseInt(digit, 10)]);
};

export const formatNumber = (value: number | string | undefined | null, language: 'en' | 'ne' | 'np' = 'en'): string => {
  if (value === undefined || value === null) return '—';
  const num = typeof value === 'string' ? parseFloat(value) : value;
  if (Number.isNaN(num)) return String(value);
  const formatted = num.toLocaleString('en-US');
  const lang = language === 'ne' ? 'np' : language;
  return lang === 'np' ? toNepaliNumerals(formatted) : formatted;
};

export const formatPercent = (value: number | string | undefined | null, language: 'en' | 'ne' | 'np' = 'en'): string => {
  const formatted = formatNumber(value, language);
  if (formatted === '—') return '—';
  return `${formatted}%`;
};

export const formatDuration = (seconds: number): string => {
  const mins = Math.floor(seconds / 60);
  const secs = seconds % 60;
  if (mins === 0) return `${secs}s`;
  if (secs === 0) return `${mins}m`;
  return `${mins}m ${secs}s`;
};

export default formatNumber;
