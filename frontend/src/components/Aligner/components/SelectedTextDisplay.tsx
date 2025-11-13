import React from 'react';
import { X } from 'lucide-react';
import { type BdrcSearchResult } from '../hooks/uesBDRC';

interface SelectedTextDisplayProps {
  selectedBdrcResult: BdrcSearchResult | null;
  textId: string | null;
  onReset: () => void;
}

export function SelectedTextDisplay({
  selectedBdrcResult,
  textId,
  onReset,
}: SelectedTextDisplayProps) {
  if (!selectedBdrcResult?.workId || !textId) {
    return null;
  }

  return (
    <div className="rounded-lg">
      <div className="flex items-start justify-between">
        <div className="flex-1">
          <h3 className="text-lg font-medium text-gray-900 mb-2">
            Selected Text
          </h3>
          {selectedBdrcResult && (
            <div className="space-y-1">
              <p className="text-sm font-medium text-gray-900">
                {selectedBdrcResult.prefLabel || selectedBdrcResult.workId || 'Untitled'}
              </p>
              {selectedBdrcResult.workId && (
                <p className="text-xs text-gray-500">
                  BDRC ID: {selectedBdrcResult.workId}
                </p>
              )}
              {textId && (
                <p className="text-xs text-gray-500">
                  Text ID: {textId}
                </p>
              )}
            </div>
          )}
        </div>
        <button
          onClick={onReset}
          className="ml-4 p-2 text-gray-400 hover:text-gray-600 hover:bg-gray-100 rounded-md transition-colors"
          title="Reset selection"
        >
          <X className="h-5 w-5" />
        </button>
      </div>
    </div>
  );
}

