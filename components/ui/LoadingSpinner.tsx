import React from 'react';

interface LoadingSpinnerProps {
    size?: 'sm' | 'md' | 'lg' | 'xl';
    variant?: 'default' | 'overlay' | 'inline';
    message?: string;
}

export const LoadingSpinner: React.FC<LoadingSpinnerProps> = ({
    size = 'md',
    variant = 'default',
    message,
}) => {
    const sizeClasses = {
        sm: 'w-6 h-6',
        md: 'w-12 h-12',
        lg: 'w-16 h-16',
        xl: 'w-24 h-24',
    };

    const spinner = (
        <div className="flex flex-col items-center justify-center gap-4">
            <div className="relative">
                {/* Outer rotating ring */}
                <div
                    className={`${sizeClasses[size]} rounded-full border-4 border-slate-200 border-t-primary animate-spin`}
                    style={{ animationDuration: '1s' }}
                />

                {/* Inner pulsing circle */}
                <div
                    className={`absolute inset-0 m-auto ${size === 'sm' ? 'w-2 h-2' : size === 'md' ? 'w-4 h-4' : size === 'lg' ? 'w-6 h-6' : 'w-8 h-8'
                        } rounded-full bg-secondary animate-pulse-slow`}
                />
            </div>

            {message && (
                <p className="text-slate-700 text-sm font-medium animate-pulse-slow">
                    {message}
                </p>
            )}
        </div>
    );

    if (variant === 'overlay') {
        return (
            <div className="fixed inset-0 z-50 flex items-center justify-center bg-white/80 backdrop-blur-sm">
                {spinner}
            </div>
        );
    }

    if (variant === 'inline') {
        return <div className="inline-flex">{spinner}</div>;
    }

    return <div className="flex items-center justify-center p-8">{spinner}</div>;
};

export default LoadingSpinner;
