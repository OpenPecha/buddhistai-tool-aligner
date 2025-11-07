import React, { useState } from 'react';
import { useFormatterWithTextRetrieval, useTextFromInstance } from '../../../hooks/useTextData';
import SegmentedTextDisplay from './SegmentedTextDisplay';
import SegmentTOC from './SegmentTOC';
import './TextInstanceLoader.css';

interface TextInstanceLoaderProps {
  onTextLoad?: (instanceId: string) => void;
}

export const TextInstanceLoader: React.FC<TextInstanceLoaderProps> = ({
  onTextLoad
}) => {
  const [inputInstanceId, setInputInstanceId] = useState('');
  const [showTOC, setShowTOC] = useState(true);

  const {
    instanceId,
    baseText,
    segmentAnnotations,
    segmentedText,
    selectedSegments,
    isLoading,
    error,
    loadFromInstance,
    assignTitleToSegments,
    handleSegmentSelect
  } = useFormatterWithTextRetrieval();

  // Also fetch raw instance data for debugging/info
  const { data: rawInstanceData } = useTextFromInstance(instanceId, {
    applySegmentation: true,
    includeAnnotations: true
  });

  const handleLoadText = () => {
    if (inputInstanceId.trim()) {
      loadFromInstance(inputInstanceId.trim());
      onTextLoad?.(inputInstanceId.trim());
    }
  };

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter') {
      handleLoadText();
    }
  };

  return (
    <div className="text-instance-loader">
      {/* Header with instance loader */}
      <div className="loader-header">
        <h2>Text Instance Loader</h2>
        <div className="instance-input-group">
          <input
            type="text"
            value={inputInstanceId}
            onChange={(e) => setInputInstanceId(e.target.value)}
            onKeyPress={handleKeyPress}
            placeholder="Enter instance ID..."
            className="instance-input"
            disabled={isLoading}
          />
          <button
            onClick={handleLoadText}
            disabled={!inputInstanceId.trim() || isLoading}
            className="load-btn"
          >
            {isLoading ? 'Loading...' : 'Load Text'}
          </button>
        </div>
      </div>

      {/* Error display */}
      {error && (
        <div className="error-banner">
          <strong>Error:</strong> {error instanceof Error ? error.message : String(error)}
        </div>
      )}

      {/* Instance info */}
      {rawInstanceData && (
        <div className="instance-info">
          <h3>Instance Information</h3>
          <div className="info-grid">
            <div className="info-item">
              <label>Instance ID:</label>
              <span>{rawInstanceData.instanceId}</span>
            </div>
            <div className="info-item">
              <label>Has Segmentation:</label>
              <span>{rawInstanceData.hasSegmentation ? 'Yes' : 'No'}</span>
            </div>
            <div className="info-item">
              <label>Content Length:</label>
              <span>{baseText.length} characters</span>
            </div>
            <div className="info-item">
              <label>Segments:</label>
              <span>{segmentAnnotations.length}</span>
            </div>
            <div className="info-item">
              <label>Base Text Length:</label>
              <span>{rawInstanceData.baseText.length} characters</span>
            </div>
            <div className="info-item">
              <label>Processed Content Length:</label>
              <span>{rawInstanceData.content.length} characters</span>
            </div>
          </div>
          
          {rawInstanceData.errors && rawInstanceData.errors.length > 0 && (
            <div className="processing-errors">
              <h4>Processing Warnings:</h4>
              <ul>
                {rawInstanceData.errors.map((error, index) => (
                  <li key={index}>{error}</li>
                ))}
              </ul>
            </div>
          )}
        </div>
      )}

      {/* Main content area */}
      {instanceId && (
        <div className="main-content">
          <div className="content-layout">
            {/* TOC Sidebar */}
            {showTOC && (
              <div className="toc-sidebar">
                <SegmentTOC
                  segmentAnnotations={segmentAnnotations}
                  onClose={() => setShowTOC(false)}
                />
              </div>
            )}

            {/* Show TOC Button - when TOC is hidden */}
            {!showTOC && (
              <button
                onClick={() => setShowTOC(true)}
                className="show-toc-btn"
                title="Show Table of Contents"
              >
                📋
              </button>
            )}

            {/* Text Display */}
            <div className="text-display-area">
              {segmentedText.length > 0 ? (
                <SegmentedTextDisplay
                  segmentedText={segmentedText}
                  selectedSegments={selectedSegments}
                  onSegmentSelect={handleSegmentSelect}
                  onAssignTitle={assignTitleToSegments}
                />
              ) : (
                <div className="no-content">
                  <p>No segmented content available</p>
                  <small>
                    {baseText ? 
                      'Text loaded but no segments found. The instance may not have segmentation annotations.' :
                      'Load an instance to see content here.'
                    }
                  </small>
                </div>
              )}
            </div>
          </div>
        </div>
      )}

      {/* Debug info (only in development) */}
      {typeof process !== 'undefined' && process.env?.NODE_ENV === 'development' && rawInstanceData && (
        <details className="debug-info">
          <summary>Debug Information</summary>
          <pre>{JSON.stringify(rawInstanceData, null, 2)}</pre>
        </details>
      )}
    </div>
  );
};

export default TextInstanceLoader;
