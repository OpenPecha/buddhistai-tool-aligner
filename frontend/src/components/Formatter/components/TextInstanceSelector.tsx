import React, { useState, useEffect, useMemo, useRef, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { useTextInstances, useInstance, useAnnotation, useTextTitleSearch } from '../../../hooks/useTextData';
import { applySegmentation } from '../../../lib/annotation';
import type { OpenPechaTextInstance, SegmentationAnnotation as APISegmentationAnnotation } from '../../../types/text';
import type { TextTitleSearchResult } from '../../../api/text';
import type { SegmentAnnotation } from '../types';
import type { BdrcSearchResult } from '../../Aligner/hooks/uesBDRC';
import { useBdrcTextSelection } from '../../Aligner/hooks/useBdrcTextSelection';
import { BdrcSearchPanel } from '../../Aligner/components/BdrcSearchPanel';
import { SelectedTextDisplay } from '../../Aligner/components/SelectedTextDisplay';
import { CATALOGER_URL } from '../../../config';
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
  const navigate = useNavigate();
  const [selectedTextId, setSelectedTextId] = useState<string | null>(null);
  const [selectedInstanceId, setSelectedInstanceId] = useState<string | null>(null);
  const [isProcessing, setIsProcessing] = useState(false);
  const [processingError, setProcessingError] = useState<string | null>(null);
  const [searchQuery, setSearchQuery] = useState<string>('');
  const [showDropdown, setShowDropdown] = useState<boolean>(false);
  const searchRef = useRef<HTMLDivElement>(null);

  // Local text search hook - use bdrcSearchQuery for searching

  // BDRC search and selection hooks
  const {
    bdrcSearchQuery,
    setBdrcSearchQuery,
    selectedBdrcResult,
    showBdrcResults,
    setShowBdrcResults,
    bdrcTextNotFound,
    isCheckingBdrcText,
    fetchedTexts,
    handleBdrcResultSelect: handleBdrcResultSelectBase,
    handleResetBdrcSelection: handleResetBdrcSelectionBase,
    hasSelectedText,
  } = useBdrcTextSelection();

  const { results: localTextResults, isLoading: isLoadingLocalTexts, error: localTextError } = useTextTitleSearch(bdrcSearchQuery, 500);

  // Get text ID from BDRC selection
  const selectedTextIdFromBdrc = useMemo(() => {
    if (!selectedBdrcResult?.workId) return null;
    const text = fetchedTexts.find(t => t.bdrc === selectedBdrcResult.workId);
    return text?.id || null;
  }, [selectedBdrcResult, fetchedTexts]);

  // Use BDRC text ID if available, otherwise use manually selected text ID
  const effectiveTextId = selectedTextIdFromBdrc || selectedTextId;
  
  // Fetch instances for selected text
  const { data: instances, isLoading: isLoadingInstances, error: instancesError } = useTextInstances(effectiveTextId);
  
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
          } else if (segmentationData.data && Array.isArray(segmentationData.data)) {
            // New API format: { id, type, data: [...] }
            annotationArray = segmentationData.data as APISegmentationAnnotation[];
          } else if (segmentationData.annotation && Array.isArray(segmentationData.annotation)) {
            // Legacy format: { annotation: [...] }
            annotationArray = segmentationData.annotation as APISegmentationAnnotation[];
          } else {
            console.warn('Unexpected segmentation data structure:', segmentationData);
          }
          
          if (annotationArray.length > 0) {
            
            // Apply segmentation to content
            content = applySegmentation(baseText, annotationArray);
            
            // Convert to formatter-compatible segments
            segmentAnnotations = annotationArray.map((seg: APISegmentationAnnotation, index: number) => ({
              id: seg.id || `seg_${index + 1}`,
              start: seg.span?.start || 0,
              end: seg.span?.end || 0,
            }));
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
      
      processAndLoadText();
    } 
  }, [instanceData, segmentationData, selectedInstanceId, isProcessing, processAndLoadText, segmentationAnnotationId, isLoadingAnnotation]);

  // Handle BDRC result selection
  const handleBdrcResultSelect = useCallback(async (result: BdrcSearchResult) => {
    const textId = await handleBdrcResultSelectBase(result);
    if (textId) {
      setSelectedTextId(textId);
      setSelectedInstanceId(null);
      setProcessingError(null);
      // Clear manual search when BDRC text is selected
      setSearchQuery('');
      setShowDropdown(false);
    }
  }, [handleBdrcResultSelectBase]);

  // Handle resetting BDRC selection
  const handleResetBdrcSelection = useCallback(() => {
    handleResetBdrcSelectionBase();
    setSelectedTextId(null);
    setSelectedInstanceId(null);
    setProcessingError(null);
  }, [handleResetBdrcSelectionBase]);


  const handleCreateTextFromBdrc = React.useCallback(() => {
    if (!selectedBdrcResult?.workId) return;
    const url = `${CATALOGER_URL}/create?w_id=${selectedBdrcResult.workId}&i_id=${selectedBdrcResult.instanceId}`;
    window.open(url, "_blank");
  }, [selectedBdrcResult]);


  const handleTextSelect = (textId: string, textTitle?: string) => {
    setSelectedTextId(textId);
    setSelectedInstanceId(null);
    setProcessingError(null);
    
    // Reset BDRC selection when manually selecting text
    if (selectedBdrcResult) {
      handleResetBdrcSelection();
    }
    
    // Update search query to show selected text title and hide dropdown
    if (textTitle) {
      setSearchQuery(textTitle);
    }
    setShowDropdown(false);
  };

  // Handle local text selection - use text ID directly without fetching
  const handleLocalTextSelect = useCallback((text: TextTitleSearchResult) => {
    // Use the text_id directly (no fetching needed, unlike BDRC selection)
    setSelectedTextId(text.text_id);
    setSelectedInstanceId(null);
    setProcessingError(null);
    
    // Reset BDRC selection when manually selecting text
    if (selectedBdrcResult) {
      handleResetBdrcSelection();
    }
    
    // Update search query to show selected text title
    setBdrcSearchQuery(text.title);
    setShowBdrcResults(false);
  }, [selectedBdrcResult, handleResetBdrcSelection, setBdrcSearchQuery, setShowBdrcResults]);

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
    if (!selectedTextId) return '';
    return selectedTextId;
  };

  const handleInstanceSelect = (instanceId: string) => {
    if (instanceId) {
      // Navigate to formatter with instance ID
      navigate(`/formatter/${instanceId}`);
    } else {
      setSelectedInstanceId(null);
      setProcessingError(null);
    }
  };


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

  const isLoading = isLoadingInstances || isLoadingInstance || isLoadingAnnotation || isProcessing;
  const error = instancesError || instanceError || annotationError || processingError;

  // Determine what to show
  const shouldShowBdrcSearch = !hasSelectedText && !selectedTextId;
  const shouldShowSelectedBdrcText = hasSelectedText && selectedTextIdFromBdrc;
  const shouldShowManualTextSearch = !hasSelectedText && !selectedTextId;
  const shouldShowInstanceSelector = (hasSelectedText || selectedTextId) && effectiveTextId && !isCheckingBdrcText;

  return (
    <div className="h-full flex flex-col bg-gray-50 w-full">
      {/* Header */}
  

      {/* Content */}
      <div className="flex-1 p-4 space-y-4 overflow-y-auto">
        {/* Error Display */}
        {error && (
          <div className="p-3 bg-red-50 border border-red-200 rounded-md">
            <p className="text-sm text-red-600">
              Error: {error instanceof Error ? error.message : String(error)}
            </p>
          </div>
        )}

        {/* BDRC Search Panel with Local Text Search */}
        <div className="max-w-md">

        {shouldShowBdrcSearch && (
          <BdrcSearchPanel
          bdrcSearchQuery={bdrcSearchQuery}
          setBdrcSearchQuery={setBdrcSearchQuery}
          showBdrcResults={showBdrcResults}
          setShowBdrcResults={setShowBdrcResults}
          bdrcTextNotFound={bdrcTextNotFound}
          isCheckingBdrcText={isCheckingBdrcText}
          selectedBdrcResult={selectedBdrcResult}
          onResultSelect={handleBdrcResultSelect}
          onCreateText={handleCreateTextFromBdrc}
          localTextResults={localTextResults}
          isLoadingLocalTexts={isLoadingLocalTexts}
          localTextError={localTextError}
          onLocalTextSelect={handleLocalTextSelect}
          getDisplayTitle={getDisplayTitle}
          />
        )}
        </div>

        {/* Selected BDRC Text Display */}
        {shouldShowSelectedBdrcText && (
          <SelectedTextDisplay
            selectedBdrcResult={selectedBdrcResult}
            textId={selectedTextIdFromBdrc}
            onReset={handleResetBdrcSelection}
          />
        )}

      

        {/* Step 2: Instance Selection Dropdown */}
        {shouldShowInstanceSelector && (
          <div className="space-y-2">
            <label htmlFor="instance-select" className="block text-sm font-medium text-gray-700">
              Select Instance
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

        {/* Processing Status */}
        {selectedInstanceId && instanceData && (
          <div className="space-y-2">
            <label className="block text-sm font-medium text-gray-700">
              Processing Status
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
                  {segmentationData.data && Array.isArray(segmentationData.data) && (
                    <div className="flex justify-between text-sm">
                      <span className="text-gray-600">Segments:</span>
                      <span className="text-gray-900">{segmentationData.data.length} segments</span>
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
