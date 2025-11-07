import React, { useState, useMemo } from 'react';
import type { SegmentAnnotation, TOCEntry } from '../types';
import './SegmentTOC.css';

interface SegmentTOCProps {
  segmentAnnotations: SegmentAnnotation[];
  onClose?: () => void;
}

export const SegmentTOC: React.FC<SegmentTOCProps> = ({
  segmentAnnotations,
  onClose,
}) => {
  const [expandedTitles, setExpandedTitles] = useState<Set<string>>(new Set());

  // Generate TOC entries from segment annotations
  const tocEntries = useMemo((): TOCEntry[] => {
    // Filter segments that have titles
    const titledSegments = segmentAnnotations.filter(segment => segment.title);
    
    if (titledSegments.length === 0) {
      return [];
    }
    
    // Group segments by title, maintaining order and checking for consecutiveness
    const entries: TOCEntry[] = [];
    let currentTitle = '';
    let currentSegments: SegmentAnnotation[] = [];
    
    // Sort segments by their start position to ensure proper order
    const sortedSegments = [...titledSegments].sort((a, b) => a.start - b.start);
    
    for (let i = 0; i < sortedSegments.length; i++) {
      const segment = sortedSegments[i];
      const nextSegment = sortedSegments[i + 1];
      
      if (segment.title === currentTitle) {
        // Check if this segment is consecutive with the previous one
        const lastSegment = currentSegments.at(-1);
        const isConsecutive = lastSegment && lastSegment.end === segment.start;
        
        if (isConsecutive) {
          // Add to current group
          currentSegments.push(segment);
        } else {
          // Break the group - save current and start new
          entries.push({
            title: currentTitle,
            segmentation: [...currentSegments]
          });
          currentSegments = [segment];
        }
      } else {
        // Save previous group if it exists
        if (currentTitle && currentSegments.length > 0) {
          entries.push({
            title: currentTitle,
            segmentation: [...currentSegments]
          });
        }
        
        // Start new group
        currentTitle = segment.title!;
        currentSegments = [segment];
      }
      
      // Handle last segment or when title changes for next segment
      if (i === sortedSegments.length - 1 || 
          (nextSegment && nextSegment.title !== currentTitle)) {
        entries.push({
          title: currentTitle,
          segmentation: [...currentSegments]
        });
        currentSegments = [];
      }
    }
    
    return entries;
  }, [segmentAnnotations]);

  const toggleExpanded = (title: string) => {
    setExpandedTitles(prev => {
      const newSet = new Set(prev);
      if (newSet.has(title)) {
        newSet.delete(title);
      } else {
        newSet.add(title);
      }
      return newSet;
    });
  };

  const expandAll = () => {
    setExpandedTitles(new Set(tocEntries.map(entry => entry.title)));
  };

  const collapseAll = () => {
    setExpandedTitles(new Set());
  };

  return (
    <div className="segment-toc">
      {/* Header */}
      <div className="toc-header">
        <h3 className="toc-title">Table of Contents</h3>
        {onClose && (
          <button
            onClick={onClose}
            className="close-btn"
            title="Close TOC"
          >
            ✕
          </button>
        )}
      </div>

      {/* Controls */}
      {tocEntries.length > 0 && (
        <div className="toc-controls">
          <button onClick={expandAll} className="control-btn">
            Expand All
          </button>
          <button onClick={collapseAll} className="control-btn">
            Collapse All
          </button>
        </div>
      )}

      {/* TOC Content */}
      <div className="toc-content">
        {tocEntries.length === 0 ? (
          <div className="empty-state">
            <p>No titled segments found</p>
            <small>Add titles to segments to see them in the TOC</small>
          </div>
        ) : (
          <div className="toc-entries">
            {tocEntries.map((entry, index) => {
              const isExpanded = expandedTitles.has(entry.title);
              const segmentCount = entry.segmentation.length;
              const totalChars = entry.segmentation.reduce(
                (sum, seg) => sum + (seg.end - seg.start), 
                0
              );

              return (
                <div key={`${entry.title}-${index}`} className="toc-entry">
                  <button
                    className="toc-entry-header"
                    onClick={() => toggleExpanded(entry.title)}
                  >
                    <span className={`expand-icon ${isExpanded ? 'expanded' : ''}`}>
                      ▶
                    </span>
                    <span className="entry-title">{entry.title}</span>
                    <span className="entry-meta">
                      {segmentCount} segment{segmentCount !== 1 ? 's' : ''} 
                      ({totalChars} chars)
                    </span>
                  </button>
                  
                  {isExpanded && (
                    <div className="toc-entry-content">
                      {entry.segmentation.map((segment) => (
                        <div key={segment.id} className="segment-item">
                          <span className="segment-id">{segment.id}</span>
                          <span className="segment-range">
                            {segment.start}-{segment.end}
                          </span>
                          <span className="segment-length">
                            ({segment.end - segment.start} chars)
                          </span>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        )}
      </div>

      {/* Footer Stats */}
      {tocEntries.length > 0 && (
        <div className="toc-footer">
          <div className="toc-stats">
            <span>{tocEntries.length} title group{tocEntries.length !== 1 ? 's' : ''}</span>
            <span>
              {tocEntries.reduce((sum, entry) => sum + entry.segmentation.length, 0)} total segments
            </span>
          </div>
        </div>
      )}
    </div>
  );
};

export default SegmentTOC;
