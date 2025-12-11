import React from 'react';

interface InputProps extends React.InputHTMLAttributes<HTMLInputElement> {
  label?: string;
  hint?: string;
  error?: string | null;
  wrapperClassName?: string;
}

export function Input({
  label,
  hint,
  error,
  wrapperClassName = '',
  className = '',
  ...rest
}: InputProps) {
  return (
    <div className={wrapperClassName}>
      {label && (
        <label className="block text-xs font-semibold uppercase tracking-wide text-gray-600 mb-1">
          {label}
        </label>
      )}
      <input
        className={`ui-input ${error ? 'border-red-400 focus:border-red-500 focus:ring-red-500' : ''} ${className}`.trim()}
        {...rest}
      />
      {hint && !error && <p className="helper-text">{hint}</p>}
      {error && <p className="helper-text text-red-600">{error}</p>}
    </div>
  );
}

export default Input;
