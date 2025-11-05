import React, { useState } from 'react';
import './SimpleTextDisplay.css';

interface SimpleTextDisplayProps {
  text: string;
  headingMap: Map<number, number>;
  onLineClick: (lineNumber: number, lineText: string) => void;
}

export const SimpleTextDisplay: React.FC<SimpleTextDisplayProps> = ({
  text,
  headingMap,
  onLineClick,
}) => {
  const [selectedLine, setSelectedLine] = useState<number | null>(null);
  
  // Split text into lines
  const lines = text.split('\n');

  const handleLineClick = (lineNumber: number, lineText: string) => {
    setSelectedLine(lineNumber);
    onLineClick(lineNumber, lineText);
  };

  const getLineClass = (lineNumber: number): string => {
    const classes = ['text-line'];
    
    // Check if line has a heading level
    const headingLevel = headingMap.get(lineNumber);
    if (headingLevel !== undefined) {
      classes.push(`heading-${headingLevel + 1}`);
    } else {
      // Default to paragraph for unmarked text
      classes.push('paragraph');
    }
    
    // Check if line is selected
    if (selectedLine === lineNumber) {
      classes.push('selected-line');
    }
    
    return classes.join(' ');
  };

  const getLineLabel = (lineNumber: number): string => {
    const headingLevel = headingMap.get(lineNumber);
    if (headingLevel !== undefined) {
      return `H${headingLevel + 1}`;
    }
    return 'P';
  };

  return (
    <div className="simple-text-display">
      {lines.map((line, index) => {
        const lineNumber = index + 1;
        return (
          <div key={lineNumber} className={getLineClass(lineNumber)}>
            <span
              className="line-number"
              onClick={() => handleLineClick(lineNumber, line)}
            >
              {lineNumber}
            </span>
            <span className="line-tag">{getLineLabel(lineNumber)}</span>
            <span className="line-content">{line || '\u00A0'}</span>
          </div>
        );
      })}
    </div>
  );
};

