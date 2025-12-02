import { useState, useEffect } from 'react';

const ONBOARDING_KEY = 'crm_onboarding_completed';

export const useFirstVisit = () => {
    const [isFirstVisit, setIsFirstVisit] = useState<boolean>(() => {
        const completed = localStorage.getItem(ONBOARDING_KEY);
        return completed !== 'true';
    });

    const completeOnboarding = () => {
        localStorage.setItem(ONBOARDING_KEY, 'true');
        setIsFirstVisit(false);
    };

    const resetOnboarding = () => {
        localStorage.removeItem(ONBOARDING_KEY);
        setIsFirstVisit(true);
    };

    return {
        isFirstVisit,
        completeOnboarding,
        resetOnboarding
    };
};
