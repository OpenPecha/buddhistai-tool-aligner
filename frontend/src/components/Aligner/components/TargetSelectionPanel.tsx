import React from 'react';
import { useTextSelectionStore } from '../../../stores/textSelectionStore';
import { useRelatedInstances } from '../hooks/useRelatedInstances';
import { RotateCcw, Upload } from 'lucide-react';
import { useSearchParams } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import { fetchAnnotation, fetchInstance } from '../../../api/text';
import { applySegmentation } from '../../../lib/annotation';
import LoadingOverlay from './LoadingOverlay';

// Interface for the API response structure
interface RelatedInstanceResponse {
  instance_id: string;
  metadata: {
    instance_type: string;
    copyright: string;
    text_id: string;
    title: Record<string, string>;
    alt_titles: Array<Record<string, string>>;
    language: string;
    contributions: Array<{
      person_id: string;
      role: string;
    }>;
  };
  annotation: string;
  relationship: string;
}

// Interface for alignment annotation response
interface AlignmentAnnotationData {
  alignment_annotation: Array<{
    id: string;
    span: {
      start: number;
      end: number;
    };
    index: number;
    alignment_index: number[];
  }>;
  target_annotation: Array<{
    id: string;
    span: {
      start: number;
      end: number;
    };
    index: number;
  }>;
}

interface AlignmentAnnotationResponse {
  id: string;
  type: string;
  data: AlignmentAnnotationData;
}

function TargetSelectionPanel() {
  const {
    sourceInstanceId,
    sourceTextId,
    targetInstanceId,
    setSourceText,
    setTargetText,
    setTargetType,
    setTargetTextFromUpload,
    isLoadingAnnotations,
    loadingMessage,
    setLoadingAnnotations,
    setAnnotationsApplied
  } = useTextSelectionStore();
  
  const [selectedInstanceId, setSelectedInstanceId] = React.useState<string | null>(targetInstanceId || null);
  const [selectedAnnotationId, setSelectedAnnotationId] = React.useState<string | null>(null);
  const [panelMode, setPanelMode] = React.useState<'related' | 'empty'>('related');
  
  const [searchParams, setSearchParams] = useSearchParams();

  // Helper function to determine target type from metadata
  const determineTargetType = React.useCallback((instanceData: any): 'translation' | 'commentary' | null => {
    if (!instanceData) return null;
    
    // Check for metadata in related instance format
    if (instanceData.metadata) {
      const instanceType = instanceData.metadata.instance_type?.toLowerCase() || '';
      const relationship = instanceData.metadata.relationship?.toLowerCase() || instanceData.relationship?.toLowerCase() || '';
      
      // Check for commentary indicators
      if (instanceType.includes('commentary') || relationship.includes('commentary')) {
        return 'commentary';
      }
      
      // Check for translation indicators
      if (instanceType.includes('translation') || relationship.includes('translation')) {
        return 'translation';
      }
    }
    
    // Check for direct instance type field
    const instanceType = instanceData.instance_type?.toLowerCase() || instanceData.type?.toLowerCase() || '';
    if (instanceType.includes('commentary')) {
      return 'commentary';
    }
    if (instanceType.includes('translation')) {
      return 'translation';
    }
    
    // Default to translation for database texts
    return 'translation';
  }, []);

  const handleChangeSearchParams = React.useCallback((updates: Record<string, string>) => {
    setSearchParams((prev) => {
      for (const [key, value] of Object.entries(updates)) {
        prev.set(key, value);
      }
      // If switching to empty mode, clear target instance related params
      if (updates.state === 'empty') {
        prev.delete('tInstanceId');
        prev.set('tTextId', 'empty-target');
      }
      // If switching to related mode, clear empty state
      if (updates.state === 'related') {
        // Keep existing tTextId and tInstanceId if they exist
      }
      return prev;
    });
  }, [setSearchParams]);
  
  // React Query hooks - Disabled automatic instance fetching
  // const { data: instanceData, isLoading: isLoadingInstance, error: instanceError } = useInstance(selectedInstanceId);
  
  // Get related instances based on source selection
  const { data: relatedInstances = [], isLoading: isLoadingRelatedInstances, error: relatedInstancesError } = useRelatedInstances(
    sourceInstanceId,
    { enabled: Boolean(sourceInstanceId) }
  );

  // Fetch alignment annotation when annotation ID is available
  const { data: alignmentAnnotation, isLoading: isLoadingAlignment, error: alignmentError } = useQuery({
    queryKey: ['alignmentAnnotation', selectedAnnotationId],
    queryFn: () => fetchAnnotation(selectedAnnotationId!),
    enabled: Boolean(selectedAnnotationId)
  });

  // Fetch source instance content
  const { data: sourceInstanceData, isLoading: isLoadingSourceInstance } = useQuery({
    queryKey: ['sourceInstance', sourceInstanceId],
    queryFn: () => fetchInstance(sourceInstanceId!),
    enabled: Boolean(sourceInstanceId)
  });

  // Fetch source segmentation annotation for empty mode
  const sourceSegmentationAnnotationId = React.useMemo(() => {
    if (!sourceInstanceData) {
      return null;
    }

    if (!sourceInstanceData.annotations) {
      return null;
    }

    if (!Array.isArray(sourceInstanceData.annotations)) {
      return null;
    }

    // Look for segmentation annotation in the source instance
    const segmentationAnnotation = (sourceInstanceData.annotations as Array<{type: string; annotation_id?: string}>).find((annotation) => {
      return annotation.type === 'segmentation';
    });
    
    return segmentationAnnotation?.annotation_id || null;
  }, [sourceInstanceData]);

  const { data: sourceSegmentationData, isLoading: isLoadingSourceSegmentation, error: sourceSegmentationError } = useQuery({
    queryKey: ['sourceSegmentation', sourceSegmentationAnnotationId],
    queryFn: async () => {
      const result = await fetchAnnotation(sourceSegmentationAnnotationId!);
      return result;
    },
    enabled: Boolean(sourceSegmentationAnnotationId)
  });


  // Fetch target instance content (only in related mode)
  const { data: targetInstanceData, isLoading: isLoadingTargetInstance } = useQuery({
    queryKey: ['targetInstance', selectedInstanceId],
    queryFn: () => fetchInstance(selectedInstanceId!),
    enabled: Boolean(selectedInstanceId) && panelMode === 'related'
  });


  // Apply segmentation when alignment annotation and instance data are available (only in related mode)
  React.useEffect(() => {
    if (!alignmentAnnotation || !sourceInstanceData || !targetInstanceData) {
      return;
    }
    if (panelMode !== 'related') return; // Skip in empty mode

    setLoadingAnnotations(true, 'Applying alignment annotations...');
    
    const alignmentData = alignmentAnnotation as unknown as AlignmentAnnotationResponse;
    
    try {
      // Access the nested data structure
      const annotationData = alignmentData.data;
      
      // Validate alignment data structure
      if (!annotationData.target_annotation || !Array.isArray(annotationData.target_annotation)) {
        throw new Error('Invalid target_annotation: expected array but got ' + typeof annotationData.target_annotation);
      }
      
      if (!annotationData.alignment_annotation || !Array.isArray(annotationData.alignment_annotation)) {
        throw new Error('Invalid alignment_annotation: expected array but got ' + typeof annotationData.alignment_annotation);
      }
      
      // Apply target_annotation segmentation to source text (keeping current mapping)
      const sourceContent = sourceInstanceData.content || '';
      const segmentedSourceText = applySegmentation(sourceContent, annotationData.target_annotation);
      
      // Apply alignment_annotation segmentation to target text (keeping current mapping)
      const targetContent = targetInstanceData.content || '';
      const segmentedTargetText = applySegmentation(targetContent, annotationData.alignment_annotation);
      
      // Update the store with segmented texts (preserve original sourceTextId)
      setSourceText(
        sourceTextId || sourceInstanceData.id || 'source-instance',
        sourceInstanceId!,
        segmentedSourceText,
        'database'
      );
      
      setTargetText(
        `related-${selectedInstanceId}`,
        selectedInstanceId!,
        segmentedTargetText,
        'database'
      );
      
      // Determine and set target type based on metadata
      const selectedInstance = relatedInstances.find(instance => 
        (instance.instance_id || instance.id) === selectedInstanceId
      );
      const targetType = determineTargetType(selectedInstance);
      setTargetType(targetType);
      
      // Update URL parameters for target selection
      handleChangeSearchParams({
        tTextId: `related-${selectedInstanceId}`,
        tInstanceId: selectedInstanceId!
      });
      
      // Mark annotations as applied
      setAnnotationsApplied(true);
      
    } catch {
      setLoadingAnnotations(false);
    }
  }, [alignmentAnnotation, sourceInstanceData, targetInstanceData, sourceInstanceId, sourceTextId, selectedInstanceId, setSourceText, setTargetText, setTargetType, handleChangeSearchParams, panelMode, relatedInstances, determineTargetType, setLoadingAnnotations, setAnnotationsApplied]);
  
  // Load source text without segmentation when no target is selected or in empty mode
  React.useEffect(() => {
    if (!sourceInstanceData || !sourceInstanceId) return;
    
    // Only load source text without segmentation if:
    // 1. We're in empty mode, OR
    // 2. No target is selected (no alignment annotations will be applied)
    const shouldLoadPlainSource = panelMode === 'empty' || !selectedInstanceId;
    
    if (shouldLoadPlainSource) {
      const sourceContent = sourceInstanceData.content || '';
      setSourceText(
        sourceTextId || sourceInstanceData.id || 'source-instance',
        sourceInstanceId,
        sourceContent, // No segmentation applied
        'database'
      );
    }
  }, [sourceInstanceData, sourceInstanceId, sourceTextId, panelMode, selectedInstanceId, setSourceText]);
  
  
  // Available instances are the related instances
  const availableInstances = React.useMemo(() => {
    return Array.isArray(relatedInstances) ? relatedInstances : [];
  }, [relatedInstances]);

  // Sync local state with store state
  React.useEffect(() => {
    setSelectedInstanceId(targetInstanceId || null);
  }, [targetInstanceId]);

  // Sync panel mode with URL parameters
  React.useEffect(() => {
    const stateParam = searchParams.get('state');
    if (stateParam === 'empty') {
      setPanelMode('empty');
    } else {
      setPanelMode('related');
    }
  }, [searchParams]);

  // Validation function for segmentation data
  const validateSegmentationData = React.useCallback((data: unknown): data is Array<{span: {start: number, end: number}}> => {
    if (!Array.isArray(data)) {
      return false;
    }

    for (const segment of data) {
      if (!segment || typeof segment !== 'object') {
        return false;
      }

      const segmentObj = segment as {span?: {start?: unknown, end?: unknown}};
      if (!segmentObj.span || typeof segmentObj.span !== 'object') {
        return false;
      }

      if (typeof segmentObj.span.start !== 'number' || typeof segmentObj.span.end !== 'number') {
        return false;
      }

      if (segmentObj.span.start < 0 || segmentObj.span.end < segmentObj.span.start) {
        return false;
      }
    }

    return true;
  }, []);

  // Handle file upload
  const handleFileUpload = React.useCallback((event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    setLoadingAnnotations(true, 'Processing uploaded file and applying segmentation...');

    const reader = new FileReader();
    reader.onload = (e) => {
      const content = e.target?.result as string;
      if (content) {
        // Set the uploaded file as target text
        setTargetTextFromUpload(content);
        
        // Apply segmentation to source text (same as empty mode)
        if (sourceInstanceData && sourceInstanceId) {
          const sourceContent = sourceInstanceData.content || '';
          
          // Apply segmentation if available
          if (sourceSegmentationData && validateSegmentationData(sourceSegmentationData)) {
            try {
              const segmentedSourceText = applySegmentation(sourceContent, sourceSegmentationData);
              setSourceText(
                sourceInstanceData.id || 'source-instance',
                sourceInstanceId,
                segmentedSourceText,
                'database'
              );
            } catch {
              setSourceText(
                sourceInstanceData.id || 'source-instance',
                sourceInstanceId,
                sourceContent,
                'database'
              );
            }
          } else {
            setSourceText(
              sourceInstanceData.id || 'source-instance',
              sourceInstanceId,
              sourceContent,
              'database'
            );
          }
        }

        // Update URL parameters
        handleChangeSearchParams({
          state: 'upload',
          tTextId: 'uploaded-file',
          tInstanceId: 'uploaded-instance'
        });

        setAnnotationsApplied(true);
      }
    };
    
    reader.onerror = () => {
      setLoadingAnnotations(false);
    };
    
    reader.readAsText(file);
    
    // Clear the input so the same file can be selected again
    event.target.value = '';
  }, [sourceInstanceData, sourceInstanceId, sourceSegmentationData, setTargetTextFromUpload, setSourceText, handleChangeSearchParams, validateSegmentationData, setLoadingAnnotations, setAnnotationsApplied]);

  // Handle start empty functionality
  const handleStartEmpty = React.useCallback(() => {
    setLoadingAnnotations(true, 'Applying source segmentation...');

    // Check if source instance data is available
    if (!sourceInstanceData) {
      return;
    }

    // Check if source instance is still loading
    if (isLoadingSourceInstance) {
      return;
    }

    // Check if we have a segmentation annotation ID
    if (sourceSegmentationAnnotationId) {
      // If we have an annotation ID, wait for the segmentation data to load
      if (isLoadingSourceSegmentation) {
        return;
      }

      // Check for segmentation fetch errors
      if (sourceSegmentationError) {
        // Continue without segmentation as fallback
      }
    }

    try {
      const sourceContent = sourceInstanceData.content || '';
      let segmentedSourceText = sourceContent;

      // Apply source segmentation if available
      let segmentationArray = null;
      
      // Handle different possible response formats
      if (sourceSegmentationData) {
        if (Array.isArray(sourceSegmentationData)) {
          // Direct array format
          segmentationArray = sourceSegmentationData;
        } else if (typeof sourceSegmentationData === 'object') {
          // Check for common annotation response structures
          const data = sourceSegmentationData as {annotation?: unknown[], annotations?: unknown[], segments?: unknown[], segmentation?: unknown[], data?: unknown[]};
          
          // Try different possible property names
          if (Array.isArray(data.annotation)) {
            segmentationArray = data.annotation;
          } else if (Array.isArray(data.annotations)) {
            segmentationArray = data.annotations;
          } else if (Array.isArray(data.segments)) {
            segmentationArray = data.segments;
          } else if (Array.isArray(data.segmentation)) {
            segmentationArray = data.segmentation;
          } else if (Array.isArray(data.data)) {
            segmentationArray = data.data;
          }
        }
      }
      
      if (segmentationArray && validateSegmentationData(segmentationArray)) {
        try {
          segmentedSourceText = applySegmentation(sourceContent, segmentationArray);
        } catch {
          segmentedSourceText = sourceContent; // Fallback to original text
        }
      }

      // Update source text with segmentation (preserve original sourceTextId)
      setSourceText(
        sourceTextId || sourceInstanceData.id || 'source-instance',
        sourceInstanceId!,
        segmentedSourceText,
        'database'
      );

      // Set empty target text
      setTargetText(
        'empty-target',
        'empty-instance',
        '', // Empty content
        'database'
      );
      
      // Clear target type for empty target (user will select manually)
      setTargetType(null);

      // Update URL parameters
      handleChangeSearchParams({
        state: 'empty',
        tTextId: 'empty-target',
        tInstanceId: 'empty-instance'
      });

      // Mark annotations as applied
      setAnnotationsApplied(true);

    } catch {
      setLoadingAnnotations(false);
    }
  }, [sourceInstanceData, sourceSegmentationData, sourceInstanceId, sourceTextId, setSourceText, setTargetText, setTargetType, handleChangeSearchParams, isLoadingSourceSegmentation, isLoadingSourceInstance, sourceSegmentationAnnotationId, sourceSegmentationError, validateSegmentationData, setLoadingAnnotations, setAnnotationsApplied]);

  // Handle instance selection from dropdown
  const handleInstanceSelection = React.useCallback((instanceId: string) => {
    if (!instanceId) {
      setSelectedInstanceId(null);
      setSelectedAnnotationId(null);
      return;
    }
    
    // Find the selected instance from the related instances
    const selectedInstance = relatedInstances.find(instance => 
      (instance.instance_id || instance.id) === instanceId
    );
    
    if (selectedInstance) {
      // Get the annotation ID from the response data
      const annotationId = (selectedInstance as RelatedInstanceResponse).annotation || 
                          selectedInstance.annotations?.[0]?.annotation_id;
      // Set the annotation ID which will trigger the React Query to fetch alignment annotation
      setSelectedAnnotationId(annotationId || null);
    }
    
    setSelectedInstanceId(instanceId);
    
    // Immediately update URL parameters to show selection
    handleChangeSearchParams({
      tTextId: `related-${instanceId}`,
      tInstanceId: instanceId
    });
  }, [relatedInstances, handleChangeSearchParams]);


  // Handle reset - clear target selection
  const handleReset = React.useCallback(() => {
    const { clearTargetSelection } = useTextSelectionStore.getState();
    clearTargetSelection();
    
    // Also clear local state
    setSelectedInstanceId(null);
    setSelectedAnnotationId(null);
    
    // Clear URL parameters for target
    setSearchParams((prev) => {
      prev.delete('tTextId');
      prev.delete('tInstanceId');
      return prev;
    });
  }, [setSearchParams]);

  return (
    <div className="h-full flex flex-col bg-gray-50 border border-gray-200">
      {/* Header */}
      <div className="p-4 border-b border-gray-200 bg-white">
        <div className="flex items-center justify-between">
          <div>
            <h3 className="text-lg font-medium text-gray-900">
              Target Text
            </h3>
            <p className="text-sm text-gray-600 mt-1">
              {(() => {
                if (!sourceInstanceId) {
                  return 'Please select a source text first to see related target instances';
                } else if (sourceInstanceId && !targetInstanceId) {
                  return 'Select from related instances based on your source text';
                } else {
                  return 'Target text selected from related instances';
                }
              })()}
            </p>
          </div>
          {/* Reset button - show when there is a target selection */}
          {targetInstanceId && (
            <button 
              title="Reset target text selection" 
              onClick={handleReset} 
              className='cursor-pointer flex gap-2 items-center px-3 py-2 text-sm rounded transition-colors hover:bg-red-50 text-red-600 border border-red-200 hover:border-red-300'
            >
              <RotateCcw className="w-4 h-4" />
              <span className="hidden sm:inline">Reset</span>
            </button>
          )}
        </div>
      </div>

      {/* Content */}
      <div className="flex-1 p-4 space-y-4">
        {/* Mode Selection Tabs */}
        {sourceInstanceId && (
          <div className="border-b border-gray-200">
            <nav className="-mb-px flex space-x-8">
              <button
                onClick={() => {
                  setPanelMode('related');
                  handleChangeSearchParams({ state: 'related' });
                }}
                className={`py-2 px-1 border-b-2 font-medium text-sm ${
                  panelMode === 'related'
                    ? 'border-blue-500 text-blue-600'
                    : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                }`}
              >
                Related Instances
              </button>
              <button
                onClick={() => {
                  setPanelMode('empty');
                  handleChangeSearchParams({ state: 'empty' });
                }}
                className={`py-2 px-1 border-b-2 font-medium text-sm ${
                  panelMode === 'empty'
                    ? 'border-blue-500 text-blue-600'
                    : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                }`}
              >
                Start Empty
              </button>
            </nav>
          </div>
        )}

        {/* Related Target Instances Selection */}
        {sourceInstanceId && panelMode === 'related' ? (
          <div className="space-y-2">
            <label htmlFor="target-instance-select" className="block text-sm font-medium text-gray-700">
              Related Target Instances
            </label>
            <select
              id="target-instance-select"
              value={selectedInstanceId || ""}
              onChange={(e) => handleInstanceSelection(e.target.value)}
              disabled={isLoadingRelatedInstances}
              className="w-full px-3 py-2 border border-gray-300 rounded-md text-sm bg-white disabled:opacity-50 disabled:cursor-not-allowed focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
            >
              <option value="">
                {(() => {
                  if (isLoadingRelatedInstances) return 'Loading related instances...';
                  if (relatedInstancesError) return 'Error loading related instances';
                  if (availableInstances?.length === 0) return 'No related instances found';
                  return 'Choose a related instance...';
                })()}
              </option>
              {availableInstances.map((instance) => {
                if (!instance) return null;
                
                // Handle both API response formats
                const instanceId = instance.instance_id || instance.id;
                const isNewFormat = 'instance_id' in instance && 'metadata' in instance;
                
                let title: string;
                let instanceType: string;
                let language: string;
                let relationship: string;
                
                if (isNewFormat) {
                  const apiInstance = instance as RelatedInstanceResponse;
                  const titleObj = apiInstance.metadata.title;
                  const firstTitleKey = titleObj ? Object.keys(titleObj)[0] : undefined;
                  title = (firstTitleKey && titleObj[firstTitleKey]) || `Instance ${instanceId}`;
                  instanceType = apiInstance.metadata.instance_type || 'Instance';
                  language = apiInstance.metadata.language ? ` (${apiInstance.metadata.language})` : '';
                  relationship = apiInstance.relationship ? ` [${apiInstance.relationship}]` : '';
                } else {
                  // Fallback to old format
                  const titleObj = instance.incipit_title;
                  const altTitlesObj = instance.alt_incipit_titles;
                  const firstTitleKey = titleObj ? Object.keys(titleObj)[0] : undefined;
                  const firstAltTitleKey = altTitlesObj ? Object.keys(altTitlesObj)[0] : undefined;
                  
                  title = (firstTitleKey && titleObj?.[firstTitleKey]) || 
                         (firstAltTitleKey && altTitlesObj?.[firstAltTitleKey]) || 
                         `Instance ${instanceId}`;
                  instanceType = instance.type || 'Instance';
                  language = '';
                  relationship = '';
                }

                return (
                  <option key={instanceId} value={instanceId}>
                    {instanceType} - {title}{language}{relationship}
                  </option>
                );
              })}
            </select>
            {relatedInstancesError && (
              <p className="text-sm text-red-600">
                Failed to load related instances: {relatedInstancesError.message}
              </p>
            )}
            {/* Loading indicators */}
            {(isLoadingAlignment || isLoadingSourceInstance || isLoadingTargetInstance) && selectedAnnotationId && (
              <div className="space-y-2">
                {isLoadingAlignment && (
                  <div className="flex items-center space-x-2 text-sm text-blue-600">
                    <svg className="animate-spin h-4 w-4 text-blue-500" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                      <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                      <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                    </svg>
                    <span>Fetching alignment annotation...</span>
                  </div>
                )}
                {isLoadingSourceInstance && (
                  <div className="flex items-center space-x-2 text-sm text-blue-600">
                    <svg className="animate-spin h-4 w-4 text-blue-500" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                      <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                      <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                    </svg>
                    <span>Fetching source text content...</span>
                  </div>
                )}
                {isLoadingTargetInstance && (
                  <div className="flex items-center space-x-2 text-sm text-blue-600">
                    <svg className="animate-spin h-4 w-4 text-blue-500" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                      <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                      <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                    </svg>
                    <span>Fetching target text content...</span>
                  </div>
                )}
              </div>
            )}
            {alignmentError && (
              <p className="text-sm text-red-600">
                Failed to load alignment annotation: {alignmentError.message}
              </p>
            )}
          </div>
        ) : sourceInstanceId && panelMode === 'empty' ? (
          /* Start Empty Mode */
          <div className="space-y-4">
            {/* Start Empty Option */}
            <div className="p-6 bg-blue-50 border border-blue-200 rounded-lg">
              <div className="flex items-start space-x-3">
                <svg className="w-6 h-6 text-blue-600 mt-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6v6m0 0v6m0-6h6m-6 0H6" />
                </svg>
                <div className="flex-1">
                  <h4 className="text-lg font-medium text-blue-900 mb-2">Start with Empty Target</h4>
                  <p className="text-sm text-blue-700 mb-4">
                    This will apply segmentation to your source text and open an empty target editor for manual translation or alignment.
                  </p>
                  <button
                    onClick={handleStartEmpty}
                    disabled={isLoadingSourceInstance || isLoadingSourceSegmentation || isLoadingAnnotations}
                    className="px-4 py-2 bg-blue-600 text-white text-sm font-medium rounded-md hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    {isLoadingSourceInstance || isLoadingSourceSegmentation || isLoadingAnnotations ? 'Loading...' : 'Start with Empty Target'}
                  </button>
                </div>
              </div>
            </div>

            {/* Upload File Option */}
            <div className="p-6 bg-green-50 border border-green-200 rounded-lg">
              <div className="flex items-start space-x-3">
                <Upload className="w-6 h-6 text-green-600 mt-1" />
                <div className="flex-1">
                  <h4 className="text-lg font-medium text-green-900 mb-2">Upload Target File</h4>
                  <p className="text-sm text-green-700 mb-4">
                    Upload a text file to use as your target text. Segmentation will be applied to the source text for alignment.
                  </p>
                  <div className="flex items-center space-x-3">
                    <input
                      type="file"
                      accept=".txt,.md"
                      onChange={handleFileUpload}
                      disabled={isLoadingSourceInstance || isLoadingSourceSegmentation || isLoadingAnnotations}
                      className="hidden"
                      id="file-upload"
                    />
                    <label
                      htmlFor="file-upload"
                      className="px-4 py-2 bg-green-600 text-white text-sm font-medium rounded-md hover:bg-green-700 focus:outline-none focus:ring-2 focus:ring-green-500 focus:ring-offset-2 transition-colors cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed"
                    >
                      {isLoadingSourceInstance || isLoadingSourceSegmentation || isLoadingAnnotations ? 'Loading...' : 'Choose File'}
                    </label>
                    <span className="text-sm text-green-600">Supports .txt and .md files</span>
                  </div>
                </div>
              </div>
            </div>
          </div>
        ) : (
          /* Disabled state message when no source is selected */
          <div className="space-y-2">
            <div className="p-4 bg-gray-100 border border-gray-300 rounded-md">
              <div className="flex items-center space-x-2">
                <svg className="w-5 h-5 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L13.732 4c-.77-.833-1.964-.833-2.732 0L4.082 15.5c-.77.833.192 2.5 1.732 2.5z" />
                </svg>
                <p className="text-sm text-gray-600">
                  Please select a source text first to enable target text selection
                </p>
              </div>
            </div>
          </div>
        )}
      </div>

      {/* Loading Overlay */}
      <LoadingOverlay 
        isVisible={isLoadingAnnotations} 
        message={loadingMessage || 'Processing annotations...'} 
      />
    </div>
  );
}

export default TargetSelectionPanel;
