import React from 'react';

interface LoadingDotsProps {
    size?: 'sm' | 'md' | 'lg';
    color?: 'primary' | 'secondary' | 'white';
}

export const LoadingDots: React.FC<LoadingDotsProps> = ({
    size = 'md',
    color = 'primary',
}) => {
    const sizeClasses = {
        sm: 'w-1.5 h-1.5',
        md: 'w-2.5 h-2.5',
        lg: 'w-4 h-4',
    };

    const colorClasses = {
        primary: 'bg-primary',
        secondary: 'bg-secondary',
        white: 'bg-white',
    };

    return (
        <div className="flex items-center gap-2">
            <div
                className={`${sizeClasses[size]} ${colorClasses[color]} rounded-full animate-bounce`}
                style={{ animationDelay: '0ms', animationDuration: '1s' }}
            />
            <div
                className={`${sizeClasses[size]} ${colorClasses[color]} rounded-full animate-bounce`}
                style={{ animationDelay: '150ms', animationDuration: '1s' }}
            />
            <div
                className={`${sizeClasses[size]} ${colorClasses[color]} rounded-full animate-bounce`}
                style={{ animationDelay: '300ms', animationDuration: '1s' }}
            />
        </div>
    );
};

export default LoadingDots;
