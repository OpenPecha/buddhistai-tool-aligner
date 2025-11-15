import React, { useState, useCallback, useMemo, useRef, useEffect } from 'react';
import type { SegmentAnnotation } from '../types';

interface SegmentedTextDisplayProps {
  segmentedText: Array<{segment: SegmentAnnotation, text: string}>;
  selectedSegments: string[];
  onSegmentSelect: (segmentId: string, isShiftClick?: boolean) => void;
  onAssignTitle: (title: string, segmentIds?: string[]) => void;
}

export const SegmentedTextDisplay: React.FC<SegmentedTextDisplayProps> = ({
  segmentedText,
  selectedSegments,
  onSegmentSelect,
  onAssignTitle,
}) => {
  const [showingTitleInput, setShowingTitleInput] = useState<string | null>(null);
  const [titleInputValue, setTitleInputValue] = useState('');
  const [showSuggestions, setShowSuggestions] = useState(false);
  const [selectedSuggestionIndex, setSelectedSuggestionIndex] = useState(0);
  const suggestionsRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  // Get unique existing titles from all segments
  const existingTitles = useMemo(() => {
    const titles = new Set<string>();
    segmentedText.forEach(({ segment }) => {
      if (segment.title && segment.title.trim()) {
        titles.add(segment.title.trim());
      }
    });
    return Array.from(titles).sort();
  }, [segmentedText]);

  // Filter suggestions based on input
  const filteredSuggestions = useMemo(() => {
    if (!titleInputValue.trim()) {
      return existingTitles;
    }
    const query = titleInputValue.toLowerCase();
    return existingTitles.filter(title => 
      title.toLowerCase().includes(query)
    );
  }, [titleInputValue, existingTitles]);

  const handleSegmentClick = useCallback((segmentId: string, event: React.MouseEvent) => {
    const isShiftClick = event.shiftKey;
    onSegmentSelect(segmentId, isShiftClick);
  }, [onSegmentSelect]);

  // Handle click outside to close suggestions
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (
        suggestionsRef.current && 
        !suggestionsRef.current.contains(event.target as Node) &&
        inputRef.current &&
        !inputRef.current.contains(event.target as Node)
      ) {
        setShowSuggestions(false);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, []);

  const handleShowTitleInput = useCallback((segmentId: string, event: React.MouseEvent) => {
    event.stopPropagation();
    setShowingTitleInput(segmentId);
    setTitleInputValue('');
    setShowSuggestions(false);
    setSelectedSuggestionIndex(0);
  }, []);

  const handleTitleInputChange = useCallback((value: string) => {
    setTitleInputValue(value);
    setShowSuggestions(true);
    setSelectedSuggestionIndex(0);
  }, []);

  const handleTitleSubmit = useCallback((segmentId: string, titleOverride?: string) => {
    const finalTitle = titleOverride || titleInputValue;
    if (finalTitle.trim()) {
      // If multiple segments are selected, apply title to all
      const targetSegments = selectedSegments.length > 0 ? selectedSegments : [segmentId];
      onAssignTitle(finalTitle.trim(), targetSegments);
    }
    setShowingTitleInput(null);
    setTitleInputValue('');
    setShowSuggestions(false);
  }, [titleInputValue, selectedSegments, onAssignTitle]);

  const handleSuggestionClick = useCallback((suggestion: string, segmentId: string) => {
    handleTitleSubmit(segmentId, suggestion);
  }, [handleTitleSubmit]);

  const handleTitleCancel = useCallback(() => {
    setShowingTitleInput(null);
    setTitleInputValue('');
    setShowSuggestions(false);
  }, []);

  const handleTitleKeyDown = useCallback((event: React.KeyboardEvent, segmentId: string) => {
    if (event.key === 'Enter') {
      if (showSuggestions && filteredSuggestions.length > 0) {
        // Select the highlighted suggestion
        const selectedTitle = filteredSuggestions[selectedSuggestionIndex];
        handleTitleSubmit(segmentId, selectedTitle);
      } else {
        handleTitleSubmit(segmentId);
      }
    } else if (event.key === 'Escape') {
      if (showSuggestions) {
        setShowSuggestions(false);
      } else {
        handleTitleCancel();
      }
    } else if (event.key === 'ArrowDown') {
      event.preventDefault();
      if (showSuggestions && filteredSuggestions.length > 0) {
        setSelectedSuggestionIndex(prev => 
          prev < filteredSuggestions.length - 1 ? prev + 1 : 0
        );
      } else {
        setShowSuggestions(true);
      }
    } else if (event.key === 'ArrowUp') {
      event.preventDefault();
      if (showSuggestions && filteredSuggestions.length > 0) {
        setSelectedSuggestionIndex(prev => 
          prev > 0 ? prev - 1 : filteredSuggestions.length - 1
        );
      }
    }
  }, [showSuggestions, filteredSuggestions, selectedSuggestionIndex, handleTitleSubmit, handleTitleCancel]);

  const getSegmentClass = (segment: SegmentAnnotation): string => {
    const isSelected = selectedSegments.includes(segment.id);
    const hasTitle = !!segment.title;
    
    const classes = [
      'bg-white border-2  p-4 cursor-pointer transition-all duration-200 relative',
      isSelected 
        ? 'border-blue-500 bg-blue-50 shadow-[0_0_0_3px_rgba(59,130,246,0.1)]' 
        : 'border-slate-200 hover:border-slate-300 hover:shadow-md',
    ];
    
    if (hasTitle) {
      classes.push(isSelected ? 'border-l-4 border-l-emerald-600' : 'border-l-4 border-l-emerald-500');
    }
    
    return classes.join(' ');
  };


  return (
    <div className="flex flex-col h-full font-['Noto',sans-serif]">
      <div className="flex-1 overflow-y-auto  pointer-events-auto">
        {segmentedText.map(({ segment, text }) => (
          <div key={segment.id} className="relative">
            {/* Title input field - appears above the segment when active */}
            {showingTitleInput === segment.id && (
                <div className="">
                  <div className="p-2 flex items-center gap-2">
                    <input
                      ref={inputRef}
                      type="text"
                      className="flex-1 p-2 border border-amber-600 rounded text-sm bg-white focus:outline-none focus:border-amber-700 focus:ring-2 focus:ring-amber-100"
                      value={titleInputValue}
                      onChange={(e) => handleTitleInputChange(e.target.value)}
                      onKeyDown={(e) => handleTitleKeyDown(e, segment.id)}
                      onFocus={() => existingTitles.length > 0 && setShowSuggestions(true)}
                      placeholder={selectedSegments.length > 1 ? 
                        `Enter title for ${selectedSegments.length} segments...` : 
                        "Enter title for this segment..."
                      }
                      autoFocus
                    />
                    <div className="flex gap-1">
                      <button
                        className="w-8 h-8 border-none rounded cursor-pointer font-semibold transition-all duration-200 flex items-center justify-center bg-emerald-500 text-white hover:bg-emerald-600"
                        onClick={() => handleTitleSubmit(segment.id)}
                        title="Save title"
                      >
                        ✓
                      </button>
                      <button
                        className="w-8 h-8 border-none rounded cursor-pointer font-semibold transition-all duration-200 flex items-center justify-center bg-red-500 text-white hover:bg-red-600"
                        onClick={handleTitleCancel}
                        title="Cancel"
                      >
                        ✕
                      </button>
                    </div>
                  </div>

                  {/* Suggestions dropdown */}
                  {showSuggestions && filteredSuggestions.length > 0 && (
                    <div ref={suggestionsRef} className="absolute top-full left-3 right-3 mt-2 bg-white border-2 border-amber-500 rounded-md shadow-lg max-h-[200px] overflow-y-auto z-[1000]">
                      {existingTitles.length > 0 && !titleInputValue && (
                        <div className="px-3 py-2 text-xs font-semibold text-gray-500 uppercase bg-gray-50 border-b border-gray-200">
                          Existing titles:
                        </div>
                      )}
                      {filteredSuggestions.map((suggestion, index) => (
                        <div
                          key={suggestion}
                          role="button"
                          tabIndex={0}
                          className={`px-3 py-2 cursor-pointer text-sm text-gray-700 transition-colors duration-150 border-b border-gray-100 last:border-b-0 ${
                            index === selectedSuggestionIndex 
                              ? 'bg-amber-100 text-amber-900 font-semibold' 
                              : 'hover:bg-amber-100 hover:text-amber-900'
                          }`}
                          onClick={() => handleSuggestionClick(suggestion, segment.id)}
                          onKeyDown={(e) => {
                            if (e.key === 'Enter' || e.key === ' ') {
                              e.preventDefault();
                              handleSuggestionClick(suggestion, segment.id);
                            }
                          }}
                          onMouseEnter={() => setSelectedSuggestionIndex(index)}
                        >
                          {suggestion}
                        </div>
                      ))}
                    </div>
                  )}
                </div>
            )}

            {/* Segment block */}
            <div 
              className={getSegmentClass(segment) + ' pointer-events-auto'}
              onClick={(e) => handleSegmentClick(segment.id, e)}
            >
              <div className="flex absolute top-0 right-0 items-center gap-2 mb-3 text-sm text-gray-500">
                {/* <span className="text-gray-400 font-['Noto,sans-serif']">({segment.start}-{segment.end})</span> */}
                {segment.title && (
                  <span className="font-semibold capitalize bg-blue-100 text-blue-900 rounded-md truncate max-w-[200px] px-2 py-1  ml-auto font-['Noto',sans-serif]">{segment.title}</span>
                )}
               
              </div>
              <div className="leading-relaxed text-gray-700 whitespace-pre-wrap break-words">
              {selectedSegments.includes(segment.id) && (
                  <button
                    className="bg-transparent border-none cursor-pointer p-1 rounded transition-colors duration-200 text-base hover:bg-gray-100"
                    onClick={(e) => handleShowTitleInput(segment.id, e)}
                    title="Add title to segment"
                  >
                    🏷️
                  </button>
                )}
                {text || '\u00A0'}
              </div>
             
            </div>
          </div>
        ))}
      </div>
      <div className="text-sm text-gray-500 bg-gray-100 p-2 rounded-md">
        Hold Shift and click to select multiple segments
      </div>
    </div>
  );
};

export default SegmentedTextDisplay;
