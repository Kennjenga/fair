import React from 'react';
import clsx from 'clsx';
import { LoadingDots } from './LoadingDots';

interface ButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: 'primary' | 'secondary' | 'icon' | 'outline' | 'ghost';
  size?: 'sm' | 'md' | 'lg';
  isLoading?: boolean;
  children: React.ReactNode;
}

export const Button = React.forwardRef<HTMLButtonElement, ButtonProps>(
  ({ variant = 'primary', size = 'md', isLoading = false, className, children, disabled, ...props }, ref) => {
    const baseStyles = 'px-4 py-2 rounded-xl font-medium transition-all active:scale-95 disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center';

    const variantStyles = {
      primary: 'bg-[#4F46E5] text-white hover:bg-[#4338CA] shadow-sm hover:shadow-md',
      secondary: 'bg-white text-[#0F172A] border-1.5 border-[#E2E8F0] hover:bg-[#F8FAFC]',
      outline: 'bg-white text-[#0F172A] border border-[#E2E8F0] hover:bg-[#F8FAFC]',
      ghost: 'bg-transparent text-[#64748B] hover:bg-[#F1F5F9] hover:text-[#0F172A]',
      icon: 'w-10 h-10 rounded-lg flex items-center justify-center hover:bg-[#F8FAFC] text-[#64748B] hover:text-[#0F172A]',
    };

    const sizeStyles = {
      sm: 'px-3 py-1.5 text-sm',
      md: 'px-4 py-2 text-base',
      lg: 'px-6 py-3 text-lg',
    };

    const combinedClassName = clsx(
      baseStyles,
      variantStyles[variant],
      variant !== 'icon' && sizeStyles[size],
      className
    );

    return (
      <button
        ref={ref}
        disabled={disabled || isLoading}
        className={combinedClassName}
        {...props}
      >
        {isLoading ? (
          <LoadingDots
            size={size === 'sm' ? 'sm' : size === 'lg' ? 'lg' : 'md'}
            color={variant === 'primary' ? 'white' : 'primary'}
          />
        ) : children}
      </button>
    );
  }
);

Button.displayName = 'Button';
