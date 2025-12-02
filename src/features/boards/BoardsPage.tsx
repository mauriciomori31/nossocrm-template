import React, { useEffect } from 'react';
import { useBoardsController } from './hooks/useBoardsController';
import { PipelineView } from './components/PipelineView';
import { OnboardingModal } from '@/components/OnboardingModal';
import { useFirstVisit } from '@/hooks/useFirstVisit';

export const BoardsPage: React.FC = () => {
    const controller = useBoardsController();
    const { isFirstVisit, completeOnboarding } = useFirstVisit();
    const [showOnboarding, setShowOnboarding] = React.useState(false);

    // Show onboarding modal on first visit IF there are no boards
    useEffect(() => {
        if (isFirstVisit && controller.boards.length === 0) {
            const timer = setTimeout(() => {
                setShowOnboarding(true);
            }, 500);
            return () => clearTimeout(timer);
        } else if (isFirstVisit && controller.boards.length > 0) {
            // If first visit but has boards (e.g. mock data loaded), mark as completed silently
            completeOnboarding();
        }
    }, [isFirstVisit, controller.boards.length]);

    const handleOnboardingStart = () => {
        setShowOnboarding(false);
        completeOnboarding();
        // Open wizard automatically
        controller.setIsWizardOpen(true);
    };

    const handleOnboardingSkip = () => {
        setShowOnboarding(false);
        completeOnboarding();
    };

    return (
        <>
            <PipelineView {...controller} />

            <OnboardingModal
                isOpen={showOnboarding}
                onStart={handleOnboardingStart}
                onSkip={handleOnboardingSkip}
            />
        </>
    );
};

// @deprecated - Use BoardsPage
export const PipelinePage = BoardsPage;
