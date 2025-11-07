import React, { useState, useCallback } from 'react';
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

  const handleSegmentClick = useCallback((segmentId: string, event: React.MouseEvent) => {
    const isShiftClick = event.shiftKey;
    onSegmentSelect(segmentId, isShiftClick);
  }, [onSegmentSelect]);

  const handleShowTitleInput = useCallback((segmentId: string, event: React.MouseEvent) => {
    event.stopPropagation();
    setShowingTitleInput(segmentId);
    setTitleInputValue('');
  }, []);

  const handleTitleSubmit = useCallback((segmentId: string) => {
    if (titleInputValue.trim()) {
      // If multiple segments are selected, apply title to all
      const targetSegments = selectedSegments.length > 0 ? selectedSegments : [segmentId];
      onAssignTitle(titleInputValue.trim(), targetSegments);
    }
    setShowingTitleInput(null);
    setTitleInputValue('');
  }, [titleInputValue, selectedSegments, onAssignTitle]);

  const handleTitleCancel = useCallback(() => {
    setShowingTitleInput(null);
    setTitleInputValue('');
  }, []);

  const handleTitleKeyDown = useCallback((event: React.KeyboardEvent, segmentId: string) => {
    if (event.key === 'Enter') {
      handleTitleSubmit(segmentId);
    } else if (event.key === 'Escape') {
      handleTitleCancel();
    }
  }, [handleTitleSubmit, handleTitleCancel]);

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
    <div className="segmented-text-display">
      <div className="segments-container">
        {segmentedText.map(({ segment, text }) => (
          <div key={segment.id} className="segment-wrapper">
            {/* Title input field - appears above the segment when active */}
            {showingTitleInput === segment.id && (
              <div className="title-input-container">
                <div className="title-input-wrapper">
                  <input
                    type="text"
                    className="title-input"
                    value={titleInputValue}
                    onChange={(e) => setTitleInputValue(e.target.value)}
                    onKeyDown={(e) => handleTitleKeyDown(e, segment.id)}
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
              </div>
            )}

            {/* Segment block */}
            <div 
              className={getSegmentClass(segment)}
              onClick={(e) => handleSegmentClick(segment.id, e)}
            >
              <div className="segment-header">
                <span className="segment-id">{segment.id}</span>
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

    </div>
  );
};

export default SegmentedTextDisplay;
