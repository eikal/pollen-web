import React from 'react';

interface InputProps extends React.InputHTMLAttributes<HTMLInputElement> {
  label?: string;
  hint?: string;
  error?: string | null;
  wrapperClassName?: string;
  icon?: React.ReactNode;
}

export function Input({
  label,
  hint,
  error,
  wrapperClassName = '',
  className = '',
  icon,
  ...rest
}: InputProps) {
  const hasError = !!error;
  
  return (
    <div className={wrapperClassName}>
      {label && (
        <label className="block text-sm font-medium text-gray-700 mb-2">
          {label}
        </label>
      )}
      <div className="relative">
        {icon && (
          <div className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400">
            {icon}
          </div>
        )}
        <input
          className={`
            w-full py-3 
            ${icon ? 'pl-10 pr-4' : 'px-4'}
            border rounded-lg
            transition-all duration-200
            ${hasError 
              ? 'border-red-300 focus:border-red-500 focus:ring-2 focus:ring-red-500/20' 
              : 'border-gray-300 focus:border-blue-500 focus:ring-2 focus:ring-blue-500/20'
            }
            focus:outline-none
            placeholder:text-gray-400
            disabled:bg-gray-50 disabled:text-gray-500 disabled:cursor-not-allowed
            ${className}
          `.trim()}
          {...rest}
        />
      </div>
      {hint && !error && (
        <p className="mt-1.5 text-sm text-gray-500">{hint}</p>
      )}
      {error && (
        <p className="mt-1.5 text-sm text-red-600">{error}</p>
      )}
    </div>
  );
}

export default Input;
