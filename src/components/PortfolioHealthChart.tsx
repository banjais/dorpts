import React from 'react';
import { ResponsiveContainer, PieChart, Pie, Cell, Legend, BarChart, Bar, XAxis, YAxis, CartesianGrid, LabelList } from 'recharts';
import { motion, AnimatePresence } from 'motion/react';
import { Indicator } from '../types';
import { getStatusBadge } from '../utils/status';

interface Props {
  indicators: Indicator[];
  t: (key: string) => string;
  mode?: 'pie' | 'bar';
  height?: number;
}

export const PortfolioHealthChart: React.FC<Props> = ({ indicators, t, mode = 'bar', height = 220 }) => {
  const stats = (indicators || []).reduce((acc, ind) => {
    if (!ind) return acc;
    const percent = ind.annualTarget > 0 ? Math.min(100, Math.round((ind.annualProgress / ind.annualTarget) * 100)) : 0;
    const { status } = getStatusBadge(percent, t);
    acc[status] = (acc[status] || 0) + 1;
    return acc;
  }, { excellent: 0, onTrack: 0, progressing: 0, atRisk: 0, delayed: 0 } as Record<string, number>);

  const total = indicators.length;
  const data = [
    { name: t('excellent'), value: stats.excellent, percent: total > 0 ? Math.round((stats.excellent / total) * 100) : 0, color: '#10b981' },
    { name: t('onTrack'), value: stats.onTrack, percent: total > 0 ? Math.round((stats.onTrack / total) * 100) : 0, color: '#3b82f6' },
    { name: t('progressing'), value: stats.progressing, percent: total > 0 ? Math.round((stats.progressing / total) * 100) : 0, color: '#6366f1' },
    { name: t('atRisk'), value: stats.atRisk, percent: total > 0 ? Math.round((stats.atRisk / total) * 100) : 0, color: '#f59e0b' },
    { name: t('delayed'), value: stats.delayed, percent: total > 0 ? Math.round((stats.delayed / total) * 100) : 0, color: '#ef4444' },
  ];

  const chartData = data.filter(d => d.value > 0 || mode === 'bar');

  return (
    <div style={{ height: `${height}px` }} className="w-full overflow-hidden relative">
      <AnimatePresence mode="wait" initial={false}>
        {mode === 'bar' ? (
          <motion.div
            key="bar-chart"
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0, scale: 0.95 }}
            transition={{ duration: 0.3, ease: "easeInOut" }}
            className="absolute inset-0"
          >
            <ResponsiveContainer width="100%" height="100%">
                <BarChart data={chartData} margin={{ top: 20, right: 10, left: -20, bottom: 25 }}>
                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#e2e8f0" opacity={0.5} />
                <XAxis 
                  dataKey="name" 
                  axisLine={false}
                  tickLine={false}
                  tick={{ fontSize: 7, fill: '#94a3b8' }}
                />
                <YAxis 
                  axisLine={false}
                  tickLine={false}
                  tick={{ fontSize: 7, fill: '#94a3b8' }}
                />
                <Bar dataKey="value" radius={[4, 4, 0, 0]} barSize={32}>
                  {chartData.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={entry.color} />
                  ))}
                  <LabelList dataKey="percent" position="top" formatter={(value: number) => `${value}%`} fontSize={8} fontWeight={800} fill="#64748b" />
                </Bar>
              </BarChart>
            </ResponsiveContainer>
          </motion.div>
        ) : (
          <motion.div
            key="pie-chart"
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0, scale: 0.95 }}
            transition={{ duration: 0.3, ease: "easeInOut" }}
            className="absolute inset-0"
          >
            <ResponsiveContainer width="100%" height="100%">
              <PieChart>
                <Pie
                  data={chartData}
                  cx="50%"
                  cy="50%"
                  innerRadius={Math.round(height * 0.22)}
                  outerRadius={Math.round(height * 0.33)}
                  paddingAngle={5}
                  dataKey="value"
                >
                  {chartData.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={entry.color} />
                  ))}
                </Pie>
                <Legend 
                  verticalAlign="bottom" 
                  height={Math.round(height * 0.18)} 
                  iconType="circle" 
                  formatter={(value) => <span className="text-[7px] font-bold text-slate-500 tracking-tighter">{value}</span>}
                />
              </PieChart>
            </ResponsiveContainer>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
};
