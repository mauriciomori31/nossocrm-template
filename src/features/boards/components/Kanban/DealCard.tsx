import React, { useState } from 'react';
import { DealView, DealStatus } from '@/types';
import { Building2, Hourglass } from 'lucide-react';
import { ActivityStatusIcon } from './ActivityStatusIcon';

interface DealCardProps {
  deal: DealView;
  isRotting: boolean;
  activityStatus: string;
  isDragging: boolean;
  onDragStart: (e: React.DragEvent, id: string) => void;
  onClick: () => void;
  openMenuId: string | null;
  setOpenMenuId: (id: string | null) => void;
  onQuickAddActivity: (
    dealId: string,
    type: 'CALL' | 'MEETING' | 'EMAIL',
    dealTitle: string
  ) => void;
  setLastMouseDownDealId: (id: string | null) => void;
}

export const DealCard: React.FC<DealCardProps> = ({
  deal,
  isRotting,
  activityStatus,
  isDragging,
  onDragStart,
  onClick,
  openMenuId,
  setOpenMenuId,
  onQuickAddActivity,
  setLastMouseDownDealId,
}) => {
  const [localDragging, setLocalDragging] = useState(false);

  const handleToggleMenu = (e: React.MouseEvent) => {
    e.stopPropagation();
    setOpenMenuId(openMenuId === deal.id ? null : deal.id);
  };

  const handleQuickAdd = (type: 'CALL' | 'MEETING' | 'EMAIL') => {
    onQuickAddActivity(deal.id, type, deal.title);
  };

  const handleDragStart = (e: React.DragEvent) => {
    setLocalDragging(true);
    e.dataTransfer.setData('dealId', deal.id);
    e.dataTransfer.effectAllowed = 'move';
    onDragStart(e, deal.id);
  };

  const handleDragEnd = () => {
    setLocalDragging(false);
  };

  return (
    <div
      data-deal-id={deal.id}
      draggable={true}
      onDragStart={handleDragStart}
      onDragEnd={handleDragEnd}
      onMouseDown={() => setLastMouseDownDealId(deal.id)}
      onClick={e => {
        if ((e.target as HTMLElement).closest('button')) return;
        onClick();
      }}
      className={`
                p-3 rounded-lg border-l-4 border-y border-r border-slate-200 dark:border-slate-700/50
                shadow-sm cursor-grab active:cursor-grabbing group hover:shadow-md transition-all relative select-none
                ${localDragging || isDragging ? 'bg-green-100 dark:bg-green-900 opacity-50 rotate-2 scale-95' : 'bg-white dark:bg-slate-800 opacity-100'}
                ${isRotting ? 'opacity-80 saturate-50 border-dashed' : ''}
            `}
      style={{
        borderLeftColor:
          deal.priority === 'high' ? '#ef4444' : deal.priority === 'medium' ? '#f59e0b' : '#3b82f6',
      }}
    >
      {isRotting && (
        <div
          className="absolute -top-2 -right-2 bg-amber-100 dark:bg-amber-900/40 text-amber-800 dark:text-amber-200 p-1 rounded-full shadow-sm z-10"
          title="Negócio Estagnado (>10 dias sem atualização)"
        >
          <Hourglass size={12} />
        </div>
      )}

      <div className="flex gap-1 mb-2 flex-wrap">
        {deal.tags.slice(0, 2).map(tag => (
          <span
            key={tag}
            className="text-[10px] font-medium px-1.5 py-0.5 rounded bg-slate-100 dark:bg-white/5 text-slate-500 dark:text-slate-400 border border-slate-200 dark:border-white/5"
          >
            {tag}
          </span>
        ))}
      </div>

      <h4
        className={`text-sm font-bold font-display leading-snug mb-0.5 ${isRotting ? 'text-slate-600 dark:text-slate-400' : 'text-slate-900 dark:text-white'}`}
      >
        {deal.title}
      </h4>
      <p className="text-xs text-slate-500 dark:text-slate-400 mb-3 flex items-center gap-1">
        <Building2 size={10} /> {deal.companyName}
      </p>

      <div className="flex justify-between items-center pt-2 border-t border-slate-100 dark:border-white/5">
        <div className="flex items-center gap-2">
          {deal.owner && deal.owner.avatar && (
            <img
              src={deal.owner.avatar}
              alt={deal.owner.name}
              className="w-5 h-5 rounded-full ring-1 ring-white dark:ring-slate-800"
              title={deal.owner.name}
            />
          )}
          <span className="text-sm font-bold text-slate-700 dark:text-slate-200 font-mono">
            ${deal.value.toLocaleString()}
          </span>
        </div>

        <div className="flex items-center">
          <ActivityStatusIcon
            status={activityStatus}
            type={deal.nextActivity?.type}
            dealId={deal.id}
            dealTitle={deal.title}
            isOpen={openMenuId === deal.id}
            onToggle={handleToggleMenu}
            onQuickAdd={handleQuickAdd}
          />
        </div>
      </div>
    </div>
  );
};
