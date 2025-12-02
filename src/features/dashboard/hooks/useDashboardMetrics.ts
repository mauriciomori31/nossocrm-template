import React from 'react';
import { DealStatus } from '@/types';
import { useDeals } from '@/lib/query/hooks/useDealsQuery';
import { useContacts } from '@/lib/query/hooks/useContactsQuery';
import { useBoards, useDefaultBoard } from '@/lib/query/hooks/useBoardsQuery';

export const useDashboardMetrics = () => {
  const { data: deals = [], isLoading: dealsLoading } = useDeals();
  const { data: contacts = [], isLoading: contactsLoading } = useContacts();
  const { data: boards = [] } = useBoards();
  const { data: defaultBoard } = useDefaultBoard();

  const isLoading = dealsLoading || contactsLoading;

    // Calculate metrics - usar campos isWon/isLost
    const totalValue = deals.reduce((acc, deal) => acc + deal.value, 0);
    const wonDeals = deals.filter(d => d.isWon);
    const lostDeals = deals.filter(d => d.isLost);
    const activeDeals = deals.filter(d => !d.isWon && !d.isLost);
    
    const winRate = deals.length > 0 ? (wonDeals.length / deals.length) * 100 : 0;
    const pipelineValue = activeDeals.reduce((acc, l) => acc + l.value, 0);

    // Top Deals (Highest Value)
    const topDeals = [...deals]
        .sort((a, b) => b.value - a.value)
        .slice(0, 4);

    // Prepare Chart Data - usar stages do board padrão
    const funnelData = React.useMemo(() => {
        // Pega os stages do board padrão ou do primeiro board
        const activeBoard = defaultBoard || boards[0];
        const stages = activeBoard?.stages || [];

        if (stages.length === 0) {
            // Fallback para status antigos se não tiver stages
            return [
                { name: 'Novos', count: deals.filter(l => l.status === DealStatus.NEW).length },
                { name: 'Contatos', count: deals.filter(l => l.status === DealStatus.CONTACTED).length },
                { name: 'Proposta', count: deals.filter(l => l.status === DealStatus.PROPOSAL).length },
                { name: 'Negoc.', count: deals.filter(l => l.status === DealStatus.NEGOTIATION).length },
                { name: 'Ganho', count: deals.filter(l => l.status === DealStatus.CLOSED_WON).length },
            ];
        }

        // Usar stages reais do board
        return stages.map(stage => ({
            name: stage.label.length > 8 ? stage.label.substring(0, 7) + '.' : stage.label,
            count: deals.filter(d => d.status === stage.id).length,
        }));
    }, [deals, defaultBoard, boards]);

    // Mock Trend Data
    // Real Trend Data (Last 6 Months)
    const trendData = React.useMemo(() => {
        const last6Months = Array.from({ length: 6 }, (_, i) => {
            const d = new Date();
            d.setMonth(d.getMonth() - (5 - i));
            return d;
        });

        return last6Months.map(date => {
            const monthName = date.toLocaleString('default', { month: 'short' });
            const monthKey = `${date.getMonth()}-${date.getFullYear()}`;

            const monthlyRevenue = wonDeals.reduce((acc, deal) => {
                if (!deal.updatedAt) return acc;
                const dealDate = new Date(deal.updatedAt);
                const dealMonthKey = `${dealDate.getMonth()}-${dealDate.getFullYear()}`;

                return dealMonthKey === monthKey ? acc + deal.value : acc;
            }, 0);

            return {
                month: monthName.charAt(0).toUpperCase() + monthName.slice(1),
                revenue: monthlyRevenue
            };
        });
    }, [wonDeals]);

    // Wallet Health Metrics
    const activeContacts = contacts.filter(c => c.status === 'ACTIVE');
    const inactiveContacts = contacts.filter(c => c.status === 'INACTIVE');
    const churnedContacts = contacts.filter(c => c.status === 'CHURNED');
    const totalContacts = contacts.length || 1; // Avoid division by zero

    const activePercent = Math.round((activeContacts.length / totalContacts) * 100);
    const inactivePercent = Math.round((inactiveContacts.length / totalContacts) * 100);
    const churnedPercent = Math.round((churnedContacts.length / totalContacts) * 100);

    const totalLTV = contacts.reduce((acc, c) => acc + (c.totalValue || 0), 0);
    const avgLTV = activeContacts.length > 0 ? totalLTV / activeContacts.length : 0;

    // Calculate Risky Contacts (Active but no purchase > 30 days)
    const thirtyDaysAgo = new Date();
    thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);
    const riskyCount = activeContacts.filter(c => {
        if (!c.lastPurchaseDate) return true;
        return new Date(c.lastPurchaseDate) < thirtyDaysAgo;
    }).length;

    // Sales Cycle Metrics
    const closedDeals = [...wonDeals, ...lostDeals];
    const wonDealsWithDates = wonDeals.filter(d => d.createdAt && d.updatedAt);

    const salesCycles = wonDealsWithDates.map(d => {
        const created = new Date(d.createdAt);
        const closed = new Date(d.updatedAt);
        return Math.floor((closed.getTime() - created.getTime()) / (1000 * 60 * 60 * 24));
    });

    const avgSalesCycle = salesCycles.length > 0
        ? Math.round(salesCycles.reduce((sum, days) => sum + days, 0) / salesCycles.length)
        : 0;

    const fastestDeal = salesCycles.length > 0 ? Math.min(...salesCycles) : 0;
    const slowestDeal = salesCycles.length > 0 ? Math.max(...salesCycles) : 0;

    // Conversion Funnel Metrics (lostDeals já calculado acima)
    const totalClosedDeals = wonDeals.length + lostDeals.length;
    const actualWinRate = totalClosedDeals > 0 ? (wonDeals.length / totalClosedDeals) * 100 : 0;

    // Loss Reasons Analysis
    const lossReasons = lostDeals.reduce((acc, deal) => {
        const reason = deal.lossReason || 'Não especificado';
        acc[reason] = (acc[reason] || 0) + 1;
        return acc;
    }, {} as Record<string, number>);

    const topLossReasons = Object.entries(lossReasons)
        .sort(([, a], [, b]) => (b as number) - (a as number))
        .slice(0, 3);

    return {
        isLoading,
        deals,
        totalValue,
        wonDeals,
        winRate,
        pipelineValue,
        topDeals,
        funnelData,
        trendData,
        activeContacts,
        inactiveContacts,
        churnedContacts,
        activePercent,
        inactivePercent,
        churnedPercent,
        avgLTV,
        riskyCount,
        avgSalesCycle,
        fastestDeal,
        slowestDeal,
        actualWinRate,
        lostDeals,
        topLossReasons,
        wonDealsWithDates
    };
};
