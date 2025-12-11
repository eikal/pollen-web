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
  primary: 'btn btn-primary',
  outline: 'btn btn-outline',
  danger: 'btn btn-danger',
  warning: 'btn btn-warning',
  ghost: 'btn btn-ghost',
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
      className={`${variantClasses[variant]} ${sizeClasses[size]} ${className}`.trim()}
      disabled={loading || rest.disabled}
      {...rest}
    >
      {loading && (
        <span className="inline-block w-3 h-3 rounded-full border-2 border-white border-t-transparent animate-spin" />
      )}
      {!loading && iconLeft}
      <span>{children}</span>
      {!loading && iconRight}
    </button>
  );
}

export default Button;
