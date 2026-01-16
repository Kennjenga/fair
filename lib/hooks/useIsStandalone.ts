import { useState, useEffect } from 'react';

/**
 * Custom hook to detect if the app is running in standalone mode (installed PWA)
 * Checks both standard display-mode media query and iOS-specific navigator.standalone
 * @returns boolean indicating if app is in standalone mode
 */
export function useIsStandalone(): boolean {
    const [isStandalone, setIsStandalone] = useState(false);

    useEffect(() => {
        // Check if running in standalone mode (PWA installed)
        const standaloneQuery = window.matchMedia('(display-mode: standalone)');

        // iOS Safari specific check
        const isIosStandalone = (window.navigator as any).standalone === true;

        // Set initial state
        setIsStandalone(standaloneQuery.matches || isIosStandalone);

        // Listen for changes (if user switches display mode)
        const handleChange = (e: MediaQueryListEvent) => {
            setIsStandalone(e.matches || isIosStandalone);
        };

        standaloneQuery.addEventListener('change', handleChange);

        return () => {
            standaloneQuery.removeEventListener('change', handleChange);
        };
    }, []);

    return isStandalone;
}
