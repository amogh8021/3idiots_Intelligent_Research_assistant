import React from 'react';
import { Search, X } from 'lucide-react';

interface Props {
  value: string;
  onChange: (value: string) => void;
  placeholder?: string;
  className?: string;
}

export const DocumentSearch: React.FC<Props> = ({
  value,
  onChange,
  placeholder = 'Filter research papers...',
  className = '',
}) => {
  return (
    <div className={`relative flex items-center ${className}`}>
      <Search className="w-3.5 h-3.5 text-stone-400 absolute left-3 pointer-events-none" />
      <input
        type="text"
        value={value}
        onChange={(e) => onChange(e.target.value)}
        placeholder={placeholder}
        className="w-full pl-9 pr-8 py-1.5 text-xs bg-white border border-stone-200 rounded-md text-stone-900 placeholder-stone-400 focus:outline-none focus:ring-1 focus:ring-stone-500 focus:border-stone-500 transition-colors shadow-2xs"
      />
      {value && (
        <button
          onClick={() => onChange('')}
          className="absolute right-2.5 text-stone-400 hover:text-stone-600 focus:outline-none"
        >
          <X className="w-3.5 h-3.5" />
        </button>
      )}
    </div>
  );
};
