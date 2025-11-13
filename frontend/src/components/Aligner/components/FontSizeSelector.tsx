import React from 'react';

interface FontSizeSelectorProps {
  fontSize: number;
  onFontSizeChange: (size: number) => void;
  availableSizes?: number[];
}

function FontSizeSelector({ 
  fontSize, 
  onFontSizeChange, 
  availableSizes = [18, 20, 22, 24] 
}: FontSizeSelectorProps) {
  return (
    <div className="flex items-center gap-1">
      <span className="text-xs text-gray-500 mr-1">Font:</span>
      <div className="flex items-center gap-1 border border-gray-300 rounded-md overflow-hidden">
        {availableSizes.map((size) => (
          <button
            key={size}
            onClick={() => onFontSizeChange(size)}
            className={`px-2 py-1 text-xs font-medium transition-colors ${
              fontSize === size
                ? 'bg-blue-500 text-white'
                : 'bg-white text-gray-700 hover:bg-gray-100'
            }`}
            title={`Set font size to ${size}px`}
          >
            {size}
          </button>
        ))}
      </div>
    </div>
  );
}

export default FontSizeSelector;

