
import React from 'react';

interface InputProps {
  label: string;
  id: string;
  value: string;
  onChange: (e: React.ChangeEvent<HTMLInputElement>) => void;
  onBlur?: (e: React.ChangeEvent<HTMLInputElement>) => void;
  type?: 'text' | 'number' | 'date' | 'month';
  prefix?: string;
  placeholder?: string;
  error?: string;
  required?: boolean;
}

const Input: React.FC<InputProps> = ({ label, id, value, onChange, onBlur, type = 'text', prefix, placeholder, error, required }) => {
  return (
    <div className="w-full">
      <label htmlFor={id} className="block text-sm font-medium text-slate-600">
        {label} {required && <span className="text-red-500">*</span>}
      </label>
      <div className="mt-1 relative rounded-md shadow-sm">
        {prefix && (
          <div className="pointer-events-none absolute inset-y-0 left-0 pl-3 flex items-center">
            <span className="text-slate-500 sm:text-sm">{prefix}</span>
          </div>
        )}
        <input
          type={type}
          id={id}
          name={id}
          value={value}
          onChange={onChange}
          onBlur={onBlur}
          placeholder={placeholder}
          className={`
            block w-full rounded-md border-slate-300
            ${prefix ? 'pl-10' : 'pl-3'}
            pr-3 py-2
            focus:border-indigo-500 focus:ring-indigo-500 sm:text-sm
            ${error ? 'border-red-500 text-red-600 focus:border-red-500 focus:ring-red-500' : ''}
          `}
          required={required}
        />
      </div>
      {error && <p className="mt-1 text-xs text-red-600">{error}</p>}
    </div>
  );
};

export default Input;