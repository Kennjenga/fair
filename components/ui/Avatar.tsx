import React from 'react';
import clsx from 'clsx';

interface AvatarProps {
  src?: string;
  alt: string;
  size?: 'sm' | 'md' | 'lg' | 'xl' | '2xl';
  className?: string;
}

const sizeMap = {
  sm: 'w-6 h-6',
  md: 'w-8 h-8',
  lg: 'w-10 h-10',
  xl: 'w-12 h-12',
  '2xl': 'w-16 h-16',
};

export const Avatar = React.forwardRef<HTMLImageElement, AvatarProps>(
  ({ src, alt, size = 'md', className }, ref) => {
    const bgColor = src ? 'bg-[#E2E8F0]' : 'bg-[#4F46E5]';
    const textColor = src ? '' : 'text-white';

    return (
      <div
        className={clsx(
          'rounded-full border-2 border-white flex items-center justify-center font-semibold overflow-hidden',
          sizeMap[size],
          !src && `${bgColor} ${textColor}`,
          className
        )}
      >
        {src ? (
          <img
            ref={ref}
            src={src}
            alt={alt}
            className="w-full h-full object-cover"
          />
        ) : (
          alt.charAt(0).toUpperCase()
        )}
      </div>
    );
  }
);

Avatar.displayName = 'Avatar';
