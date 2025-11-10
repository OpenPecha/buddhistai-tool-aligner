import React from 'react';
import type { TextMapping, TextSelection } from '../types';
import { useEditorContext } from '../context';
import { useTextSelectionStore } from '../../../stores/textSelectionStore';
import TypeSelector from './TypeSelector';

interface MappingSidebarProps {
  mappings: TextMapping[];
  currentSourceSelection: TextSelection | null;
  currentTargetSelections: TextSelection[];
  canCreateMapping: boolean;
  onCreateMapping: () => void;
  onDeleteMapping: (mappingId: string) => void;
  onClearAllMappings: () => void;
  onExportMappings: () => void;
  onClearSelections: () => void;
}

const MappingSidebar: React.FC<MappingSidebarProps> = ({
  mappings,
  currentSourceSelection,
  currentTargetSelections,
  canCreateMapping,
  onCreateMapping,
  onDeleteMapping,
  onClearAllMappings,
  onExportMappings,
  onClearSelections,
}) => {
  const { generateSentenceMappings } = useEditorContext();
  const { targetType } = useTextSelectionStore();
  
  const formatText = (text: string, maxLength: number = 50) => {
    return text.length > maxLength ? `${text.substring(0, maxLength)}...` : text;
  };

  const formatDate = (date: Date) => {
    return new Intl.DateTimeFormat('en-US', {
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    }).format(date);
  };


  const onPublishMappings = async () => {
    const mappings = generateSentenceMappings();
    console.log('Publishing mappings with type:', {
      type: targetType,
      mappings: mappings
    });
  };

  return (
    <div className="w-full bg-white border-l border-gray-200 flex flex-col h-full">
      {/* Header */}
      <div className="p-4 border-b border-gray-200 bg-gray-50">
        <h2 className="text-lg font-semibold text-gray-900 mb-3">Text Mappings</h2>
        
        {/* Type Selector */}
        <TypeSelector className="mb-4" />
        
        {/* Publish Button */}
        <button 
          onClick={onPublishMappings} 
          className="w-full px-4 py-2 bg-green-600 text-white text-sm font-medium rounded hover:bg-green-700 transition-colors mb-3"
        >
          Publish Mappings
        </button>
        
        <p className="text-sm text-gray-600">
          {mappings.length} mapping{mappings.length !== 1 ? 's' : ''} created
        </p>
      </div>

      {/* Current Selection Status */}
      <div className="p-4 border-b border-gray-200 bg-blue-50">
        <h3 className="text-sm font-medium text-gray-900 mb-2">Current Selection</h3>
        
        {/* Source Selection */}
        <div className="mb-3">
          <div className="text-xs text-gray-600 mb-1">Source Editor:</div>
          {currentSourceSelection ? (
            <div className="bg-white p-2 rounded border text-sm">
              <div className="text-gray-800 font-medium">
                "{formatText(currentSourceSelection.text, 40)}"
              </div>
              <div className="text-xs text-gray-500 mt-1">
                Position: {currentSourceSelection.start}-{currentSourceSelection.end}
              </div>
            </div>
          ) : (
            <div className="text-xs text-gray-500 italic">No selection</div>
          )}
        </div>

        {/* Target Selections */}
        <div className="mb-3">
          <div className="text-xs text-gray-600 mb-1">
            Target Editor ({currentTargetSelections.length} selection{currentTargetSelections.length !== 1 ? 's' : ''}):
          </div>
          {currentTargetSelections.length > 0 ? (
            <div className="space-y-1">
              {currentTargetSelections.map((selection, index) => (
                <div key={index} className="bg-white p-2 rounded border text-sm">
                  <div className="text-gray-800 font-medium">
                    "{formatText(selection.text, 40)}"
                  </div>
                  <div className="text-xs text-gray-500 mt-1">
                    Position: {selection.start}-{selection.end}
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <div className="text-xs text-gray-500 italic">No selections</div>
          )}
        </div>

        {/* Action Buttons */}
        <div className="space-y-2">
          {/* Create Mapping Button */}
          <button
            onClick={onCreateMapping}
            disabled={!canCreateMapping}
            className={`w-full py-2 px-3 rounded text-sm font-medium transition-colors ${
              canCreateMapping
                ? 'bg-blue-600 text-white hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500'
                : 'bg-gray-300 text-gray-500 cursor-not-allowed'
            }`}
          >
            Create Mapping
          </button>

          {/* Reset Selections Button */}
          {(currentSourceSelection || currentTargetSelections.length > 0) && (
            <button
              onClick={onClearSelections}
              className="w-full py-2 px-3 rounded text-sm font-medium bg-orange-100 text-orange-700 hover:bg-orange-200 focus:outline-none focus:ring-2 focus:ring-orange-500 transition-colors"
            >
              Reset Selections
            </button>
          )}
        </div>
      </div>

      {/* Mappings List */}
      <div className="flex-1 overflow-y-auto">
        {mappings.length === 0 ? (
          <div className="p-4 text-center text-gray-500">
            <div className="text-4xl mb-2">📝</div>
            <p className="text-sm">No mappings created yet</p>
            <p className="text-xs text-gray-400 mt-1">
              Select text in both editors to create your first mapping
            </p>
          </div>
        ) : (
          <div className="p-4 space-y-3">
            {mappings.map((mapping) => (
              <div
                key={mapping.id}
                className="bg-gray-50 rounded-lg border p-3 hover:shadow-sm transition-shadow"
              >
                {/* Mapping Header */}
                <div className="flex items-center justify-between mb-2">
                  <div
                    className="w-4 h-4 rounded"
                    style={{ backgroundColor: mapping.color }}
                    title={`Mapping color: ${mapping.color}`}
                  />
                  <div className="text-xs text-gray-500">
                    {formatDate(mapping.createdAt)}
                  </div>
                </div>

                {/* Source Text */}
                <div className="mb-2">
                  <div className="text-xs text-gray-600 mb-1">Source:</div>
                  <div className="text-sm text-gray-800 bg-white p-2 rounded border">
                    "{formatText(mapping.sourceText)}"
                  </div>
                  <div className="text-xs text-gray-500 mt-1">
                    Position: {mapping.sourceStart}-{mapping.sourceEnd}
                  </div>
                </div>

                {/* Target Mappings */}
                <div className="mb-3">
                  <div className="text-xs text-gray-600 mb-1">
                    Target ({mapping.targetMappings.length}):
                  </div>
                  <div className="space-y-1">
                    {mapping.targetMappings.map((target, index) => (
                      <div key={index} className="text-sm text-gray-800 bg-white p-2 rounded border">
                        <div>"{formatText(target.text)}"</div>
                        <div className="text-xs text-gray-500 mt-1">
                          Position: {target.start}-{target.end}
                        </div>
                      </div>
                    ))}
                  </div>
                </div>

                {/* Delete Button */}
                <button
                  onClick={() => onDeleteMapping(mapping.id)}
                  className="w-full py-1 px-2 text-xs text-red-600 hover:text-red-800 hover:bg-red-50 rounded transition-colors"
                >
                  Delete Mapping
                </button>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Footer Actions */}
      {mappings.length > 0 && (
        <div className="p-4 border-t border-gray-200 bg-gray-50 space-y-2">
          <button
            onClick={onExportMappings}
            className="w-full py-2 px-3 bg-green-600 text-white rounded text-sm font-medium hover:bg-green-700 focus:outline-none focus:ring-2 focus:ring-green-500 transition-colors"
          >
            Export Mappings
          </button>
          <button
            onClick={onClearAllMappings}
            className="w-full py-2 px-3 bg-red-600 text-white rounded text-sm font-medium hover:bg-red-700 focus:outline-none focus:ring-2 focus:ring-red-500 transition-colors"
          >
            Clear All Mappings
          </button>
        </div>
      )}
    </div>
  );
};

export default MappingSidebar;
