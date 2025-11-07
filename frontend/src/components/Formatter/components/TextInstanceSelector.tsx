import React, { useState, useEffect, useMemo, useRef, useCallback } from 'react';
import { useTexts, useTextInstances, useInstance, useAnnotation } from '../../../hooks/useTextData';
import { applySegmentation } from '../../../lib/annotation';
import type { OpenPechaText, OpenPechaTextInstance, SegmentationAnnotation as APISegmentationAnnotation } from '../../../types/text';
import type { SegmentAnnotation } from '../types';
import './TextInstanceSelector.css';

interface TextInstanceSelectorProps {
  onTextLoad: (data: {
    instanceId: string;
    content: string;
    baseText: string;
    segmentAnnotations: SegmentAnnotation[];
    segmentedText: Array<{segment: SegmentAnnotation, text: string}>;
  }) => void;
}

// Helper function to get display title from title object
const getDisplayTitle = (title: unknown, language?: string): string => {
  if (!title) return '';
  
  if (typeof title === 'string') {
    return title;
  }
  
  if (typeof title === 'object' && title !== null) {
    // For bilingual display, show both English and Tibetan if available
    const titleObj = title as Record<string, string>;
    const en = titleObj.en;
    const bo = titleObj.bo;
    
    if (en && bo) {
      return `${en} / ${bo}`;
    }
    
    // Try to get title in the text's language first
    if (language && titleObj[language]) {
      return titleObj[language];
    }
    
    // Fallback to English if available
    if (en) {
      return en;
    }
    
    // Fallback to Tibetan if available
    if (bo) {
      return bo;
    }
    
    // Get the first available title
    const firstKey = Object.keys(titleObj)[0];
    if (firstKey) {
      return titleObj[firstKey];
    }
  }
  
  return '';
};

export const TextInstanceSelector: React.FC<TextInstanceSelectorProps> = ({
  onTextLoad
}) => {
  const [selectedTextId, setSelectedTextId] = useState<string | null>(null);
  const [selectedInstanceId, setSelectedInstanceId] = useState<string | null>(null);
  const [isProcessing, setIsProcessing] = useState(false);
  const [processingError, setProcessingError] = useState<string | null>(null);
  const [searchQuery, setSearchQuery] = useState<string>('');
  const [showDropdown, setShowDropdown] = useState<boolean>(false);
  const searchRef = useRef<HTMLDivElement>(null);

  // Fetch texts list
  const { data: texts, isLoading: isLoadingTexts, error: textsError } = useTexts({limit:100});
  
  // Fetch instances for selected text
  const { data: instances, isLoading: isLoadingInstances, error: instancesError } = useTextInstances(selectedTextId);
  
  // Fetch selected instance data
  const { data: instanceData, isLoading: isLoadingInstance, error: instanceError } = useInstance(selectedInstanceId);
  
  // Get segmentation annotation ID from instance
  const segmentationAnnotationId = instanceData?.annotations && Array.isArray(instanceData.annotations) 
    ? instanceData.annotations.find((annotation: any) => annotation.type === 'segmentation')?.annotation_id
    : undefined;
  
  // Fetch segmentation annotation if it exists
  const { data: segmentationData, isLoading: isLoadingAnnotation, error: annotationError } = useAnnotation(segmentationAnnotationId || null);

  // Process and load the text when all data is ready
  const processAndLoadText = useCallback(async () => {
    if (!instanceData || !selectedInstanceId) return;

    setIsProcessing(true);
    setProcessingError(null);

    try {
      let content = instanceData.content || '';
      const baseText = content;
      let segmentAnnotations: SegmentAnnotation[] = [];
      
      // Apply segmentation if annotation data exists
      if (segmentationData) {
        try {
          // Handle different annotation data structures
          let annotationArray: APISegmentationAnnotation[] = [];
          
          if (Array.isArray(segmentationData)) {
            annotationArray = segmentationData;
          } else if (segmentationData.annotation && Array.isArray(segmentationData.annotation)) {
            annotationArray = segmentationData.annotation as APISegmentationAnnotation[];
          } else {
            console.warn('Unexpected segmentation data structure:', segmentationData);
          }
          
          if (annotationArray.length > 0) {
            console.log('Processing annotations:', annotationArray);
            console.log('Base text length:', baseText.length);
            
            // Apply segmentation to content
            content = applySegmentation(baseText, annotationArray);
            console.log('Segmented content:', content);
            
            // Convert to formatter-compatible segments
            segmentAnnotations = annotationArray.map((seg: APISegmentationAnnotation, index: number) => ({
              id: seg.id || `seg_${index + 1}`,
              start: seg.span?.start || 0,
              end: seg.span?.end || 0,
            }));
            console.log('Segment annotations:', segmentAnnotations);
          }
        } catch (segError) {
          console.warn('Error applying segmentation:', segError);
          // Continue with unsegmented text
        }
      }

      // Create segmented text array
      const segmentedText = segmentAnnotations.map(segment => ({
        segment,
        text: baseText.slice(segment.start, segment.end)
      }));

      // Load the processed text
      onTextLoad({
        instanceId: selectedInstanceId,
        content,
        baseText,
        segmentAnnotations,
        segmentedText
      });

    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Failed to process text';
      setProcessingError(errorMessage);
      console.error('Error processing text:', error);
    } finally {
      setIsProcessing(false);
    }
  }, [instanceData, segmentationData, selectedInstanceId, onTextLoad]);

  useEffect(() => {
    // Wait for all data to be ready before processing
    // If there's a segmentationAnnotationId, wait for annotation to load
    const isAnnotationReady = segmentationAnnotationId ? !isLoadingAnnotation : true;
    
    if (instanceData && selectedInstanceId && !isProcessing && isAnnotationReady) {
      console.log('All data ready, processing text...', {
        hasSegmentation: !!segmentationAnnotationId,
        annotationLoaded: !!segmentationData,
        isLoadingAnnotation
      });
      processAndLoadText();
    } else if (instanceData && selectedInstanceId && segmentationAnnotationId && isLoadingAnnotation) {
      console.log('Waiting for annotation to load...', {
        segmentationAnnotationId,
        isLoadingAnnotation
      });
    }
  }, [instanceData, segmentationData, selectedInstanceId, isProcessing, processAndLoadText, segmentationAnnotationId, isLoadingAnnotation]);

  const handleTextSelect = (textId: string, textTitle?: string) => {
    setSelectedTextId(textId);
    setSelectedInstanceId(null);
    setProcessingError(null);
    
    // Update search query to show selected text title and hide dropdown
    if (textTitle) {
      setSearchQuery(textTitle);
    }
    setShowDropdown(false);
  };

  const handleSearchChange = (value: string) => {
    setSearchQuery(value);
    setShowDropdown(value.length > 0); // Show dropdown when user types
    
    // Clear selection if user is typing a new search
    if (selectedTextId && value !== getSelectedTextTitle()) {
      setSelectedTextId(null);
      setSelectedInstanceId(null);
    }
  };

  const getSelectedTextTitle = () => {
    if (!selectedTextId || !texts) return '';
    const selectedText = texts.find((text: OpenPechaText) => text.id === selectedTextId);
    return selectedText ? getDisplayTitle(selectedText.title, selectedText.language) || selectedText.id : '';
  };

  const handleInstanceSelect = (instanceId: string) => {
    setSelectedInstanceId(instanceId);
    setProcessingError(null);
  };

  // Filter texts based on search query
  const filteredTexts = useMemo(() => {
    if (!texts || !searchQuery.trim()) {
      return texts || [];
    }
    
    const query = searchQuery.toLowerCase();
    return texts.filter((text: OpenPechaText) => {
      const displayTitle = getDisplayTitle(text.title, text.language) || text.id;
      return displayTitle.toLowerCase().includes(query) ||
             text.id.toLowerCase().includes(query) ||
             (text.language && text.language.toLowerCase().includes(query)) ||
             (text.type && text.type.toLowerCase().includes(query));
    });
  }, [texts, searchQuery]);

  // Handle click outside to close dropdown
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (searchRef.current && !searchRef.current.contains(event.target as Node)) {
        setShowDropdown(false);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, []);

  const isLoading = isLoadingTexts || isLoadingInstances || isLoadingInstance || isLoadingAnnotation || isProcessing;
  const error = textsError || instancesError || instanceError || annotationError || processingError;

  return (
    <div className="h-full flex flex-col bg-gray-50 border border-gray-200">
      {/* Header */}
      <div className="p-4 border-b border-gray-200 bg-white">
        <h3 className="text-lg font-medium text-gray-900">
          Select Text & Instance
        </h3>
        <p className="text-sm text-gray-600 mt-1">
          Choose a text and instance to begin formatting with automatic segmentation
        </p>
      </div>

      {/* Content */}
      <div className="flex-1 p-4 space-y-4">
        {/* Error Display */}
        {error && (
          <div className="p-3 bg-red-50 border border-red-200 rounded-md">
            <p className="text-sm text-red-600">
              Error: {error instanceof Error ? error.message : String(error)}
            </p>
          </div>
        )}

        {/* Step 1: Text Selection with Live Search */}
        <div className="space-y-2">
          <label htmlFor="text-search" className="block text-sm font-medium text-gray-700">
            Step 1: Select Text
          </label>
          
          {/* Search Input with Dropdown */}
          <div className="relative" ref={searchRef}>
            <input
              id="text-search"
              type="text"
              placeholder="Type to search texts by title, ID, language, or type..."
              value={searchQuery}
              onChange={(e) => handleSearchChange(e.target.value)}
              onFocus={() => searchQuery.length > 0 && setShowDropdown(true)}
              className="w-full px-3 py-2 pl-10 pr-10 border border-gray-300 rounded-md text-sm bg-white focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
            />
            <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
              <svg className="h-4 w-4 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
              </svg>
            </div>
            {searchQuery && (
              <button
                onClick={() => {
                  setSearchQuery('');
                  setShowDropdown(false);
                  setSelectedTextId(null);
                  setSelectedInstanceId(null);
                }}
                className="absolute inset-y-0 right-0 pr-3 flex items-center text-gray-400 hover:text-gray-600"
                title="Clear search"
              >
                <svg className="h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            )}

            {/* Live Search Results Dropdown */}
            {showDropdown && (
              <div className="absolute z-10 w-full mt-1 bg-white border border-gray-300 rounded-md shadow-lg max-h-60 overflow-y-auto">
                {isLoadingTexts ? (
                  <div className="px-3 py-2 text-sm text-gray-500">Loading texts...</div>
                ) : textsError ? (
                  <div className="px-3 py-2 text-sm text-red-600">Error loading texts</div>
                ) : filteredTexts.length === 0 ? (
                  <div className="px-3 py-2 text-sm text-gray-500">No texts match your search</div>
                ) : (
                  filteredTexts.map((text: OpenPechaText) => {
                    const displayTitle = getDisplayTitle(text.title, text.language) || text.id;
                    return (
                      <button
                        key={text.id}
                        onClick={() => handleTextSelect(text.id, displayTitle)}
                        className="w-full px-3 py-2 text-left text-sm hover:bg-blue-50 focus:bg-blue-50 focus:outline-none border-b border-gray-100 last:border-b-0"
                      >
                        <div className="font-medium text-gray-900">{displayTitle}</div>
                        <div className="text-xs text-gray-500 flex gap-2">
                          <span>ID: {text.id}</span>
                          {text.language && <span>Lang: {text.language}</span>}
                          {text.type && <span>Type: {text.type}</span>}
                        </div>
                      </button>
                    );
                  })
                )}
              </div>
            )}
          </div>

          {/* Selected Text Info */}
          {selectedTextId && (
            <div className="p-2 bg-green-50 border border-green-200 rounded-md">
              <p className="text-sm text-green-800">
                ✓ Selected: <span className="font-medium">{getSelectedTextTitle()}</span>
              </p>
            </div>
          )}

          {/* Search Results Info */}
          {searchQuery && showDropdown && (
            <p className="text-xs text-gray-500">
              {filteredTexts.length} of {texts?.length || 0} texts match "{searchQuery}"
            </p>
          )}

          {textsError && (
            <p className="text-sm text-red-600">
              Failed to load available texts: {textsError.message}
            </p>
          )}
        </div>

        {/* Step 2: Instance Selection Dropdown */}
        {selectedTextId && (
          <div className="space-y-2">
            <label htmlFor="instance-select" className="block text-sm font-medium text-gray-700">
              Step 2: Select Instance
            </label>
            <div className="flex gap-2 items-center">
              <select
                id="instance-select"
                value={selectedInstanceId || ''}
                onChange={(e) => handleInstanceSelect(e.target.value)}
                disabled={isLoadingInstances || isLoading}
                className="flex-1 px-3 py-2 border border-gray-300 rounded-md text-sm bg-white disabled:opacity-50 disabled:cursor-not-allowed focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
              >
                <option value="">
                  {(() => {
                    if (isLoadingInstances) return 'Loading instances...';
                    if (instancesError) return 'Error loading instances';
                    if (instances && instances.length === 0) return 'No instances found';
                    return 'Choose an instance...';
                  })()}
                </option>
                {instances && instances.map((instance: OpenPechaTextInstance) => {
                  const hasSegmentation = instance.annotations && typeof instance.annotations === 'object' && 
                    Object.values(instance.annotations).some(annotationArray => 
                      Array.isArray(annotationArray) && 
                      annotationArray.some((ann: any) => ann.type === 'segmentation')
                    );
                  
                  return (
                    <option key={instance.id} value={instance.id}>
                      {instance.type || 'Instance'} - {instance.id}
                      {hasSegmentation ? ' (with segmentation)' : ''}
                    </option>
                  );
                })}
              </select>
              {isLoading && (
                <div className="flex items-center px-2">
                  <svg className="animate-spin h-4 w-4 text-blue-500" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                  </svg>
                </div>
              )}
            </div>
            {instancesError && (
              <p className="text-sm text-red-600">
                Failed to load available instances: {instancesError.message}
              </p>
            )}
          </div>
        )}

        {/* Step 3: Processing Status */}
        {selectedInstanceId && instanceData && (
          <div className="space-y-2">
            <label className="block text-sm font-medium text-gray-700">
              Step 3: Processing Status
            </label>
            <div className="p-3 bg-blue-50 border border-blue-200 rounded-md space-y-2">
              <div className="flex justify-between text-sm">
                <span className="text-gray-600">Instance:</span>
                <span className="font-mono text-gray-900">{selectedInstanceId}</span>
              </div>
              <div className="flex justify-between text-sm">
                <span className="text-gray-600">Content:</span>
                <span className="text-gray-900">{instanceData.content?.length || 0} characters</span>
              </div>
              <div className="flex justify-between text-sm">
                <span className="text-gray-600">Segmentation:</span>
                <span className="text-gray-900">
                  {segmentationAnnotationId ? (
                    isLoadingAnnotation ? (
                      <span className="flex items-center gap-1">
                        Loading...
                        <svg className="animate-spin h-3 w-3 text-blue-500" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                          <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                          <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                        </svg>
                      </span>
                    ) : 'Loaded'
                  ) : 'Not available'}
                </span>
              </div>
              {segmentationData && !isLoadingAnnotation && (
                <>
                  {Array.isArray(segmentationData) && (
                    <div className="flex justify-between text-sm">
                      <span className="text-gray-600">Segments:</span>
                      <span className="text-gray-900">{segmentationData.length} segments</span>
                    </div>
                  )}
                  {segmentationData.annotation && Array.isArray(segmentationData.annotation) && (
                    <div className="flex justify-between text-sm">
                      <span className="text-gray-600">Segments:</span>
                      <span className="text-gray-900">{segmentationData.annotation.length} segments</span>
                    </div>
                  )}
                </>
              )}
              {isProcessing && (
                <div className="flex items-center justify-center gap-2 text-sm text-blue-600 pt-2 border-t border-blue-200">
                  <svg className="animate-spin h-4 w-4" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                  </svg>
                  Processing text with annotations...
                </div>
              )}
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default TextInstanceSelector;
