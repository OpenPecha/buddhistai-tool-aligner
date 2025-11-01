import React, { useState, useRef, useCallback } from 'react';

interface TextSegment {
  id: string;
  start: number;
  end: number;
  text: string;
  textareaId: 'left' | 'right';
}

interface TextMapping {
  id: string;
  leftSegment: TextSegment;
  rightSegment: TextSegment;
  color: string;
}

interface Selection {
  start: number;
  end: number;
  text: string;
}

const MAPPING_COLORS = [
  '#FF6B6B', '#4ECDC4', '#45B7D1', '#96CEB4', '#FFEAA7',
  '#DDA0DD', '#98D8C8', '#F7DC6F', '#BB8FCE', '#85C1E9'
];

function TextMapper() {
  const [leftText, setLeftText] = useState('');
  const [rightText, setRightText] = useState('');
  const [mappings, setMappings] = useState<TextMapping[]>([]);
  const [selectedSegment, setSelectedSegment] = useState<TextSegment | null>(null);
  const [leftSelection, setLeftSelection] = useState<Selection | null>(null);
  const [rightSelection, setRightSelection] = useState<Selection | null>(null);
  
  const leftTextareaRef = useRef<HTMLTextAreaElement>(null);
  const rightTextareaRef = useRef<HTMLTextAreaElement>(null);

  // Get next available color for mappings
  const getNextColor = useCallback(() => {
    const usedColors = mappings.map(m => m.color);
    const availableColor = MAPPING_COLORS.find(color => !usedColors.includes(color));
    return availableColor || MAPPING_COLORS[mappings.length % MAPPING_COLORS.length];
  }, [mappings]);

  // Handle text selection in textarea
  const handleTextSelection = (textareaId: 'left' | 'right') => {
    const textarea = textareaId === 'left' ? leftTextareaRef.current : rightTextareaRef.current;
    const text = textareaId === 'left' ? leftText : rightText;
    
    if (!textarea) return;

    const start = textarea.selectionStart;
    const end = textarea.selectionEnd;
    
    if (start === end) {
      // No selection, clear current selection
      if (textareaId === 'left') {
        setLeftSelection(null);
      } else {
        setRightSelection(null);
      }
      return;
    }

    const selectedText = text.substring(start, end);
    const selection: Selection = { start, end, text: selectedText };
    
    if (textareaId === 'left') {
      setLeftSelection(selection);
    } else {
      setRightSelection(selection);
    }
  };

  // Create a text segment from selection
  const createSegmentFromSelection = (selection: Selection, textareaId: 'left' | 'right'): TextSegment => {
    return {
      id: `${textareaId}-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
      start: selection.start,
      end: selection.end,
      text: selection.text,
      textareaId
    };
  };

  // Create mapping between selected segments
  const createMapping = () => {
    if (!leftSelection || !rightSelection) {
      alert('Please select text in both textareas before creating a mapping.');
      return;
    }

    const leftSegment = createSegmentFromSelection(leftSelection, 'left');
    const rightSegment = createSegmentFromSelection(rightSelection, 'right');
    
    const newMapping: TextMapping = {
      id: `mapping-${Date.now()}`,
      leftSegment,
      rightSegment,
      color: getNextColor()
    };

    setMappings(prev => [...prev, newMapping]);
    setLeftSelection(null);
    setRightSelection(null);
    
    // Clear selections in textareas
    if (leftTextareaRef.current) {
      leftTextareaRef.current.setSelectionRange(0, 0);
    }
    if (rightTextareaRef.current) {
      rightTextareaRef.current.setSelectionRange(0, 0);
    }
  };

  // Remove a mapping
  const removeMapping = (mappingId: string) => {
    setMappings(prev => prev.filter(m => m.id !== mappingId));
  };

  // Clear all mappings
  const clearAllMappings = () => {
    if (mappings.length > 0 && confirm('Are you sure you want to clear all mappings?')) {
      setMappings([]);
    }
  };

  // Get highlighted text with mappings
  const getHighlightedText = (text: string, textareaId: 'left' | 'right') => {
    if (!text) return text;

    const segments = mappings
      .filter(m => m[textareaId === 'left' ? 'leftSegment' : 'rightSegment'])
      .map(m => ({
        segment: m[textareaId === 'left' ? 'leftSegment' : 'rightSegment'],
        color: m.color,
        mappingId: m.id
      }))
      .sort((a, b) => a.segment.start - b.segment.start);

    if (segments.length === 0) return text;

    let result = '';
    let lastIndex = 0;

    segments.forEach(({ segment, color, mappingId }) => {
      // Add text before this segment
      result += text.substring(lastIndex, segment.start);
      
      // Add highlighted segment
      result += `<span class="mapped-segment" style="background-color: ${color}40; border-left: 3px solid ${color}; padding: 1px 2px; margin: 0 1px;" data-mapping-id="${mappingId}" title="Mapped to: ${mappings.find(m => m.id === mappingId)?.[textareaId === 'left' ? 'rightSegment' : 'leftSegment'].text}">${segment.text}</span>`;
      
      lastIndex = segment.end;
    });

    // Add remaining text
    result += text.substring(lastIndex);
    
    return result;
  };

  // Export mappings as JSON
  const exportMappings = () => {
    const exportData = {
      leftText,
      rightText,
      mappings: mappings.map(m => ({
        id: m.id,
        leftSegment: {
          text: m.leftSegment.text,
          start: m.leftSegment.start,
          end: m.leftSegment.end
        },
        rightSegment: {
          text: m.rightSegment.text,
          start: m.rightSegment.start,
          end: m.rightSegment.end
        },
        color: m.color
      })),
      createdAt: new Date().toISOString()
    };

    const dataStr = JSON.stringify(exportData, null, 2);
    const dataBlob = new Blob([dataStr], { type: 'application/json' });
    const url = URL.createObjectURL(dataBlob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `text-mappings-${new Date().toISOString().split('T')[0]}.json`;
    link.click();
    URL.revokeObjectURL(url);
  };

  return (
    <div className="h-screen w-full flex flex-col bg-gray-50">
      {/* Header */}
      <div className="bg-white border-b border-gray-200 p-4">
        <div className="flex justify-between items-center">
          <div>
            <h1 className="text-2xl font-bold text-gray-900">Text Mapper</h1>
            <p className="text-sm text-gray-600 mt-1">
              Select text segments in both areas and create mappings between them
            </p>
          </div>
          <div className="flex gap-2">
            <button
              onClick={createMapping}
              disabled={!leftSelection || !rightSelection}
              className="bg-blue-500 text-white px-4 py-2 rounded-md hover:bg-blue-600 disabled:bg-gray-300 disabled:cursor-not-allowed transition-colors"
            >
              Create Mapping
            </button>
            <button
              onClick={clearAllMappings}
              disabled={mappings.length === 0}
              className="bg-red-500 text-white px-4 py-2 rounded-md hover:bg-red-600 disabled:bg-gray-300 disabled:cursor-not-allowed transition-colors"
            >
              Clear All
            </button>
            <button
              onClick={exportMappings}
              disabled={mappings.length === 0}
              className="bg-green-500 text-white px-4 py-2 rounded-md hover:bg-green-600 disabled:bg-gray-300 disabled:cursor-not-allowed transition-colors"
            >
              Export
            </button>
          </div>
        </div>
      </div>

      {/* Main Content */}
      <div className="flex-1 flex">
        {/* Left Textarea */}
        <div className="w-1/2 p-4 border-r border-gray-200">
          <div className="h-full flex flex-col">
            <div className="flex justify-between items-center mb-2">
              <h2 className="text-lg font-semibold text-gray-800">Source Text</h2>
              {leftSelection && (
                <span className="text-sm text-blue-600 bg-blue-50 px-2 py-1 rounded">
                  Selected: "{leftSelection.text.substring(0, 30)}{leftSelection.text.length > 30 ? '...' : ''}"
                </span>
              )}
            </div>
            <div className="flex-1 relative">
              <textarea
                ref={leftTextareaRef}
                value={leftText}
                onChange={(e) => setLeftText(e.target.value)}
                onSelect={() => handleTextSelection('left')}
                onMouseUp={() => handleTextSelection('left')}
                onKeyUp={() => handleTextSelection('left')}
                placeholder="Enter your source text here..."
                className="w-full h-full p-3 border border-gray-300 rounded-lg resize-none focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent font-mono text-sm"
              />
              {/* Overlay for highlighting */}
              {mappings.length > 0 && (
                <div 
                  className="absolute inset-0 pointer-events-none p-3 font-mono text-sm whitespace-pre-wrap break-words overflow-hidden"
                  style={{ 
                    color: 'transparent',
                    background: 'transparent',
                    border: '1px solid transparent',
                    borderRadius: '0.5rem'
                  }}
                  dangerouslySetInnerHTML={{ __html: getHighlightedText(leftText, 'left') }}
                />
              )}
            </div>
          </div>
        </div>

        {/* Right Textarea */}
        <div className="w-1/2 p-4">
          <div className="h-full flex flex-col">
            <div className="flex justify-between items-center mb-2">
              <h2 className="text-lg font-semibold text-gray-800">Target Text</h2>
              {rightSelection && (
                <span className="text-sm text-green-600 bg-green-50 px-2 py-1 rounded">
                  Selected: "{rightSelection.text.substring(0, 30)}{rightSelection.text.length > 30 ? '...' : ''}"
                </span>
              )}
            </div>
            <div className="flex-1 relative">
              <textarea
                ref={rightTextareaRef}
                value={rightText}
                onChange={(e) => setRightText(e.target.value)}
                onSelect={() => handleTextSelection('right')}
                onMouseUp={() => handleTextSelection('right')}
                onKeyUp={() => handleTextSelection('right')}
                placeholder="Enter your target text here..."
                className="w-full h-full p-3 border border-gray-300 rounded-lg resize-none focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent font-mono text-sm"
              />
              {/* Overlay for highlighting */}
              {mappings.length > 0 && (
                <div 
                  className="absolute inset-0 pointer-events-none p-3 font-mono text-sm whitespace-pre-wrap break-words overflow-hidden"
                  style={{ 
                    color: 'transparent',
                    background: 'transparent',
                    border: '1px solid transparent',
                    borderRadius: '0.5rem'
                  }}
                  dangerouslySetInnerHTML={{ __html: getHighlightedText(rightText, 'right') }}
                />
              )}
            </div>
          </div>
        </div>
      </div>

      {/* Bottom Panel - Mappings List */}
      <div className="bg-white border-t border-gray-200 p-4 max-h-48 overflow-y-auto">
        <div className="flex justify-between items-center mb-3">
          <h3 className="text-lg font-semibold text-gray-800">
            Mappings ({mappings.length})
          </h3>
          {(leftSelection || rightSelection) && (
            <div className="text-sm text-gray-600">
              {leftSelection && rightSelection ? (
                <span className="text-green-600 font-medium">Ready to create mapping</span>
              ) : (
                <span>Select text in {leftSelection ? 'target' : rightSelection ? 'source' : 'both'} area{leftSelection && rightSelection ? '' : 's'}</span>
              )}
            </div>
          )}
        </div>
        
        {mappings.length === 0 ? (
          <div className="text-center py-8 text-gray-500">
            <svg className="mx-auto h-12 w-12 text-gray-400 mb-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M13.828 10.172a4 4 0 00-5.656 0l-4 4a4 4 0 105.656 5.656l1.102-1.101m-.758-4.899a4 4 0 005.656 0l4-4a4 4 0 00-5.656-5.656l-1.1 1.1" />
            </svg>
            <p>No mappings created yet</p>
            <p className="text-sm mt-1">Select text in both areas and click "Create Mapping"</p>
          </div>
        ) : (
          <div className="space-y-2">
            {mappings.map((mapping, index) => (
              <div
                key={mapping.id}
                className="flex items-center justify-between p-3 bg-gray-50 rounded-lg border"
              >
                <div className="flex items-center space-x-4 flex-1">
                  <div
                    className="w-4 h-4 rounded-full border-2 border-gray-300"
                    style={{ backgroundColor: mapping.color }}
                  />
                  <div className="flex-1 grid grid-cols-2 gap-4">
                    <div>
                      <div className="text-xs text-gray-500 mb-1">Source</div>
                      <div className="text-sm font-medium text-gray-900 truncate">
                        "{mapping.leftSegment.text}"
                      </div>
                      <div className="text-xs text-gray-500">
                        Position: {mapping.leftSegment.start}-{mapping.leftSegment.end}
                      </div>
                    </div>
                    <div>
                      <div className="text-xs text-gray-500 mb-1">Target</div>
                      <div className="text-sm font-medium text-gray-900 truncate">
                        "{mapping.rightSegment.text}"
                      </div>
                      <div className="text-xs text-gray-500">
                        Position: {mapping.rightSegment.start}-{mapping.rightSegment.end}
                      </div>
                    </div>
                  </div>
                </div>
                <button
                  onClick={() => removeMapping(mapping.id)}
                  className="ml-4 text-red-500 hover:text-red-700 p-1 rounded hover:bg-red-50 transition-colors"
                  title="Remove mapping"
                >
                  <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                  </svg>
                </button>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Instructions */}
      <div className="bg-blue-50 border-t border-blue-200 p-3">
        <div className="flex items-start space-x-2">
          <svg className="w-5 h-5 text-blue-500 mt-0.5 flex-shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
          </svg>
          <div className="text-sm text-blue-800">
            <strong>How to use:</strong> 
            1. Enter text in both areas 
            2. Select a text segment in the source area 
            3. Select corresponding text in the target area 
            4. Click "Create Mapping" to link them 
            5. Mapped segments will be highlighted with matching colors
          </div>
        </div>
      </div>
    </div>
  );
}

export default TextMapper;
