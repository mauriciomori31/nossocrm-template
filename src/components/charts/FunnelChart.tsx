import React from 'react';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts';

interface FunnelChartProps {
  data: Array<{ name: string; count: number }>;
}

export const FunnelChart: React.FC<FunnelChartProps> = ({ data }) => (
  <ResponsiveContainer width="100%" height="100%">
    <BarChart data={data} layout="vertical" margin={{ left: 0 }}>
      <CartesianGrid strokeDasharray="3 3" stroke="rgba(148, 163, 184, 0.1)" horizontal={false} />
      <XAxis type="number" axisLine={false} tickLine={false} hide />
      <YAxis
        dataKey="name"
        type="category"
        axisLine={false}
        tickLine={false}
        tick={{ fill: '#64748b', fontSize: 11 }}
        width={60}
      />
      <Tooltip
        cursor={{ fill: 'rgba(255,255,255,0.05)' }}
        contentStyle={{
          backgroundColor: '#0f172a',
          border: '1px solid rgba(255,255,255,0.1)',
          borderRadius: '12px',
          color: '#fff',
        }}
      />
      <Bar
        dataKey="count"
        fill="#6366f1"
        radius={[0, 4, 4, 0]}
        barSize={24}
        background={{ fill: 'rgba(255,255,255,0.05)' }}
      />
    </BarChart>
  </ResponsiveContainer>
);

export default FunnelChart;
