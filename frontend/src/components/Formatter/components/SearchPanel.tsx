import React from 'react';
import type { SearchResult, TextSelection, SegmentMapping, TreeNode } from '../types';
import { generateExportData, exportTreeAsJSON } from '../utils/export-utils';

interface SearchPanelProps {
  selectedSegment: string | null;
  textSelection: TextSelection | null;
  searchQuery: string;
  searchResults: SearchResult[];
  segmentMappings: SegmentMapping[];
  treeData: TreeNode[];
  onSearchQueryChange: (query: string) => void;
  onCreateMapping: (result: SearchResult) => void;
  onRemoveMapping: (mappingId: string) => void;
  getHierarchicalNumber: (nodeId: string) => string;
  findNode: (nodes: TreeNode[], id: string) => TreeNode | null;
  getMappingCount: (nodeId: string) => number;
  getMappingsAsSource: (nodeId: string) => SegmentMapping[];
}

export const SearchPanel: React.FC<SearchPanelProps> = ({
  selectedSegment,
  textSelection,
  searchQuery,
  searchResults,
  segmentMappings,
  treeData,
  onSearchQueryChange,
  onCreateMapping,
  onRemoveMapping,
  getHierarchicalNumber,
  findNode,
  getMappingCount,
  getMappingsAsSource,
}) => {
  const selectedNode = selectedSegment ? findNode(treeData, selectedSegment) : null;
  const selectedMappings = selectedSegment ? getMappingsAsSource(selectedSegment) : [];

  return (
    <div className="w-80 space-y-4">
      <div className="bg-white border rounded-lg p-4 h-fit sticky top-4">
        <div className="mb-4">
          <h3 className="text-lg font-semibold text-gray-800 mb-2">Search & Map</h3>
          
          {/* Selected Segment Info */}
          {selectedSegment ? (
            <div className="mb-3 p-3 bg-blue-50 rounded border border-blue-200">
              <div className="flex items-center justify-between mb-2">
                <span className="text-sm text-blue-700 font-medium">Selected Segment:</span>
                <span className="text-sm font-bold text-blue-900">{getHierarchicalNumber(selectedSegment)}</span>
              </div>
              
              {/* Show selected text portion if any */}
              {textSelection && textSelection.nodeId === selectedSegment ? (
                <div className="p-2 bg-yellow-50 border border-yellow-200 rounded">
                  <div className="text-xs text-yellow-700 font-medium mb-1">Selected Text:</div>
                  <div className="text-sm text-yellow-800 bg-white p-2 rounded border border-yellow-200 max-h-20 overflow-y-auto">
                    "{textSelection.selectedText}"
                  </div>
                  <div className="text-xs text-yellow-600 mt-1">
                    Position: {textSelection.start} - {textSelection.end} ({textSelection.selectedText.length} chars)
                  </div>
                </div>
              ) : (
                <div className="p-2 bg-gray-50 border border-gray-200 rounded">
                  <div className="text-sm text-gray-600 text-center">
                    Select text within the segment to see it here
                  </div>
                </div>
              )}
              
              <div className="text-xs text-blue-600 mt-2">
                Level: {selectedNode?.level || 0} | 
                Length: {selectedNode?.text.length || 0} chars |
                Mappings: {getMappingCount(selectedSegment)}
              </div>
            </div>
          ) : (
            <div className="mb-3 p-2 bg-gray-50 rounded border border-gray-200">
              <span className="text-sm text-gray-600">Click on a segment to start mapping</span>
            </div>
          )}
          
          {/* Search Input */}
          <input
            type="text"
            placeholder="Search text in all segments..."
            value={searchQuery}
            onChange={(e) => onSearchQueryChange(e.target.value)}
            className="w-full p-2 border border-gray-300 rounded focus:outline-none focus:ring-2 focus:ring-blue-500"
            disabled={!selectedSegment}
          />
        </div>

        {/* Search Results */}
        {searchResults.length > 0 && (
          <div className="space-y-2 max-h-96 overflow-y-auto">
            <h4 className="text-sm font-medium text-gray-700">Search Results ({searchResults.length})</h4>
            {searchResults.map((result, index) => (
              <button 
                key={`${result.nodeId}-${index}`}
                className="w-full text-left p-3 border border-gray-200 rounded hover:bg-gray-50 cursor-pointer transition-colors"
                onClick={() => onCreateMapping(result)}
              >
                <div className="text-xs text-gray-500 mb-1">Section: {getHierarchicalNumber(result.nodeId)}</div>
                <div className="text-sm text-gray-800 mb-1">{result.context}</div>
                <div className="text-xs text-blue-600">
                  {textSelection && textSelection.nodeId === selectedSegment 
                    ? 'Click to map selected text' 
                    : 'Select text first to enable mapping'}
                </div>
              </button>
            ))}
          </div>
        )}

        {/* Current Mappings */}
        {selectedSegment && selectedMappings.length > 0 && (
          <div className="mt-4 pt-4 border-t border-gray-200">
            <h4 className="text-sm font-medium text-gray-700 mb-2">
              Mappings for {getHierarchicalNumber(selectedSegment)} ({selectedMappings.length})
            </h4>
            <div className="space-y-3 max-h-48 overflow-y-auto">
              {selectedMappings.map((mapping) => (
                <div key={mapping.id} className="p-3 bg-green-50 border border-green-200 rounded text-xs">
                  {/* Source Text Selection */}
                  <div className="mb-2">
                    <div className="font-medium text-green-800 mb-1">
                      Source: {getHierarchicalNumber(mapping.sourceSelection.nodeId)}
                    </div>
                    <div className="text-green-700 bg-white p-2 rounded border">
                      "{mapping.sourceSelection.selectedText}"
                    </div>
                    <div className="text-green-600 mt-1">
                      Span: {mapping.sourceSelection.start} - {mapping.sourceSelection.end} ({mapping.sourceSelection.selectedText.length} chars)
                    </div>
                  </div>
                  
                  <div className="text-center text-green-700 my-1">↓ maps to ↓</div>
                  
                  {/* Target Text Selection */}
                  <div className="mb-2">
                    <div className="font-medium text-blue-800 mb-1">
                      Target: {getHierarchicalNumber(mapping.targetSelection.nodeId)}
                    </div>
                    <div className="text-blue-700 bg-white p-2 rounded border">
                      "{mapping.targetSelection.selectedText}"
                    </div>
                    <div className="text-blue-600 mt-1">
                      Span: {mapping.targetSelection.start} - {mapping.targetSelection.end} ({mapping.targetSelection.selectedText.length} chars)
                    </div>
                  </div>
                  
                  <button
                    onClick={() => onRemoveMapping(mapping.id)}
                    className="mt-2 px-2 py-1 text-red-600 hover:text-red-800 hover:bg-red-100 rounded transition-colors"
                  >
                    Remove Mapping
                  </button>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>

      {/* JSON Preview Section */}
      <div className="bg-white border rounded-lg p-4">
        <div className="flex items-center justify-between mb-3">
          <h3 className="text-lg font-semibold text-gray-800">Export Preview</h3>
          <button
            onClick={() => exportTreeAsJSON(treeData, segmentMappings)}
            className="px-3 py-1 text-xs bg-purple-100 text-purple-700 rounded hover:bg-purple-200 transition-colors"
          >
            Download JSON
          </button>
        </div>
        
        <div className="text-xs text-gray-600 mb-2">
          Live preview of export data structure:
        </div>
        
        <div className="bg-gray-50 border rounded p-3 max-h-96 overflow-y-auto">
          <pre className="text-xs text-gray-800 whitespace-pre-wrap">
            {JSON.stringify(generateExportData(treeData, segmentMappings), null, 2)}
          </pre>
        </div>
        
        <div className="mt-2 text-xs text-gray-500">
          Total: {treeData.length} segments, {segmentMappings.length} mappings
        </div>
      </div>
    </div>
  );
};
