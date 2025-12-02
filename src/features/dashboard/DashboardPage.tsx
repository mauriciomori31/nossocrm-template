import React, { useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useCRM } from '@/context/CRMContext';
import { useToast } from '@/context/ToastContext';
import { TrendingUp, Users, DollarSign, Target, Clock, MoreVertical } from 'lucide-react';
import { StatCard } from './components/StatCard';
import { ActivityFeedItem } from './components/ActivityFeedItem';
import { useDashboardMetrics } from './hooks/useDashboardMetrics';
import { LazyFunnelChart, ChartWrapper } from '@/components/charts';

const DashboardPage: React.FC = () => {
  const navigate = useNavigate();
  const { activities, checkWalletHealth } = useCRM();
  const { addToast } = useToast();

  useEffect(() => {
    console.log('DashboardPage mounted');
  }, []);

  const {
    deals,
    wonDeals,
    winRate,
    pipelineValue,
    topDeals,
    funnelData,
    trendData,
    activePercent,
    inactivePercent,
    churnedPercent,
    activeContacts,
    inactiveContacts,
    churnedContacts,
    riskyCount,
    avgLTV,
    avgSalesCycle,
    fastestDeal,
    slowestDeal,
    actualWinRate,
    lostDeals,
    topLossReasons,
    wonDealsWithDates,
  } = useDashboardMetrics();

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-bold text-slate-900 dark:text-white font-display tracking-tight">
            Visão Geral
          </h1>
          <p className="text-slate-500 dark:text-slate-400 text-sm mt-1">
            O pulso do seu negócio em tempo real.
          </p>
        </div>
        <div className="flex gap-3">
          <select className="glass border border-slate-200 dark:border-slate-700 text-sm rounded-lg px-4 py-2 text-slate-700 dark:text-slate-300 outline-none focus:ring-2 focus:ring-primary-500/50">
            <option>Este Mês</option>
            <option>Último Trimestre</option>
            <option>Este Ano</option>
          </select>
          <button
            onClick={async () => {
              const count = await checkWalletHealth();
              if (count > 0) {
                addToast(`${count} alertas de risco gerados na lista de atividades!`, 'warning');
              } else {
                addToast('Nenhum novo risco detectado. Carteira saudável!', 'success');
              }
            }}
            className="bg-white dark:bg-white/5 border border-slate-200 dark:border-slate-700 hover:bg-slate-50 dark:hover:bg-white/10 text-slate-700 dark:text-slate-300 px-5 py-2 rounded-lg text-sm font-medium transition-all"
          >
            Análise de Carteira
          </button>
          <button className="bg-primary-600 hover:bg-primary-500 text-white px-5 py-2 rounded-lg text-sm font-medium transition-all shadow-lg shadow-primary-600/20">
            Baixar Relatório
          </button>
        </div>
      </div>

      {/* KPI Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <StatCard
          title="Pipeline Total"
          value={`$${pipelineValue.toLocaleString()}`}
          subtext="+12.5%"
          icon={DollarSign}
          color="bg-blue-500"
          onClick={() => navigate('/pipeline')}
        />
        <StatCard
          title="Negócios Ativos"
          value={`${deals.length - wonDeals.length}`}
          subtext="+5.2%"
          icon={Users}
          color="bg-purple-500"
          onClick={() => navigate('/pipeline')}
        />
        <StatCard
          title="Conversão"
          value={`${winRate.toFixed(1)}%`}
          subtext="+2.1%"
          icon={Target}
          color="bg-emerald-500"
          onClick={() => navigate('/radar')}
        />
        <StatCard
          title="Receita (Ganha)"
          value={`$${wonDeals.reduce((acc, l) => acc + l.value, 0).toLocaleString()}`}
          subtext="+18%"
          icon={TrendingUp}
          color="bg-orange-500"
          onClick={() => navigate('/pipeline')}
        />
      </div>

      {/* Wallet Health Section */}
      <div className="space-y-6">
        <h2 className="text-xl font-bold text-slate-900 dark:text-white font-display mb-4 flex items-center gap-2">
          <Users className="text-primary-500" size={24} />
          Saúde da Carteira
        </h2>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <div
            className="glass p-6 rounded-xl border border-slate-200 dark:border-white/5 shadow-sm cursor-pointer hover:border-primary-500/50 transition-colors"
            onClick={() => navigate('/contacts')}
          >
            <h3 className="text-sm font-medium text-slate-500 dark:text-slate-400 mb-2">
              Distribuição da Carteira
            </h3>
            <div className="flex items-end gap-2 mb-2">
              <span className="text-2xl font-bold text-slate-900 dark:text-white">
                {activePercent}%
              </span>
              <span className="text-xs text-green-500 font-bold mb-1">Ativos</span>
            </div>
            <div className="w-full bg-slate-100 dark:bg-white/10 rounded-full h-2 overflow-hidden flex">
              <div
                className="bg-green-500 h-full"
                style={{ width: `${activePercent}%` }}
                title="Ativos"
              ></div>
              <div
                className="bg-yellow-500 h-full"
                style={{ width: `${inactivePercent}%` }}
                title="Inativos"
              ></div>
              <div
                className="bg-red-500 h-full"
                style={{ width: `${churnedPercent}%` }}
                title="Churn"
              ></div>
            </div>
            <div className="flex justify-between mt-2 text-xs text-slate-500">
              <div className="flex items-center gap-1">
                <div className="w-2 h-2 rounded-full bg-green-500"></div> Ativos (
                {activeContacts.length})
              </div>
              <div className="flex items-center gap-1">
                <div className="w-2 h-2 rounded-full bg-yellow-500"></div> Inativos (
                {inactiveContacts.length})
              </div>
              <div className="flex items-center gap-1">
                <div className="w-2 h-2 rounded-full bg-red-500"></div> Churn (
                {churnedContacts.length})
              </div>
            </div>
          </div>

          <div
            className="glass p-6 rounded-xl border border-slate-200 dark:border-white/5 shadow-sm cursor-pointer hover:border-red-500/50 transition-colors"
            onClick={() => navigate('/contacts?filter=RISK')}
          >
            <h3 className="text-sm font-medium text-slate-500 dark:text-slate-400 mb-2">
              Risco de Churn
            </h3>
            <div className="flex items-end gap-2">
              <span className="text-2xl font-bold text-slate-900 dark:text-white">
                {riskyCount} Clientes
              </span>
              <span className="text-xs text-red-500 font-bold mb-1">Alertas</span>
            </div>
            <p className="text-xs text-slate-500 mt-2">
              Clientes ativos sem compra há &gt; 30 dias.
            </p>
            <button
              onClick={e => {
                e.stopPropagation();
                checkWalletHealth();
              }}
              className="mt-3 text-xs text-primary-500 hover:underline"
            >
              Rodar verificação agora
            </button>
          </div>

          <div className="glass p-6 rounded-xl border border-slate-200 dark:border-white/5 shadow-sm">
            <h3 className="text-sm font-medium text-slate-500 dark:text-slate-400 mb-2">
              LTV Médio
            </h3>
            <div className="flex items-end gap-2">
              <span className="text-2xl font-bold text-slate-900 dark:text-white">
                ${(avgLTV / 1000).toFixed(1)}k
              </span>
              <span className="text-xs text-green-500 font-bold mb-1">Médio</span>
            </div>
            <p className="text-xs text-slate-500 mt-2">Valor médio vitalício por cliente ativo.</p>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Funnel */}
        <div className="glass p-6 rounded-xl border border-slate-200 dark:border-white/5 shadow-sm">
          <div className="flex justify-between items-center mb-6">
            <h3 className="text-lg font-bold text-slate-900 dark:text-white font-display">
              Funil de Vendas
            </h3>
          </div>
          <div className="h-80 w-full">
            <ChartWrapper height={320}>
              <LazyFunnelChart data={funnelData} />
            </ChartWrapper>
          </div>
        </div>

        {/* Activity Feed - Expanded */}
        <div className="lg:col-span-2 glass p-6 rounded-xl border border-slate-200 dark:border-white/5 shadow-sm h-full max-h-[500px] overflow-y-auto">
          <div className="flex justify-between items-center mb-4 sticky top-0 bg-inherit z-10">
            <h3 className="text-lg font-bold text-slate-900 dark:text-white font-display">
              Atividades Recentes
            </h3>
            <MoreVertical size={16} className="text-slate-400 cursor-pointer" />
          </div>
          <div className="space-y-1">
            {activities.slice(0, 8).map(activity => (
              <ActivityFeedItem key={activity.id} activity={activity} />
            ))}
            {activities.length === 0 && (
              <p className="text-sm text-slate-500 text-center py-4">Nenhuma atividade recente.</p>
            )}
          </div>
          <button
            onClick={() => navigate('/activities')}
            className="w-full mt-4 py-2 text-sm text-primary-500 border border-dashed border-primary-500/30 rounded-lg hover:bg-primary-50 dark:hover:bg-primary-500/10 transition-colors"
          >
            Ver todas as atividades
          </button>
        </div>
      </div>
    </div>
  );
};

export default DashboardPage;
