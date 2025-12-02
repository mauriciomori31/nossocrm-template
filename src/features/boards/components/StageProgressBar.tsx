import React from 'react';
import { BoardStage } from '@/types';

interface StageProgressBarProps {
    stages: BoardStage[];
    currentStatus: string;
    onStageClick: (stageId: string) => void;
}

export const StageProgressBar: React.FC<StageProgressBarProps> = ({ stages, currentStatus, onStageClick }) => {
    return (
        <div className="flex items-center w-full overflow-hidden rounded-lg border border-slate-200 dark:border-white/10">
            {stages.map((stage, index, arr) => {
                const isCurrent = currentStatus === stage.id;
                const isPast = arr.findIndex(s => s.id === currentStatus) > index;

                return (
                    <button
                        key={stage.id}
                        onClick={() => onStageClick(stage.id)}
                        className={`flex-1 w-0 py-2 px-2 text-xs font-bold uppercase tracking-wider border-r border-white/20 relative transition-colors outline-none focus:ring-2 focus:ring-green-500 focus:ring-offset-1 dark:focus:ring-offset-slate-900 whitespace-nowrap overflow-hidden text-ellipsis
                        ${isCurrent || isPast ? 'bg-green-500 text-white' : 'bg-slate-200 dark:bg-slate-700 text-slate-500 dark:text-slate-400 hover:bg-slate-300 dark:hover:bg-slate-600'}`}
                    >
                        {stage.label}
                    </button>
                );
            })}
        </div>
    );
};
