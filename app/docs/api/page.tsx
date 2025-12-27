'use client';

import { useEffect, useState } from 'react';
import SwaggerUI from 'swagger-ui-react';
import 'swagger-ui-react/swagger-ui.css';

/**
 * Swagger UI page component
 * Displays interactive API documentation
 * 
 * Note: swagger-ui-react uses deprecated React lifecycle methods (UNSAFE_componentWillReceiveProps).
 * This is a known issue with the library (v5.30.2) and doesn't affect functionality.
 * The warning is suppressed below to keep the console clean.
 */
export default function SwaggerPage() {
    const [spec, setSpec] = useState<Record<string, unknown> | null>(null);

    useEffect(() => {
        // Suppress console warnings for swagger-ui-react's deprecated lifecycle methods
        const originalError = console.error;
        const originalWarn = console.warn;

        console.error = (...args: any[]) => {
            // Filter out the UNSAFE_componentWillReceiveProps warning from swagger-ui-react
            const message = args[0];
            if (
                typeof message === 'string' &&
                (message.includes('UNSAFE_componentWillReceiveProps') ||
                    message.includes('ModelCollapse'))
            ) {
                return; // Suppress this specific warning
            }
            originalError.apply(console, args);
        };

        console.warn = (...args: any[]) => {
            // Also filter warnings about deprecated lifecycle methods
            const message = args[0];
            if (
                typeof message === 'string' &&
                (message.includes('UNSAFE_componentWillReceiveProps') ||
                    message.includes('componentWillReceiveProps'))
            ) {
                return; // Suppress this specific warning
            }
            originalWarn.apply(console, args);
        };

        // Fetch the OpenAPI specification
        fetch('/api/docs')
            .then(res => res.json())
            .then(data => setSpec(data))
            .catch(err => {
                originalError('Failed to load API spec:', err);
            });

        return () => {
            // Restore original console methods
            console.error = originalError;
            console.warn = originalWarn;
        };
    }, []);

    if (!spec) {
        return (
            <div className="flex items-center justify-center min-h-screen bg-[#f8fafc]">
                <div className="text-center">
                    <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-[#1e40af] mx-auto"></div>
                    <p className="mt-4 text-[#64748b]">Loading API documentation...</p>
                </div>
            </div>
        );
    }

    return (
        <div className="swagger-container">
            <SwaggerUI
                spec={spec}
                deepLinking={true}
                displayOperationId={false}
                defaultModelsExpandDepth={1}
                defaultModelExpandDepth={1}
            />
        </div>
    );
}
