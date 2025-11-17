import React from 'react';
import clsx from 'clsx';

interface InputProps extends React.InputHTMLAttributes<HTMLInputElement> {
  label?: string;
  error?: string;
  helperText?: string;
}

export const Input = React.forwardRef<HTMLInputElement, InputProps>(
  ({ label, error, helperText, className, ...props }, ref) => {
    return (
      <div className="w-full">
        {label && (
          <label className="block text-sm font-medium text-[#334155] mb-2">
            {label}
          </label>
        )}
        <input
          ref={ref}
          className={clsx(
            'w-full px-4 py-2.5 rounded-xl border-1.5 transition-all',
            'focus:outline-none focus:ring-2 focus:ring-offset-0 focus:border-[#4F46E5]',
            error
              ? 'border-[#DC2626] focus:ring-[#FEE2E2]'
              : 'border-[#E2E8F0] focus:ring-[#EEF2FF]',
            className
          )}
          {...props}
        />
        {error && (
          <p className="text-xs font-medium text-[#DC2626] mt-1.5">
            {error}
          </p>
        )}
        {helperText && !error && (
          <p className="text-xs text-[#334155] mt-1.5">
            {helperText}
          </p>
        )}
      </div>
    );
  }
);

Input.displayName = 'Input';
