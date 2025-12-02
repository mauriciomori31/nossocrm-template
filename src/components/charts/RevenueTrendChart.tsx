import React from 'react';
import {
  AreaChart,
  Area,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
} from 'recharts';

interface RevenueTrendChartProps {
  data: Array<{ month: string; revenue: number }>;
}

export const RevenueTrendChart: React.FC<RevenueTrendChartProps> = ({ data }) => (
  <ResponsiveContainer width="100%" height="100%">
    <AreaChart data={data}>
      <defs>
        <linearGradient id="colorRevenue" x1="0" y1="0" x2="0" y2="1">
          <stop offset="5%" stopColor="#0ea5e9" stopOpacity={0.3} />
          <stop offset="95%" stopColor="#0ea5e9" stopOpacity={0} />
        </linearGradient>
      </defs>
      <CartesianGrid strokeDasharray="3 3" stroke="rgba(148, 163, 184, 0.1)" vertical={false} />
      <XAxis
        dataKey="month"
        axisLine={false}
        tickLine={false}
        tick={{ fill: '#64748b', fontSize: 12 }}
        dy={10}
      />
      <YAxis
        axisLine={false}
        tickLine={false}
        tick={{ fill: '#64748b', fontSize: 12 }}
        tickFormatter={value => `$${value / 1000}k`}
      />
      <Tooltip
        contentStyle={{
          backgroundColor: '#0f172a',
          border: '1px solid rgba(255,255,255,0.1)',
          borderRadius: '12px',
          color: '#fff',
          boxShadow: '0 4px 6px -1px rgba(0, 0, 0, 0.1)',
        }}
        itemStyle={{ color: '#bae6fd' }}
        labelStyle={{ color: '#94a3b8' }}
      />
      <Area
        type="monotone"
        dataKey="revenue"
        stroke="#0ea5e9"
        strokeWidth={3}
        fillOpacity={1}
        fill="url(#colorRevenue)"
      />
    </AreaChart>
  </ResponsiveContainer>
);

export default RevenueTrendChart;
