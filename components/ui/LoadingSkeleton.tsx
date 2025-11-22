import React from 'react';

interface LoadingSkeletonProps {
    variant?: 'text' | 'circular' | 'rectangular' | 'card';
    width?: string;
    height?: string;
    count?: number;
}

export const LoadingSkeleton: React.FC<LoadingSkeletonProps> = ({
    variant = 'text',
    width = '100%',
    height,
    count = 1,
}) => {
    const getVariantClasses = () => {
        switch (variant) {
            case 'text':
                return 'h-4 rounded';
            case 'circular':
                return 'rounded-full aspect-square';
            case 'rectangular':
                return 'rounded-lg';
            case 'card':
                return 'rounded-xl h-48';
            default:
                return 'h-4 rounded';
        }
    };

    const skeletonElement = (
        <div
            className={`bg-gradient-to-r from-slate-200 via-slate-100 to-slate-200 animate-shimmer ${getVariantClasses()}`}
            style={{
                width,
                height: height || undefined,
                backgroundSize: '200% 100%',
            }}
        />
    );

    if (count === 1) {
        return skeletonElement;
    }

    return (
        <div className="flex flex-col gap-3">
            {Array.from({ length: count }).map((_, index) => (
                <div key={index}>{skeletonElement}</div>
            ))}
        </div>
    );
};

export default LoadingSkeleton;
