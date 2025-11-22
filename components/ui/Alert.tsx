import React from 'react';
import clsx from 'clsx';

interface AlertProps {
  type: 'success' | 'error' | 'warning' | 'info';
  message: string;
  className?: string;
}

const styles = {
  success: {
    bg: 'bg-[#DCFCE7]',
    border: 'border-[#86EFAC]',
    text: 'text-[#166534]',
  },
  error: {
    bg: 'bg-[#FEE2E2]',
    border: 'border-[#FECACA]',
    text: 'text-[#991B1B]',
  },
  warning: {
    bg: 'bg-[#FEF3C7]',
    border: 'border-[#FDE68A]',
    text: 'text-[#92400E]',
  },
  info: {
    bg: 'bg-[#DBEAFE]',
    border: 'border-[#BFDBFE]',
    text: 'text-[#0C2340]',
  },
};

export const Alert = React.forwardRef<HTMLDivElement, AlertProps>(
  ({ type, message, className }, ref) => {
    const style = styles[type];

    return (
      <div
        ref={ref}
        className={clsx(
          'px-4 py-3 rounded-xl border-1.5',
          style.bg,
          style.border,
          style.text,
          'text-sm font-medium',
          className
        )}
      >
        {message}
      </div>
    );
  }
);

Alert.displayName = 'Alert';
