import React from 'react';
import clsx from 'clsx';

interface BadgeProps {
  children: React.ReactNode;
  variant?: 'primary' | 'success' | 'warning' | 'error' | 'info' | 'secondary';
  className?: string;
}

const styles = {
  primary: 'bg-[#EEF2FF] text-[#4F46E5]',
  success: 'bg-[#DCFCE7] text-[#166534]',
  warning: 'bg-[#FEF3C7] text-[#92400E]',
  error: 'bg-[#FEE2E2] text-[#991B1B]',
  info: 'bg-[#DBEAFE] text-[#0C2340]',
  secondary: 'bg-[#F3F4F6] text-[#334155]',
};

export const Badge = React.forwardRef<HTMLDivElement, BadgeProps>(
  ({ children, variant = 'primary', className }, ref) => {
    return (
      <div
        ref={ref}
        className={clsx(
          'inline-flex items-center px-3 py-1 rounded-full text-xs font-semibold',
          styles[variant],
          className
        )}
      >
        {children}
      </div>
    );
  }
);

Badge.displayName = 'Badge';
