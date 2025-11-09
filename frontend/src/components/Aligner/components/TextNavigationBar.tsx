import React from 'react';
import { useSearchParams } from 'react-router-dom';
import { useTextSelectionStore } from '../../../stores/textSelectionStore';

function TextNavigationBar() {
  const { clearAllSelections } = useTextSelectionStore();
  const [searchParams] = useSearchParams();

  const selectedSourceInstanceId = searchParams.get('sInstanceId');
  const selectedTargetInstanceId = searchParams.get('tInstanceId');

  const handleReset = () => {
    clearAllSelections();
  };

  return (
    <div className="bg-white border-b border-gray-200 p-3">
      <div className="flex items-center justify-between gap-4">
        <div className="flex items-center gap-6">
          <div className="flex items-center gap-2">
            <span className="text-sm font-medium text-gray-700">Source:</span>
            <select className="text-sm text-gray-900 border border-gray-300 rounded px-2 py-1">
              <option value={selectedSourceInstanceId || ''}>
                {selectedSourceInstanceId || 'Not selected'}
              </option>
            </select>
          </div>
          <div className="flex items-center gap-2">
            <span className="text-sm font-medium text-gray-700">Target:</span>
            <select className="text-sm text-gray-900 border border-gray-300 rounded px-2 py-1">
              <option value={selectedTargetInstanceId || ''}>
                {selectedTargetInstanceId || 'Not selected'}
              </option>
            </select>
          </div>
        </div>
        <button 
          onClick={handleReset} 
          className="px-3 py-1 text-sm text-gray-700 hover:text-gray-900 hover:bg-gray-100 rounded transition-colors"
        >
          Reset
        </button>
      </div>
    </div>
  );
}

export default TextNavigationBar;