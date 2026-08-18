import React from 'react';
import { useLanguage } from '../context/LanguageContext';

interface PremiumTooltipProps {
  active?: boolean;
  payload?: any[];
  language?: 'en' | 'ne';
  label?: string;
  value?: string | number;
  unit?: string;
  isPercentage?: boolean;
  date?: string;
  secondaryLabel?: string;
  secondaryValue?: string | number;
}

const toNepaliNumerals = (numStr: string | number): string => {
  const nepaliDigits = ['०', '१', '२', '३', '४', '५', '६', '७', '८', '९'];
  return String(numStr).replace(/[0-9]/g, (digit) => nepaliDigits[parseInt(digit, 10)]);
};

export const PremiumTooltip: React.FC<PremiumTooltipProps> = ({
  active,
  payload,
  language = 'en',
  label,
  value,
  unit,
  isPercentage = true,
  date,
  secondaryLabel,
  secondaryValue,
}) => {
  if (!active || !payload || !payload.length) return null;

  const data = payload[0].payload;
  const displayValue = value ?? data.value;
  const displayLabel = label ?? data.labelEn ?? data.label ?? '';
  const displayDate = date ?? data.date ?? '';
  const isNepali = language === 'ne';

  const formatValue = (val: string | number | undefined): string => {
    if (val === undefined || val === null) return '';
    const raw = typeof val === 'number' ? (isNepali ? toNepaliNumerals(val.toLocaleString()) : val.toLocaleString()) : String(val);
    if (isPercentage) return `${raw}%`;
    if (unit) return `${raw} ${unit}`;
    return raw;
  };

  return (
    <div className="bg-slate-900/95 dark:bg-slate-950/95 border border-slate-700/50 dark:border-white/10 px-3.5 py-2.5 rounded-2xl shadow-2xl text-[11px] text-white font-medium pointer-events-none backdrop-blur-md z-50 min-w-[140px]">
      {displayLabel && (
        <div className="font-extrabold text-indigo-400 mb-1.5 leading-tight text-[10px] uppercase tracking-wider">
          {isNepali && typeof displayLabel === 'string' && /^\d+$/.test(displayLabel) ? toNepaliNumerals(displayLabel) : displayLabel}
        </div>
      )}
      <div className="space-y-1.5">
        {displayValue !== undefined && (
          <div className="flex items-center justify-between gap-4">
            <span className="text-slate-400 font-semibold text-[10px]">{language === 'en' ? 'Value' : 'मान'}:</span>
            <span className="font-black text-indigo-300 text-[11px]">{formatValue(displayValue)}</span>
          </div>
        )}
        {displayDate && (
          <div className="flex items-center justify-between gap-4">
            <span className="text-slate-400 font-semibold text-[10px]">{language === 'en' ? 'Date' : 'मिति'}:</span>
            <span className="font-bold text-slate-200 text-[10px]">{isNepali ? toNepaliNumerals(displayDate) : displayDate}</span>
          </div>
        )}
        {secondaryLabel && secondaryValue !== undefined && (
          <div className="flex items-center justify-between gap-4 pt-1.5 border-t border-white/5">
            <span className="text-slate-400 font-semibold text-[10px]">{secondaryLabel}:</span>
            <span className="font-bold text-slate-200 text-[10px]">{formatValue(secondaryValue)}</span>
          </div>
        )}
      </div>
    </div>
  );
};
