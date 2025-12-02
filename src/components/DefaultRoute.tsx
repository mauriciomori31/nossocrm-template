import React from 'react';
import { Navigate } from 'react-router-dom';
import { usePersistedState } from '@/hooks/usePersistedState';

export const DefaultRoute: React.FC = () => {
    // Default to /dashboard if not set
    const [defaultRoute] = usePersistedState<string>('crm_default_route', '/dashboard');

    let target = defaultRoute === '/' ? '/dashboard' : defaultRoute;

    // Handle specific Inbox modes
    if (target === '/inbox-list') {
        localStorage.setItem('inbox_view_mode', JSON.stringify('list'));
        target = '/inbox';
    } else if (target === '/inbox-focus') {
        localStorage.setItem('inbox_view_mode', JSON.stringify('focus'));
        target = '/inbox';
    }

    return <Navigate to={target} replace />;
};
