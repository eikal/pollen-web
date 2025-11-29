import React from 'react';

interface ProgressBarProps {
  value: number; // 0-100
  state?: 'normal' | 'warning' | 'danger';
  className?: string;
  showLabel?: boolean;
}

export function ProgressBar({
  value,
  state = 'normal',
  className = '',
  showLabel = false,
}: ProgressBarProps) {
  const cl =
    `progress-bar ${state === 'warning' ? 'warning' : ''} ${state === 'danger' ? 'danger' : ''}`.trim();
  return (
    <div className={`space-y-1 ${className}`.trim()}>
      <div className="progress-wrapper">
        <div className={cl} style={{ width: `${Math.min(100, Math.max(0, value))}%` }} />
      </div>
      {showLabel && <div className="text-xs font-medium text-gray-600">{Math.round(value)}%</div>}
    </div>
  );
}

export default ProgressBar;
