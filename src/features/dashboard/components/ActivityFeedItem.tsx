import React from 'react';
import { Clock, Users, TrendingUp, AlertCircle } from 'lucide-react';
import { Activity } from '@/types';

interface ActivityFeedItemProps {
    activity: Activity;
}

export const ActivityFeedItem: React.FC<ActivityFeedItemProps> = ({ activity }) => {
    const getIcon = () => {
        switch (activity.type) {
            case 'CALL': return <div className="bg-blue-500/20 text-blue-500 p-2 rounded-full"><Clock size={14} /></div>;
            case 'EMAIL': return <div className="bg-purple-500/20 text-purple-500 p-2 rounded-full"><Users size={14} /></div>;
            case 'MEETING': return <div className="bg-orange-500/20 text-orange-500 p-2 rounded-full"><Users size={14} /></div>;
            case 'STATUS_CHANGE': return <div className="bg-emerald-500/20 text-emerald-500 p-2 rounded-full"><TrendingUp size={14} /></div>;
            default: return <div className="bg-slate-500/20 text-slate-500 p-2 rounded-full"><AlertCircle size={14} /></div>;
        }
    };

    return (
        <div className="flex items-start gap-3 py-3 border-b border-slate-100 dark:border-white/5 last:border-0">
            {getIcon()}
            <div className="flex-1 min-w-0">
                <p className="text-sm font-medium text-slate-900 dark:text-white truncate">{activity.title}</p>
                <p className="text-xs text-slate-500 dark:text-slate-400">
                    em <span className="text-primary-500">{activity.dealTitle}</span>
                </p>
            </div>
            <span className="text-[10px] text-slate-400 whitespace-nowrap">
                {new Date(activity.date).toLocaleDateString('pt-BR', { hour: '2-digit', minute: '2-digit' })}
            </span>
        </div>
    );
};
