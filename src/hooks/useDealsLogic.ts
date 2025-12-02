import { Deal, DealStatus, DealItem } from '../types';
import { INITIAL_DEALS } from '../services/mockData';
import { usePersistedState } from './usePersistedState';

export const useDealsLogic = () => {
  const [rawDeals, setRawDeals] = usePersistedState<Deal[]>('crm_deals', INITIAL_DEALS);

  const addDeal = (deal: Deal) => {
    setRawDeals(prev => [deal, ...prev]);
  };

  const updateDeal = (id: string, updates: Partial<Deal>) => {
    setRawDeals(prev => prev.map(l => (l.id === id ? { ...l, ...updates } : l)));
  };

  const updateDealStatus = (id: string, newStatus: string, lossReason?: string) => {
    setRawDeals(prev =>
      prev.map(l =>
        l.id === id
          ? {
              ...l,
              status: newStatus,
              lastStageChangeDate: new Date().toISOString(),
              lossReason: newStatus === DealStatus.CLOSED_LOST ? lossReason : undefined,
            }
          : l
      )
    );
  };

  const deleteDeal = (id: string) => {
    setRawDeals(prev => prev.filter(d => d.id !== id));
  };

  const addItemToDeal = (dealId: string, item: Omit<DealItem, 'id'>) => {
    const newItem: DealItem = { ...item, id: crypto.randomUUID() };
    setRawDeals(prev =>
      prev.map(deal => {
        if (deal.id === dealId) {
          const updatedItems = [...(deal.items || []), newItem];
          const newValue = updatedItems.reduce((sum, i) => sum + i.price * i.quantity, 0);
          return { ...deal, items: updatedItems, value: newValue };
        }
        return deal;
      })
    );
  };

  const removeItemFromDeal = (dealId: string, itemId: string) => {
    setRawDeals(prev =>
      prev.map(deal => {
        if (deal.id === dealId) {
          const updatedItems = deal.items.filter(i => i.id !== itemId);
          const newValue = updatedItems.reduce((sum, i) => sum + i.price * i.quantity, 0);
          return { ...deal, items: updatedItems, value: newValue };
        }
        return deal;
      })
    );
  };

  return {
    rawDeals,
    setRawDeals,
    addDeal,
    updateDeal,
    updateDealStatus,
    deleteDeal,
    addItemToDeal,
    removeItemFromDeal,
  };
};
