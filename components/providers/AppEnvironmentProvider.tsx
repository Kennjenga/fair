'use client';

import React, { createContext, useContext, ReactNode } from 'react';
import { useIsStandalone } from '@/lib/hooks/useIsStandalone';

interface AppEnvironmentContextType {
    isStandalone: boolean;
    isBrowser: boolean;
}

const AppEnvironmentContext = createContext<AppEnvironmentContextType>({
    isStandalone: false,
    isBrowser: true,
});

/**
 * Custom hook to access app environment state
 * @returns Object with isStandalone and isBrowser booleans
 */
export function useAppEnvironment() {
    const context = useContext(AppEnvironmentContext);
    if (!context) {
        throw new Error('useAppEnvironment must be used within AppEnvironmentProvider');
    }
    return context;
}

interface AppEnvironmentProviderProps {
    children: ReactNode;
}

/**
 * Provider component that detects and shares app environment state
 * Wraps the application to provide standalone/browser detection
 */
export function AppEnvironmentProvider({ children }: AppEnvironmentProviderProps) {
    const isStandalone = useIsStandalone();

    return (
        <AppEnvironmentContext.Provider
            value={{
                isStandalone,
                isBrowser: !isStandalone,
            }}
        >
            {children}
        </AppEnvironmentContext.Provider>
    );
}
