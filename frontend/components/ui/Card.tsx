import React from 'react';

interface CardProps {
  children: React.ReactNode;
  className?: string;
  interactive?: boolean;
  padding?: 'sm' | 'md' | 'lg' | 'none';
  onClick?: () => void;
  title?: string;
  subtitle?: string;
  actions?: React.ReactNode;
}

const paddingMap = {
  none: 'p-0',
  sm: 'p-3',
  md: 'p-5',
  lg: 'p-7',
};

export function Card({
  children,
  className = '',
  interactive = false,
  padding = 'md',
  onClick,
  title,
  subtitle,
  actions,
}: CardProps) {
  return (
    <div
      className={`
        bg-white rounded-xl border border-gray-200 shadow-sm
        ${interactive ? 'cursor-pointer hover:shadow-md hover:border-gray-300 transition-all duration-200' : ''}
        ${paddingMap[padding]}
        ${className}
      `.trim()}
      onClick={onClick}
    >
      {(title || actions) && (
        <div className="flex items-start justify-between mb-4">
          <div>
            {title && <h2 className="text-lg font-semibold text-gray-900">{title}</h2>}
            {subtitle && <p className="mt-1 text-sm text-gray-600">{subtitle}</p>}
          </div>
          {actions && <div className="flex items-center gap-2">{actions}</div>}
        </div>
      )}
      {children}
    </div>
  );
}

export default Card;
