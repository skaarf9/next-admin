import React from 'react';
import { cn } from '@/lib/utils';

export type ButtonProps = React.ButtonHTMLAttributes<HTMLButtonElement> & {
  size?: 'sm' | 'md' | 'lg';
  variant?: 'solid' | 'outline' | 'ghost';
};

export const Button: React.FC<ButtonProps> = ({
  size = 'md',
  variant = 'solid',
  className,
  children,
  ...props
}) => {
  const sizeClasses = {
    sm: 'px-2 py-1 text-sm',
    md: 'px-4 py-2 text-base',
    lg: 'px-6 py-3 text-lg',
  };

  const variantClasses = {
    solid: 'bg-primary text-white hover:bg-primary/90',
    outline: 'border border-primary text-primary hover:bg-primary/10',
    ghost: 'bg-transparent text-primary hover:bg-primary/10',
  };

  return (
    <button
      className={cn(
        'rounded-lg font-medium transition',
        sizeClasses[size],
        variantClasses[variant],
        className
      )}
      {...props}
    >
      {children}
    </button>
  );
};