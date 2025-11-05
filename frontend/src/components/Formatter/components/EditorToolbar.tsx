import React, { useState } from 'react';

interface EditorToolbarProps {
  currentLine: number;
  currentLineText: string;
  onApply: (level: number) => void;
}

export const EditorToolbar: React.FC<EditorToolbarProps> = ({
  currentLine,
  currentLineText,
  onApply,
}) => {
  const [selectedLevel, setSelectedLevel] = useState(1);

  const handleApplyHeading = () => {
    if (currentLineText.trim()) {
      onApply(selectedLevel);
    }
  };

  const handleLevelChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    setSelectedLevel(Number(e.target.value));
  };

  return (
    <div className="bg-white border-b border-gray-200 p-3">
      <div className="flex items-center gap-4">
        {/* Line Info */}
        <div className="flex items-center gap-2">
          <span className="text-xs font-semibold text-gray-600 uppercase">Line:</span>
          <span className="px-2 py-1 bg-gray-100 text-gray-800 rounded text-sm font-mono">
            {currentLine}
          </span>
        </div>

        {/* Line Preview */}
        {currentLineText && (
          <div className="flex-1 min-w-0">
            <span className="text-xs text-gray-500 block truncate" title={currentLineText}>
              {currentLineText.length > 60 ? `${currentLineText.substring(0, 60)}...` : currentLineText}
            </span>
          </div>
        )}

        {/* Heading Level Selector */}
        <div className="flex items-center gap-2">
          <label htmlFor="heading-select" className="text-xs font-semibold text-gray-600 uppercase">
            Heading:
          </label>
          <select
            id="heading-select"
            value={selectedLevel}
            onChange={handleLevelChange}
            className="px-3 py-1.5 bg-white border border-gray-300 rounded text-sm font-medium text-gray-700 hover:border-gray-400 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-colors"
          >
            <option value={1}>H1 - Main Title</option>
            <option value={2}>H2 - Section</option>
            <option value={3}>H3 - Subsection</option>
            <option value={4}>H4 - Minor Heading</option>
            <option value={5}>H5 - Subheading</option>
            <option value={6}>H6 - Small Heading</option>
          </select>
        </div>

        {/* Apply Button */}
        <button
          onClick={handleApplyHeading}
          disabled={!currentLineText.trim()}
          className="px-4 py-1.5 bg-blue-600 hover:bg-blue-700 disabled:bg-gray-300 disabled:cursor-not-allowed text-white rounded text-sm font-medium transition-colors flex items-center gap-2"
        >
          <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
          </svg>
          Apply
        </button>
      </div>
    </div>
  );
};

