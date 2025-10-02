import React from 'react';
import { Grid, List } from 'lucide-react';

interface ViewModeToggleProps {
  viewMode: 'grid' | 'list' | 'card';
  onViewModeChange: (mode: 'grid' | 'list' | 'card') => void;
  options?: Array<{
    value: 'grid' | 'list' | 'card';
    label: string;
    icon?: React.ReactNode;
  }>;
  className?: string;
}

const ViewModeToggle: React.FC<ViewModeToggleProps> = ({ 
  viewMode, 
  onViewModeChange, 
  options,
  className = '' 
}) => {
  const defaultOptions = [
    { value: 'grid' as const, label: '网格视图', icon: <Grid className="w-4 h-4" /> },
    { value: 'list' as const, label: '列表视图', icon: <List className="w-4 h-4" /> }
  ];

  const toggleOptions = options || defaultOptions;

  return (
    <div className={`flex bg-gray-100 rounded-lg p-1 ${className}`}>
      {toggleOptions.map((option) => (
        <button
          key={option.value}
          onClick={() => onViewModeChange(option.value)}
          className={`px-3 py-1 rounded text-sm font-medium transition-colors flex items-center gap-2 ${
            viewMode === option.value
              ? 'bg-white text-blue-600 shadow-sm'
              : 'text-gray-600 hover:text-gray-800'
          }`}
        >
          {option.icon}
          {option.label}
        </button>
      ))}
    </div>
  );
};

export default ViewModeToggle;