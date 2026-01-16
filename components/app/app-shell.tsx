'use client';

import { useState, useEffect } from 'react';
import { OnboardingCarousel } from './OnboardingCarousel';
import { AppAuthGateway } from './AppAuthGateway';
import { AppDashboard } from './AppDashboard';

/**
 * Main app shell that manages the flow for installed PWA
 * Handles onboarding -> auth -> dashboard progression
 * Removes browser UI elements (Navbar, Footer)
 */
export function AppShell() {
    const [hasSeenOnboarding, setHasSeenOnboarding] = useState(false);
    const [isAuthenticated, setIsAuthenticated] = useState(false);

    useEffect(() => {
        // Check if user has seen onboarding before
        const onboardingComplete = localStorage.getItem('app-onboarding-complete');
        setHasSeenOnboarding(!!onboardingComplete);

        // Check if user is authenticated
        const token = localStorage.getItem('auth_token');
        setIsAuthenticated(!!token);
    }, []);

    const handleOnboardingComplete = () => {
        localStorage.setItem('app-onboarding-complete', 'true');
        setHasSeenOnboarding(true);
    };

    const handleAuthSuccess = () => {
        setIsAuthenticated(true);
    };

    // Show onboarding if first time user
    if (!hasSeenOnboarding) {
        return <OnboardingCarousel onComplete={handleOnboardingComplete} />;
    }

    // Show auth if not authenticated
    if (!isAuthenticated) {
        return <AppAuthGateway onSuccess={handleAuthSuccess} />;
    }

    // Show main dashboard
    return <AppDashboard />;
}
