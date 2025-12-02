import React from 'react';
import { Navigate, useLocation } from 'react-router-dom';
import { useAuth } from '@/context/AuthContext';
import { PageLoader } from './PageLoader';

export const ProtectedRoute: React.FC<{ children: React.ReactNode }> = ({ children }) => {
    const { user, loading, isInitialized } = useAuth();
    const location = useLocation();

    if (loading || isInitialized === null) {
        return <PageLoader />;
    }

    if (!isInitialized) {
        return <Navigate to="/setup" replace />;
    }

    if (!user) {
        return <Navigate to="/login" state={{ from: location }} replace />;
    }

    return <>{children}</>;
};
