import React from 'react';
import { ResponsiveContainer, BarChart, Bar, XAxis, YAxis, CartesianGrid, LabelList, Cell } from 'recharts';
import { Indicator } from '../types';
import { useLanguage } from '../context/LanguageContext';
import { normalizeCategory, getCategoryColor, STANDARD_CATEGORIES } from '../utils/category';

interface Props {
  indicators: Indicator[];
  t: (key: string) => string;
  language: string;
}

const CATEGORY_LABELS: Record<string, { en: string; np: string }> = {
  'Infrastructure Creation': { en: 'Infrastructure', np: 'पूर्वाधार' },
  'Maintenance': { en: 'Maintenance', np: 'अनुगमन' },
  'Employment Creation': { en: 'Employment', np: 'रोजगारी' },
  'Budget Utilization': { en: 'Budget', np: 'बजेट' },
  'Governance': { en: 'Governance', np: 'सुशासन' },
};

export default function CategoryInsightsChart({ indicators, t, language }: Props) {
  const data = STANDARD_CATEGORIES.map((cat) => {
    const catIndicators = indicators.filter((ind) => normalizeCategory(ind.category) === cat);
    const avgPercent = catIndicators.length > 0
      ? Math.round(
          catIndicators.reduce((sum, ind) => {
            const pct = ind.annualTarget > 0 ? Math.min(100, (ind.annualProgress / ind.annualTarget) * 100) : 0;
            return sum + pct;
          }, 0) / catIndicators.length
        )
      : 0;
    const color = getCategoryColor(cat).hex;
    const label = CATEGORY_LABELS[cat] || { en: cat, np: cat };
    return {
      name: language === 'np' ? label.np : label.en,
      percent: avgPercent,
      color,
      count: catIndicators.length,
    };
  });

  return (
    <div className="h-64 w-full">
      <ResponsiveContainer width="100%" height="100%">
        <BarChart data={data} margin={{ top: 10, right: 10, left: -20, bottom: 30 }}>
          <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#e2e8f0" opacity={0.5} />
          <XAxis
            dataKey="name"
            axisLine={false}
            tickLine={false}
            tick={{ fontSize: 8, fill: '#64748b', fontWeight: 700 }}
            interval={0}
          />
          <YAxis
            axisLine={false}
            tickLine={false}
            tick={{ fontSize: 8, fill: '#94a3b8' }}
            domain={[0, 100]}
            tickFormatter={(value) => `${value}%`}
          />
          <Bar dataKey="percent" radius={[4, 4, 0, 0]} barSize={36}>
            {data.map((entry, index) => (
              <Cell key={`cell-${index}`} fill={entry.color} />
            ))}
            <LabelList
              dataKey="percent"
              position="top"
              formatter={(value: number) => `${value}%`}
              fontSize={9}
              fontWeight={800}
              fill="#64748b"
            />
          </Bar>
        </BarChart>
      </ResponsiveContainer>
    </div>
  );
}
