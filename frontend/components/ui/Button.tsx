import React from 'react';

export type ButtonVariant = 'primary' | 'outline' | 'danger' | 'warning' | 'ghost';
export type ButtonSize = 'sm' | 'md' | 'lg';

interface ButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: ButtonVariant;
  size?: ButtonSize;
  iconLeft?: React.ReactNode;
  iconRight?: React.ReactNode;
  loading?: boolean;
}

const sizeClasses: Record<ButtonSize, string> = {
  sm: 'text-xs px-2.5 py-1.5',
  md: 'text-sm px-3 py-2',
  lg: 'text-sm px-4 py-2.5',
};

const variantClasses: Record<ButtonVariant, string> = {
  primary: 'bg-blue-600 text-white hover:bg-blue-700 focus:ring-2 focus:ring-blue-500/50 shadow-sm disabled:opacity-50 disabled:cursor-not-allowed transition-all duration-200',
  outline: 'border border-gray-300 bg-white text-gray-700 hover:bg-gray-50 hover:border-gray-400 focus:ring-2 focus:ring-gray-500/30 disabled:opacity-50 disabled:cursor-not-allowed transition-all duration-200',
  danger: 'bg-red-600 text-white hover:bg-red-700 focus:ring-2 focus:ring-red-500/50 shadow-sm disabled:opacity-50 disabled:cursor-not-allowed transition-all duration-200',
  warning: 'bg-orange-600 text-white hover:bg-orange-700 focus:ring-2 focus:ring-orange-500/50 shadow-sm disabled:opacity-50 disabled:cursor-not-allowed transition-all duration-200',
  ghost: 'bg-transparent text-gray-700 hover:bg-gray-100 focus:ring-2 focus:ring-gray-500/30 disabled:opacity-50 disabled:cursor-not-allowed transition-all duration-200',
};

export function Button({
  variant = 'primary',
  size = 'md',
  iconLeft,
  iconRight,
  loading = false,
  children,
  className = '',
  ...rest
}: ButtonProps) {
  return (
    <button
      className={`inline-flex items-center justify-center gap-2 rounded-lg font-medium focus:outline-none ${variantClasses[variant]} ${sizeClasses[size]} ${className}`.trim()}
      disabled={loading || rest.disabled}
      {...rest}
    >
      {loading && (
        <span className="inline-block w-4 h-4 rounded-full border-2 border-white border-t-transparent animate-spin" />
      )}
      {!loading && iconLeft}
      {children}
      {!loading && iconRight}
    </button>
  );
}

export default Button;
