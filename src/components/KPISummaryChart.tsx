import React from 'react';
import { ResponsiveContainer, BarChart, Bar, XAxis, YAxis, Tooltip, CartesianGrid, Cell } from 'recharts';
import { Indicator } from '../types';
import { getStatusBadge } from '../utils/status';

interface Props {
  indicators: Indicator[];
  t: (key: string) => string;
  language: string;
}

export const KPISummaryChart: React.FC<Props> = ({ indicators, t, language }) => {
  const data = (indicators || []).slice(0, 10).map(ind => {
    const percent = ind.annualTarget > 0 ? Math.min(100, Math.round((ind.annualProgress / ind.annualTarget) * 100)) : 0;
    const name = language === 'en' ? (ind.nameEn || ind.name) : ind.name;
    const truncatedName = name.length > 12 ? name.substring(0, 10) + '..' : name;
    const { status } = getStatusBadge(percent, t);
    
    return {
      name: truncatedName,
      fullName: name,
      value: percent,
      status,
      fullInd: ind
    };
  });

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'excellent': return '#10b981'; // emerald-500
      case 'onTrack': return '#3b82f6';   // blue-500
      case 'progressing': return '#6366f1'; // indigo-500
      case 'atRisk': return '#f59e0b';    // amber-500
      case 'delayed': return '#ef4444';    // red-500
      default: return '#6366f1';
    }
  };

  return (
    <div className="h-48 w-full">
      <ResponsiveContainer width="100%" height="100%">
        <BarChart data={data} margin={{ top: 10, right: 10, left: -20, bottom: 20 }}>
          <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#e2e8f0" opacity={0.5} />
          <XAxis 
            dataKey="name" 
            axisLine={false}
            tickLine={false}
            tick={{ fontSize: 7, fill: '#94a3b8' }}
            interval={0}
            angle={-30}
            textAnchor="end"
          />
          <YAxis 
            axisLine={false}
            tickLine={false}
            tick={{ fontSize: 7, fill: '#94a3b8' }}
            domain={[0, 100]}
            tickFormatter={(value) => `${value}%`}
          />
          <Tooltip 
            formatter={(value: any, name: any, props: any) => [value + '%', props.payload.fullName]}
            contentStyle={{ 
              borderRadius: '12px', 
              border: 'none', 
              boxShadow: '0 10px 15px -3px rgba(0, 0, 0, 0.1)',
              fontSize: '9px',
              fontWeight: 'bold'
            }}
          />
          <Bar dataKey="value" radius={[4, 4, 0, 0]} barSize={24}>
            {data.map((entry, index) => (
              <Cell key={`cell-${index}`} fill={getStatusColor(entry.status)} />
            ))}
          </Bar>
        </BarChart>
      </ResponsiveContainer>
    </div>
  );
};
