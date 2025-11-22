import React from 'react';

interface LoadingBarProps {
    variant?: 'indeterminate' | 'determinate';
    progress?: number; // 0-100 for determinate
    height?: 'sm' | 'md' | 'lg';
}

export const LoadingBar: React.FC<LoadingBarProps> = ({
    variant = 'indeterminate',
    progress = 0,
    height = 'md',
}) => {
    const heightClasses = {
        sm: 'h-1',
        md: 'h-2',
        lg: 'h-3',
    };

    return (
        <div className={`w-full ${heightClasses[height]} bg-slate-200 rounded-full overflow-hidden`}>
            {variant === 'indeterminate' ? (
                <div
                    className="h-full bg-gradient-to-r from-primary via-secondary to-primary rounded-full animate-shimmer"
                    style={{
                        backgroundSize: '200% 100%',
                        width: '50%',
                    }}
                />
            ) : (
                <div
                    className="h-full bg-gradient-to-r from-primary to-secondary rounded-full transition-all duration-300 ease-out"
                    style={{ width: `${Math.min(100, Math.max(0, progress))}%` }}
                />
            )}
        </div>
    );
};

export default LoadingBar;
