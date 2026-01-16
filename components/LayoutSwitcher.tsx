'use client';

import { useAppEnvironment } from '@/components/providers';
import { AppShell } from '@/components/app/app-shell';

interface LayoutSwitcherProps {
    children: React.ReactNode;
}

/**
 * Component that conditionally renders app shell or browser content
 * based on standalone mode detection
 */
export function LayoutSwitcher({ children }: LayoutSwitcherProps) {
    // Layout switching is now handled at the page level or via CSS media queries
    return <>{children}</>;
}
