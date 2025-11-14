import React, { useState, useCallback, useMemo, useRef, useEffect } from 'react';
import type { SegmentAnnotation } from '../types';
import './SegmentedTextDisplay.css';

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
    const classes = ['segment-block'];
    
    if (selectedSegments.includes(segment.id)) {
      classes.push('selected');
    }
    
    if (segment.title) {
      classes.push('has-title');
    }
    
    return classes.join(' ');
  };


  return (
    <div className="flex flex-col h-full">
      <div className="flex-1 overflow-y-auto ">
        {segmentedText.map(({ segment, text }) => (
          <div key={segment.id} className="segment-wrapper">
            {/* Title input field - appears above the segment when active */}
            {showingTitleInput === segment.id && (
                <div className="">
                  <div className="p-2 flex items-center gap-2">
                    <input
                      ref={inputRef}
                      type="text"
                      className="title-input"
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
                    <div className="title-input-buttons">
                      <button
                        className="title-submit-btn"
                        onClick={() => handleTitleSubmit(segment.id)}
                        title="Save title"
                      >
                        ✓
                      </button>
                      <button
                        className="title-cancel-btn"
                        onClick={handleTitleCancel}
                        title="Cancel"
                      >
                        ✕
                      </button>
                    </div>
                  </div>

                  {/* Suggestions dropdown */}
                  {showSuggestions && filteredSuggestions.length > 0 && (
                    <div ref={suggestionsRef} className="title-suggestions">
                      {existingTitles.length > 0 && !titleInputValue && (
                        <div className="suggestions-header">
                          Existing titles:
                        </div>
                      )}
                      {filteredSuggestions.map((suggestion, index) => (
                        <div
                          key={suggestion}
                          role="button"
                          tabIndex={0}
                          className={`suggestion-item ${index === selectedSuggestionIndex ? 'selected' : ''}`}
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
              className={getSegmentClass(segment)}
              onClick={(e) => handleSegmentClick(segment.id, e)}
            >
              <div className="segment-header">
                <span className="segment-range">({segment.start}-{segment.end})</span>
                {segment.title && (
                  <span className="segment-title">{segment.title}</span>
                )}
                <button
                  className="add-title-btn"
                  onClick={(e) => handleShowTitleInput(segment.id, e)}
                  title="Add title to segment"
                >
                  🏷️
                </button>
              </div>
              <div className="segment-content">
                {text || '\u00A0'}
              </div>
              {selectedSegments.includes(segment.id) && (
                <div className="selection-indicator">Selected</div>
              )}
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
