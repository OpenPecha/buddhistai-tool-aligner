import React, { useState, useMemo, useCallback } from 'react';
import './SimpleTextDisplay.css';
import type { TextRange, TreeNode } from '../types';

// Memoized line component to prevent unnecessary re-renders
const LineComponent = React.memo(({ 
  line, 
  lineNumber, 
  showingInputForLine, 
  titleInputValue, 
  setTitleInputValue, 
  handleTitleKeyDown, 
  handleTitleSubmit, 
  handleTitleCancel, 
  getLineClass, 
  handleLineClick, 
  onCreateTitle, 
  handleCreateTitle 
}: { 
  line: string; 
  lineNumber: number;
  showingInputForLine: number | null;
  titleInputValue: string;
  setTitleInputValue: (value: string) => void;
  handleTitleKeyDown: (event: React.KeyboardEvent, lineNumber: number) => void;
  handleTitleSubmit: (lineNumber: number) => void;
  handleTitleCancel: () => void;
  getLineClass: (lineNumber: number) => string;
  handleLineClick: (lineNumber: number, lineText: string, event: React.MouseEvent | React.KeyboardEvent) => void;
  onCreateTitle?: (lineNumber: number, titleText: string) => void;
  handleCreateTitle: (lineNumber: number, lineText: string, event: React.MouseEvent) => void;
}) => (
  <React.Fragment>
    {/* Title input field - appears above the line when active */}
    {showingInputForLine === lineNumber && (
      <div className="title-input-container">
        <div className="title-input-wrapper">
          <input
            type="text"
            className="title-input"
            value={titleInputValue}
            onChange={(e) => setTitleInputValue(e.target.value)}
            onKeyDown={(e) => handleTitleKeyDown(e, lineNumber)}
            placeholder="Enter title for this segment..."
            autoFocus
          />
          <div className="title-input-buttons">
            <button
              className="title-submit-btn"
              onClick={() => handleTitleSubmit(lineNumber)}
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
    
    {/* Regular line content */}
    <div className={getLineClass(lineNumber)}>
      <button
        className="line-number"
        onClick={(e) => handleLineClick(lineNumber, line, e)}
        onKeyDown={(e) => {
          if (e.key === 'Enter' || e.key === ' ') {
            handleLineClick(lineNumber, line, e);
          }
        }}
      >
        {lineNumber}
      </button>
      <span className="line-content">{line || '\u00A0'}</span>
      {onCreateTitle && (
        <button
          className="title-button"
          onClick={(e) => handleCreateTitle(lineNumber, line, e)}
          title="Add title for this segment"
        >
          <svg className="title-icon" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 7h.01M7 3h5c.512 0 1.024.195 1.414.586l7 7a2 2 0 010 2.828l-7 7a.997.997 0 01-.707.293H7a4 4 0 01-4-4V7a4 4 0 014-4z" />
          </svg>
        </button>
      )}
    </div>
  </React.Fragment>
));

interface SimpleTextDisplayProps {
  text: string;
  headingMap: Map<number, number>;
  onLineClick: (lineNumber: number, lineText: string, isShiftClick?: boolean) => void;
  selectedRange?: TextRange | null;
  titleNodes?: TreeNode[];
  onCreateTitle?: (lineNumber: number, titleText: string) => void;
}

export const SimpleTextDisplay: React.FC<SimpleTextDisplayProps> = ({
  text,
  headingMap,
  onLineClick,
  selectedRange,
  titleNodes = [],
  onCreateTitle,
}) => {
  const [selectedLine, setSelectedLine] = useState<number | null>(null);
  const [showingInputForLine, setShowingInputForLine] = useState<number | null>(null);
  const [titleInputValue, setTitleInputValue] = useState('');
  
  // Split text into lines - memoized to prevent recalculation on every render
  const lines = useMemo(() => text.split('\n'), [text]);

  // Create a map of line numbers to title nodes for O(1) lookup
  const titleNodeMap = useMemo(() => {
    const map = new Map<number, TreeNode>();
    for (const node of titleNodes) {
      if (node.lineNumber) {
        map.set(node.lineNumber, node);
      }
    }
    return map;
  }, [titleNodes]);

  const handleLineClick = useCallback((lineNumber: number, lineText: string, event: React.MouseEvent | React.KeyboardEvent) => {
    setSelectedLine(lineNumber);
    const isShiftClick = event.shiftKey;
    onLineClick(lineNumber, lineText, isShiftClick);
  }, [onLineClick]);

  const handleCreateTitle = useCallback((lineNumber: number, lineText: string, event: React.MouseEvent) => {
    event.stopPropagation(); // Prevent line selection when clicking title button
    setShowingInputForLine(lineNumber);
    setTitleInputValue(lineText.trim()); // Pre-fill with line content
  }, []);

  const handleTitleSubmit = useCallback((lineNumber: number) => {
    if (onCreateTitle && titleInputValue.trim()) {
      onCreateTitle(lineNumber, titleInputValue.trim());
    }
    setShowingInputForLine(null);
    setTitleInputValue('');
  }, [onCreateTitle, titleInputValue]);

  const handleTitleCancel = useCallback(() => {
    setShowingInputForLine(null);
    setTitleInputValue('');
  }, []);

  const handleTitleKeyDown = useCallback((event: React.KeyboardEvent, lineNumber: number) => {
    if (event.key === 'Enter') {
      handleTitleSubmit(lineNumber);
    } else if (event.key === 'Escape') {
      handleTitleCancel();
    }
  }, [handleTitleSubmit, handleTitleCancel]);

  const getLineClass = (lineNumber: number): string => {
    const classes = ['text-line'];
    
    // Check if line has a heading level
    const headingLevel = headingMap.get(lineNumber);
    if (headingLevel === undefined) {
      // Default to paragraph for unmarked text
      classes.push('paragraph');
    } else {
      classes.push(`heading-${headingLevel + 1}`);
    }
    
    // Check if line is in selected range
    if (selectedRange?.selectedLines.includes(lineNumber)) {
      classes.push('range-selected');
    }
    
    // Check if line is individually selected
    if (selectedLine === lineNumber) {
      classes.push('selected-line');
    }
    
    // Check if line belongs to a title node - using O(1) map lookup instead of O(n) find
    const titleNode = titleNodeMap.get(lineNumber);
    if (titleNode?.isTitle) {
      classes.push('title-line');
    }
    
    return classes.join(' ');
  };

  return (
    <div className="simple-text-display">
      {lines.map((line, index) => {
        const lineNumber = index + 1;
        return (
          <LineComponent 
            key={lineNumber} 
            line={line} 
            lineNumber={lineNumber}
            showingInputForLine={showingInputForLine}
            titleInputValue={titleInputValue}
            setTitleInputValue={setTitleInputValue}
            handleTitleKeyDown={handleTitleKeyDown}
            handleTitleSubmit={handleTitleSubmit}
            handleTitleCancel={handleTitleCancel}
            getLineClass={getLineClass}
            handleLineClick={handleLineClick}
            onCreateTitle={onCreateTitle}
            handleCreateTitle={handleCreateTitle}
          />
        );
      })}
    </div>
  );
};

