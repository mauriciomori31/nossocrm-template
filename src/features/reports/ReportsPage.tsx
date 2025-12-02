import React from 'react';
import { TrendingUp, Clock, Target } from 'lucide-react';
import { useDashboardMetrics } from '../dashboard/hooks/useDashboardMetrics';
import { LazyRevenueTrendChart, ChartWrapper } from '@/components/charts';

const ReportsPage: React.FC = () => {
  const {
    trendData,
    avgSalesCycle,
    fastestDeal,
    slowestDeal,
    wonDealsWithDates,
    actualWinRate,
    wonDeals,
    lostDeals,
    topLossReasons,
    topDeals,
  } = useDashboardMetrics();

  return (
    <div className="space-y-6 max-w-[1600px] mx-auto pb-10">
      <div>
        <h1 className="text-3xl font-bold text-slate-900 dark:text-white font-display tracking-tight">
          Relatórios de Performance
        </h1>
        <p className="text-slate-500 dark:text-slate-400 text-sm mt-1">
          Análise detalhada de vendas e tendências.
        </p>
      </div>

      {/* Revenue Trend */}
      <div className="glass p-6 rounded-xl border border-slate-200 dark:border-white/5 shadow-sm">
        <div className="flex justify-between items-center mb-6">
          <h3 className="text-lg font-bold text-slate-900 dark:text-white font-display">
            Tendência de Receita
          </h3>
          <span className="text-xs text-slate-500 bg-slate-100 dark:bg-white/5 px-2 py-1 rounded">
            Últimos 6 Meses
          </span>
        </div>
        <div className="h-80 w-full">
          <ChartWrapper height={320}>
            <LazyRevenueTrendChart data={trendData} />
          </ChartWrapper>
        </div>
      </div>

      {/* Sales Cycle & Win/Loss Analysis */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Sales Cycle Metrics */}
        <div className="glass p-6 rounded-xl border border-slate-200 dark:border-white/5 shadow-sm">
          <h2 className="text-xl font-bold text-slate-900 dark:text-white font-display mb-4 flex items-center gap-2">
            <Clock className="text-blue-500" size={24} />
            Ciclo de Vendas
          </h2>
          <div className="grid grid-cols-3 gap-4">
            <div>
              <p className="text-xs text-slate-500 dark:text-slate-400 mb-1">Média</p>
              <p className="text-2xl font-bold text-slate-900 dark:text-white">
                {avgSalesCycle} dias
              </p>
            </div>
            <div>
              <p className="text-xs text-slate-500 dark:text-slate-400 mb-1">Mais Rápido</p>
              <p className="text-2xl font-bold text-green-600 dark:text-green-400">
                {fastestDeal} dias
              </p>
            </div>
            <div>
              <p className="text-xs text-slate-500 dark:text-slate-400 mb-1">Mais Lento</p>
              <p className="text-2xl font-bold text-red-600 dark:text-red-400">
                {slowestDeal} dias
              </p>
            </div>
          </div>
          <p className="text-xs text-slate-500 mt-4">
            Baseado em {wonDealsWithDates.length} negócios fechados.
          </p>
        </div>

        {/* Win/Loss Analysis */}
        <div className="glass p-6 rounded-xl border border-slate-200 dark:border-white/5 shadow-sm">
          <h2 className="text-xl font-bold text-slate-900 dark:text-white font-display mb-4 flex items-center gap-2">
            <Target className="text-emerald-500" size={24} />
            Win/Loss Analysis
          </h2>
          <div className="flex items-center justify-between mb-4">
            <div>
              <p className="text-xs text-slate-500 dark:text-slate-400 mb-1">Taxa de Vitória</p>
              <p className="text-3xl font-bold text-slate-900 dark:text-white">
                {actualWinRate.toFixed(1)}%
              </p>
            </div>
            <div className="text-right">
              <p className="text-xs text-slate-500 dark:text-slate-400 mb-1">Ganhos / Perdas</p>
              <p className="text-lg font-bold">
                <span className="text-green-600 dark:text-green-400">{wonDeals.length}</span>
                <span className="text-slate-400 mx-1">/</span>
                <span className="text-red-600 dark:text-red-400">{lostDeals.length}</span>
              </p>
            </div>
          </div>
          {topLossReasons.length > 0 && (
            <div>
              <p className="text-xs font-bold text-slate-500 dark:text-slate-400 uppercase mb-2">
                Top Motivos de Perda
              </p>
              <div className="space-y-2">
                {topLossReasons.map(([reason, count]) => (
                  <div key={reason} className="flex items-center gap-2">
                    <div className="flex-1 bg-slate-100 dark:bg-white/10 rounded-full h-2 overflow-hidden">
                      <div
                        className="bg-red-500 h-full"
                        style={{ width: `${((count as number) / lostDeals.length) * 100}%` }}
                      />
                    </div>
                    <span className="text-xs text-slate-600 dark:text-slate-300 w-32 truncate">
                      {reason}
                    </span>
                    <span className="text-xs font-bold text-slate-900 dark:text-white w-8 text-right">
                      {count}
                    </span>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Top Deals */}
      <div className="glass p-6 rounded-xl border border-slate-200 dark:border-white/5 shadow-sm">
        <div className="flex justify-between items-center mb-4">
          <h3 className="text-lg font-bold text-slate-900 dark:text-white font-display">
            Top Oportunidades
          </h3>
          <button className="text-primary-500 text-sm hover:underline">Ver todas</button>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full text-left text-sm">
            <thead className="text-xs text-slate-500 dark:text-slate-400 uppercase bg-slate-50 dark:bg-white/5 border-y border-slate-100 dark:border-white/5">
              <tr>
                <th className="px-4 py-2 font-medium">Oportunidade</th>
                <th className="px-4 py-2 font-medium">Valor</th>
                <th className="px-4 py-2 font-medium">Probabilidade</th>
                <th className="px-4 py-2 font-medium">Dono</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 dark:divide-white/5">
              {topDeals.map(deal => (
                <tr
                  key={deal.id}
                  className="hover:bg-slate-50/50 dark:hover:bg-white/5 transition-colors"
                >
                  <td className="px-4 py-3 font-medium text-slate-900 dark:text-white">
                    {deal.title}
                  </td>
                  <td className="px-4 py-3 text-slate-600 dark:text-slate-300 font-mono">
                    ${deal.value.toLocaleString()}
                  </td>
                  <td className="px-4 py-3">
                    <div className="flex items-center gap-2">
                      <div className="w-16 h-1.5 bg-slate-200 dark:bg-slate-700 rounded-full overflow-hidden">
                        <div
                          className="h-full bg-emerald-500 rounded-full"
                          style={{ width: `${deal.probability}%` }}
                        ></div>
                      </div>
                      <span className="text-xs text-slate-500">{deal.probability}%</span>
                    </div>
                  </td>
                  <td className="px-4 py-3">
                    <img
                      src={deal.owner?.avatar}
                      alt={deal.owner?.name}
                      className="w-6 h-6 rounded-full ring-2 ring-white dark:ring-slate-800"
                      title={deal.owner?.name}
                    />
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};

export default ReportsPage;
