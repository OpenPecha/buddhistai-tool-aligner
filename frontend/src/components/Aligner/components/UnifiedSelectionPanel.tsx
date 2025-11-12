import React from 'react';
import { useTexts, useInstance, useTextInstances } from '../../../hooks/useTextData';
import { useTextSelectionStore } from '../../../stores/textSelectionStore';
import { useRelatedInstances, type RelatedInstance } from '../hooks/useRelatedInstances';
import { PlusCircle, Search, AlertCircle } from 'lucide-react';
import { useSearchParams } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import { fetchAnnotation, fetchInstance, fetchText } from '../../../api/text';
import { applySegmentation, generateFileSegmentation } from '../../../lib/annotation';
import LoadingOverlay from './LoadingOverlay';
import { CATALOGER_URL } from '../../../config';
import { useBdrcSearch, type BdrcSearchResult } from '../hooks/uesBDRC';



function getLanguageFromCode(languageCode: string): string {
  const languageCodes: Record<string, string> = {
    'en': 'English',
    'fr': 'French',
    'de': 'German',
    'it': 'Italian',
    'es': 'Spanish',
    'pt': 'Portuguese',
    'ru': 'Russian',
    'zh': 'Chinese',
    'bo': 'Tibetan',
  };
  const code = languageCode?.trim()?.toLowerCase() || '';
  return languageCodes[code] || languageCode;
}
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


function UnifiedSelectionPanel() {
  const {
    sourceInstanceId,
    sourceTextId,
    targetInstanceId,
    setSourceText,
    setTargetText,
    setTargetType,
    setSourceSelection,
    isLoadingAnnotations,
    loadingMessage,
    setLoadingAnnotations,
    setAnnotationsApplied
  } = useTextSelectionStore();
  
  // Source selection state
  const [selectedTextId, setSelectedTextId] = React.useState<string>(sourceTextId || '');
  const [selectedInstanceId, setSelectedInstanceId] = React.useState<string | null>(sourceInstanceId || null);
  
  // Target selection state
  const [selectedTargetInstanceId, setSelectedTargetInstanceId] = React.useState<string | null>(targetInstanceId || null);
  const [selectedAnnotationId, setSelectedAnnotationId] = React.useState<string | null>(null);
  
  // BDRC search state
  const [bdrcSearchQuery, setBdrcSearchQuery] = React.useState<string>('');
  const [selectedBdrcResult, setSelectedBdrcResult] = React.useState<BdrcSearchResult | null>(null);
  const [showBdrcResults, setShowBdrcResults] = React.useState<boolean>(false);
  const [bdrcTextNotFound, setBdrcTextNotFound] = React.useState<boolean>(false);
  const [isCheckingBdrcText, setIsCheckingBdrcText] = React.useState<boolean>(false);
  
  const [, setSearchParams] = useSearchParams();

  // React Query hooks for source
  const { data: availableTexts = [], isLoading: isLoadingTexts, error: textsError } = useTexts({ limit: 50 });
  const { data: instancesData, isLoading: isLoadingInstances, error: instancesError } = useTextInstances(selectedTextId);
  const { data: instanceData, isLoading: isLoadingInstance, error: instanceError } = useInstance(selectedInstanceId);
  
  // BDRC search hook
  const { results: bdrcResults, isLoading: isLoadingBdrc, error: bdrcError } = useBdrcSearch(
    bdrcSearchQuery,
    "Instance",
    1000
  );

  // React Query hooks for target
  const { data: relatedInstances = [], isLoading: isLoadingRelatedInstances, error: relatedInstancesError } = useRelatedInstances(
    sourceInstanceId,
    { enabled: Boolean(sourceInstanceId) }
  );

  // Fetch alignment annotation when annotation ID is available
  const { data: alignmentAnnotation, isLoading: isLoadingAlignment, error: alignmentError } = useQuery({
    queryKey: ['alignmentAnnotation', selectedAnnotationId],
    queryFn: () => fetchAnnotation(selectedAnnotationId!),
    enabled: Boolean(selectedAnnotationId),
    refetchInterval: false,
    refetchOnWindowFocus: false,
    refetchOnMount: false,
    refetchOnReconnect: false,
    refetchIntervalInBackground: false,
  });

  // Fetch source instance content
  const { data: sourceInstanceData, isLoading: isLoadingSourceInstance } = useQuery({
    queryKey: ['sourceInstance', sourceInstanceId],
    queryFn: () => fetchInstance(sourceInstanceId!),
    enabled: Boolean(sourceInstanceId),
    refetchInterval: false,
    refetchOnWindowFocus: false,
    refetchOnMount: false,
    refetchOnReconnect: false,
    refetchIntervalInBackground: false,
  });

  // Fetch target instance content
  const { data: targetInstanceData, isLoading: isLoadingTargetInstance } = useQuery({
    queryKey: ['targetInstance', selectedTargetInstanceId],
    queryFn: () => fetchInstance(selectedTargetInstanceId!),
    enabled: Boolean(selectedTargetInstanceId),
    refetchInterval: false,
    refetchOnWindowFocus: false,
    refetchOnMount: false,
    refetchOnReconnect: false,
    refetchIntervalInBackground: false,
  });

  // Available instances for source
  const availableInstances = React.useMemo(() => {
    return Array.isArray(instancesData) ? instancesData : [];
  }, [instancesData]);

  // Available instances for target
  const availableTargetInstances = React.useMemo(() => {
    return Array.isArray(relatedInstances) ? relatedInstances : [];
  }, [relatedInstances]);

  // Helper function to determine target type from metadata
  const determineTargetType = React.useCallback((instanceData: RelatedInstanceResponse | RelatedInstance | null): 'translation' | 'commentary' | null => {
    if (!instanceData) return null;
    
    if ('metadata' in instanceData && instanceData.metadata) {
      const instanceType = instanceData.metadata.instance_type?.toLowerCase() || '';
      const relationship = instanceData.relationship?.toLowerCase() || '';
      
      if (instanceType.includes('commentary') || relationship.includes('commentary')) {
        return 'commentary';
      }
      
      if (instanceType.includes('translation') || relationship.includes('translation')) {
        return 'translation';
      }
    }
    
    if ('type' in instanceData && instanceData.type) {
      const instanceType = instanceData.type.toLowerCase();
      if (instanceType.includes('commentary')) {
        return 'commentary';
      }
      if (instanceType.includes('translation')) {
        return 'translation';
      }
    }
    
    return 'translation';
  }, []);

  const handleChangeSearchParams = React.useCallback((updates: Record<string, string>) => {
    setSearchParams((prev) => {
      for (const [key, value] of Object.entries(updates)) {
        prev.set(key, value);
      }
      return prev;
    });
  }, [setSearchParams]);

  // Sync local state with store state
  React.useEffect(() => {
    setSelectedTextId(sourceTextId || '');
    setSelectedInstanceId(sourceInstanceId || null);
    setSelectedTargetInstanceId(targetInstanceId || null);
  }, [sourceTextId, sourceInstanceId, targetInstanceId]);

  // Update source selection in store
  React.useEffect(() => {
    if (!instanceData || !selectedInstanceId || !selectedTextId) return;
    
    try {
      setSourceSelection(selectedTextId, selectedInstanceId);
      handleChangeSearchParams({
        sTextId: selectedTextId,
        sInstanceId: selectedInstanceId
      });
    } catch (error) {
      console.error('Error updating source parameters:', error);
    }
  }, [instanceData, selectedInstanceId, selectedTextId, setSourceSelection, handleChangeSearchParams]);

  // Apply segmentation when alignment annotation and instance data are available
  React.useEffect(() => {
    if (!sourceInstanceData || !targetInstanceData) {
      return;
    }

    setLoadingAnnotations(true, 'Applying alignment annotations...');
    
    try {
      let segmentedSourceText: string;
      let segmentedTargetText: string;
      
      if (alignmentAnnotation) {
        const alignmentData = alignmentAnnotation as unknown as AlignmentAnnotationResponse;
        const annotationData = alignmentData.data;
        
        if (annotationData?.target_annotation && Array.isArray(annotationData.target_annotation) &&
            annotationData?.alignment_annotation && Array.isArray(annotationData.alignment_annotation)) {
          
          const sourceContent = sourceInstanceData.content || '';
          segmentedSourceText = applySegmentation(sourceContent, annotationData.target_annotation);
          
          const targetContent = targetInstanceData.content || '';
          const maxAlignmentIndex = Math.max(
            ...annotationData.target_annotation.map(ann => ann.index),
            ...annotationData.alignment_annotation.flatMap(ann => ann.alignment_index)
          );
          
          const targetSegments = [];
          let currentPos = 0;
          
          for (let i = 0; i <= maxAlignmentIndex; i++) {
            const alignmentForThisIndex = annotationData.alignment_annotation.find(ann => 
              ann.alignment_index.includes(i)
            );
            
            if (alignmentForThisIndex) {
              targetSegments.push({
                span: alignmentForThisIndex.span
              });
              currentPos = alignmentForThisIndex.span.end;
            } else {
              targetSegments.push({
                span: {
                  start: currentPos,
                  end: currentPos
                }
              });
            }
          }
          
          segmentedTargetText = applySegmentation(targetContent, targetSegments);
        } else {
          segmentedSourceText = sourceInstanceData.content || '';
          segmentedTargetText = targetInstanceData.content || '';
        }
      } else {
        const sourceContent = sourceInstanceData.content || '';
        const targetContent = targetInstanceData.content || '';
        
        const sourceSegmentations = generateFileSegmentation(sourceContent);
        segmentedSourceText = applySegmentation(sourceContent, sourceSegmentations);
        
        const targetSegmentations = generateFileSegmentation(targetContent);
        segmentedTargetText = applySegmentation(targetContent, targetSegmentations);
      }
      
      setSourceText(
        sourceTextId || sourceInstanceData.id || 'source-instance',
        sourceInstanceId!,
        segmentedSourceText,
        'database'
      );
      
      setTargetText(
        `related-${selectedTargetInstanceId}`,
        selectedTargetInstanceId!,
        segmentedTargetText,
        'database'
      );
      
      const selectedInstance = relatedInstances.find(instance => 
        (instance.instance_id || instance.id) === selectedTargetInstanceId
      );
      const targetType = determineTargetType(selectedInstance || null);
      setTargetType(targetType);
      
      handleChangeSearchParams({
        tTextId: `related-${selectedTargetInstanceId}`,
        tInstanceId: selectedTargetInstanceId!
      });
      
      setAnnotationsApplied(true);
      
    } catch (error) {
      console.error('Error applying alignment annotations:', error);
      setLoadingAnnotations(false);
      setAnnotationsApplied(true);
    }
  }, [alignmentAnnotation, sourceInstanceData, targetInstanceData, sourceInstanceId, sourceTextId, selectedTargetInstanceId, setSourceText, setTargetText, setTargetType, handleChangeSearchParams, relatedInstances, determineTargetType, setLoadingAnnotations, setAnnotationsApplied]);

  // Handle text selection
  const handleTextSelection = React.useCallback((textId: string) => {
    if (!textId) return;
    setSelectedTextId(textId);
    setSelectedInstanceId(null);
  }, []);

  // Handle instance selection
  const handleInstanceSelection = React.useCallback((instanceId: string) => {
    if (!instanceId || !selectedTextId) return;
    setSelectedInstanceId(instanceId);
  }, [selectedTextId]);

  // Handle action selection
  const handleActionSelection = React.useCallback((action: 'create-translation' | 'create-commentary') => {
    if (!sourceTextId || !sourceInstanceId) {
      console.error('Source text ID and instance ID are required');
      return;
    }
    
    const actionType = action === 'create-translation' ? 'translation' : 'commentary';
    const url = `${CATALOGER_URL}/texts/${sourceTextId}/instances/${sourceInstanceId}/${actionType}`;
    window.open(url, '_blank');
  }, [sourceTextId, sourceInstanceId]);

  // Handle target instance selection
  const handleTargetInstanceSelection = React.useCallback((instanceId: string) => {
    if (!instanceId) {
      setSelectedTargetInstanceId(null);
      setSelectedAnnotationId(null);
      return;
    }
    
    const selectedInstance = relatedInstances.find(instance => 
      (instance.instance_id || instance.id) === instanceId
    );
    
    if (selectedInstance) {
      const annotationId = (selectedInstance as RelatedInstanceResponse).annotation || 
                          selectedInstance.annotations?.[0]?.annotation_id;
      setSelectedAnnotationId(annotationId || null);
    }
    
    setSelectedTargetInstanceId(instanceId);
    
    handleChangeSearchParams({
      tTextId: `related-${instanceId}`,
      tInstanceId: instanceId
    });
  }, [relatedInstances, handleChangeSearchParams]);

  // Handle creating new text
  const handleCreateText = React.useCallback(() => {
    if (!selectedTextId) return;
    const selected = `${CATALOGER_URL}/create?t_Id=${selectedTextId}`;
    window.open(selected, '_blank');
  }, [selectedTextId]);

  // Handle BDRC search result selection
  const handleBdrcResultSelect = React.useCallback(async (result: BdrcSearchResult) => {
    if (!result.workId) return;
    
    setSelectedBdrcResult(result);
    setShowBdrcResults(false);
    setBdrcTextNotFound(false);
    setIsCheckingBdrcText(true);
    
    try {
      // First check in available texts (quick check)
      let matchingText = availableTexts.find(text => text.bdrc === result.workId);
      
      // If not found, try to fetch the text using BDRC ID as text ID
      // (assuming the API might support fetching by BDRC ID)
      if (!matchingText) {
        try {
          const text = await fetchText(result.workId);
          // If fetchText succeeds, check if the BDRC ID matches
          if (text && text.bdrc === result.workId) {
            matchingText = text;
          }
        } catch {
          // fetchText failed, text doesn't exist - this is expected
          // We'll show the create button below
        }
      }
      
      if (matchingText) {
        // Text exists, select it and fetch instances
        setSelectedTextId(matchingText.id);
        setSelectedInstanceId(null);
        setBdrcSearchQuery('');
        setIsCheckingBdrcText(false);
      } else {
        // Text doesn't exist, show message to create on cataloger
        setBdrcTextNotFound(true);
        setIsCheckingBdrcText(false);
      }
    } catch (error) {
      console.error('Error checking BDRC text:', error);
      // On error, show the not found message with create button
      setBdrcTextNotFound(true);
      setIsCheckingBdrcText(false);
    }
  }, [availableTexts]);

  // Handle creating text from BDRC ID
  const handleCreateTextFromBdrc = React.useCallback(() => {
    if (!selectedBdrcResult?.workId) return;
    const url = `${CATALOGER_URL}/create?t_id=${selectedBdrcResult.workId}`;
    window.open(url, '_blank');
  }, [selectedBdrcResult]);

  // Close BDRC results dropdown when clicking outside
  React.useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      const target = event.target as HTMLElement;
      if (!target.closest('#bdrc-search') && !target.closest('.bdrc-results-container')) {
        setShowBdrcResults(false);
      }
    };

    if (showBdrcResults) {
      document.addEventListener('mousedown', handleClickOutside);
      return () => {
        document.removeEventListener('mousedown', handleClickOutside);
      };
    }
  }, [showBdrcResults]);

  return (
    <div className="h-full flex flex-col bg-gray-50">
      {/* Content */}
      <div className="flex-1 p-6 overflow-y-auto">
        <div className="max-w-4xl mx-auto space-y-6">
          {/* BDRC Text Search */}
          <div className="bg-white rounded-lg border border-gray-200 p-6">
            <h3 className="text-lg font-medium text-gray-900 mb-4">
              Search BDRC Text
            </h3>
            
            <div className="space-y-4">
              {/* BDRC Search Input */}
              <div className="space-y-2">
                <label htmlFor="bdrc-search" className="block text-sm font-medium text-gray-700">
                  Search BDRC Text by Title or ID
                </label>
                <div className="relative">
                  <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                    <Search className="h-5 w-5 text-gray-400" />
                  </div>
                  <input
                    id="bdrc-search"
                    type="text"
                    value={bdrcSearchQuery}
                    onChange={(e) => {
                      setBdrcSearchQuery(e.target.value);
                      setShowBdrcResults(true);
                      setBdrcTextNotFound(false);
                    }}
                    placeholder="Search BDRC texts..."
                    className="w-full pl-10 pr-3 py-2 border border-gray-300 rounded-md text-sm bg-white focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                  />
                </div>
                
                {/* BDRC Search Results */}
                {showBdrcResults && bdrcSearchQuery && (
                  <div className="relative bdrc-results-container">
                    {isLoadingBdrc ? (
                      <div className="absolute z-10 w-full mt-1 bg-white border border-gray-300 rounded-md shadow-lg p-4">
                        <div className="flex items-center space-x-2 text-sm text-blue-600">
                          <svg className="animate-spin h-4 w-4 text-blue-500" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                            <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                            <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                          </svg>
                          <span>Searching BDRC...</span>
                        </div>
                      </div>
                    ) : bdrcError ? (
                      <div className="absolute z-10 w-full mt-1 bg-white border border-red-300 rounded-md shadow-lg p-4">
                        <p className="text-sm text-red-600">Error searching BDRC: {bdrcError}</p>
                      </div>
                    ) : bdrcResults.length > 0 ? (
                      <div className="absolute z-10 w-full mt-1 bg-white border border-gray-300 rounded-md shadow-lg max-h-60 overflow-y-auto">
                        {bdrcResults.map((result) => (
                          <button
                            key={result.workId || result.instanceId || `bdrc-${result.prefLabel}`}
                            onClick={() => handleBdrcResultSelect(result)}
                            className="w-full px-4 py-3 text-left hover:bg-gray-50 border-b border-gray-100 last:border-b-0 transition-colors"
                          >
                            <div className="font-medium text-sm text-gray-900">
                              {result.prefLabel || result.workId || 'Untitled'}
                            </div>
                            {result.workId && (
                              <div className="text-xs text-gray-500 mt-1">
                                BDRC ID: {result.workId}
                              </div>
                            )}
                            {result.language && (
                              <div className="text-xs text-gray-500">
                                Language: {getLanguageFromCode(result.language)}
                              </div>
                            )}
                          </button>
                        ))}
                      </div>
                    ) : bdrcSearchQuery.trim() ? (
                      <div className="absolute z-10 w-full mt-1 bg-white border border-gray-300 rounded-md shadow-lg p-4">
                        <p className="text-sm text-gray-600">No BDRC texts found</p>
                      </div>
                    ) : null}
                  </div>
                )}
                
                {/* Checking BDRC Text Status */}
                {isCheckingBdrcText && (
                  <div className="mt-4 p-4 bg-blue-50 border border-blue-200 rounded-md">
                    <div className="flex items-center space-x-2 text-sm text-blue-600">
                      <svg className="animate-spin h-5 w-5 text-blue-500" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                        <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                        <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                      </svg>
                      <span>Checking if text exists in catalog...</span>
                    </div>
                  </div>
                )}

                {/* BDRC Text Not Found Message */}
                {bdrcTextNotFound && selectedBdrcResult && !isCheckingBdrcText && (
                  <div className="mt-4 p-4 bg-yellow-50 border border-yellow-200 rounded-md">
                    <div className="flex items-start">
                      <AlertCircle className="h-5 w-5 text-yellow-600 mt-0.5 mr-3 shrink-0" />
                      <div className="flex-1">
                        <p className="text-sm font-medium text-yellow-800 mb-2">
                          Text not found in catalog
                        </p>
                        <p className="text-sm text-yellow-700 mb-3">
                          The BDRC text "{selectedBdrcResult.prefLabel || selectedBdrcResult.workId}" (ID: {selectedBdrcResult.workId}) is not present in the system. Please create it first using the cataloger.
                        </p>
                        <button
                          onClick={handleCreateTextFromBdrc}
                          className="px-4 py-2 bg-yellow-600 text-white text-sm font-medium rounded-md hover:bg-yellow-700 focus:outline-none focus:ring-2 focus:ring-yellow-500 focus:ring-offset-2 transition-colors"
                        >
                          Create Text on Cataloger
                        </button>
                      </div>
                    </div>
                  </div>
                )}
              </div>
            </div>
          </div>

          {/* Step 1: Source Text Selection */}
          <div className="bg-white rounded-lg border border-gray-200 p-6">
            <h3 className="text-lg font-medium text-gray-900 mb-4">
              Step 1: Select Source Text and Instance
            </h3>
            
            <div className="space-y-4">
              {/* Text Selection */}
              <div className="space-y-2">
                <label htmlFor="source-text-select" className="block text-sm font-medium text-gray-700">
                  Select Source Text
                </label>
                <select
                  id="source-text-select"
                  value={selectedTextId}
                  onChange={(e) => handleTextSelection(e.target.value)}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md text-sm bg-white focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                >
                  <option value="">
                    {(() => {
                      if (isLoadingTexts) return 'Loading texts...';
                      if (textsError) return 'Error loading texts';
                      return 'Choose a text...';
                    })()}
                  </option>
                  {availableTexts.map((text) => (
                    <option key={text.id} value={text.id}>
                      {text.title.bo || text.title.en || text.title[Object.keys(text.title)[0]] || `Text ${text.id}`}
                      {text.language && ` (${text.language})`}
                    </option>
                  ))}
                </select>
                {textsError && (
                  <p className="text-sm text-red-600">
                    Failed to load available texts: {textsError.message}
                  </p>
                )}
              </div>

              {/* Instance Selection */}
              {selectedTextId && (
                <div className="space-y-2">
                  <label htmlFor="source-instance-select" className="block text-sm font-medium text-gray-700">
                    Select Instance
                  </label>
                  <div className="flex gap-2 items-center">
                    <select
                      id="source-instance-select"
                      value={selectedInstanceId || ""}
                      onChange={(e) => handleInstanceSelection(e.target.value)}
                      disabled={isLoadingInstances || isLoadingInstance}
                      className="flex-1 px-3 py-2 border border-gray-300 rounded-md text-sm bg-white disabled:opacity-50 disabled:cursor-not-allowed focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                    >
                      <option value="">
                        {(() => {
                          if (isLoadingInstances) return 'Loading instances...';
                          if (instancesError) return 'Error loading instances';
                          if (availableInstances?.length === 0) return 'No instances found';
                          return 'Choose an instance...';
                        })()}
                      </option>
                      {availableInstances.map((instance) => {
                        if (!instance) return null;
                        const incipitTitle = instance?.incipit_title;
                        const altIncipitTitles = instance?.alt_incipit_titles;
                        const firstIncipitKey = incipitTitle && typeof incipitTitle === 'object' ? Object.keys(incipitTitle)[0] : undefined;
                        const firstAltIncipitKey = altIncipitTitles && typeof altIncipitTitles === 'object' ? Object.keys(altIncipitTitles)[0] : undefined;
                        const title = (firstIncipitKey && incipitTitle && typeof incipitTitle === 'object' && incipitTitle[firstIncipitKey]) || 
                                     (firstAltIncipitKey && altIncipitTitles && typeof altIncipitTitles === 'object' && altIncipitTitles[firstAltIncipitKey]) || 
                                     `Instance ${instance.id}`;

                        return (
                          <option key={instance.id} value={instance.id}>
                            {instance.type || 'Instance'} - {title}
                          </option>
                        );
                      })}
                    </select>
                    {isLoadingInstance ? (
                      <div className="flex items-center px-2">
                        <svg className="animate-spin h-4 w-4 text-blue-500" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                          <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                          <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                        </svg>
                      </div>
                    ) : (
                      <button 
                        title="Create new instance" 
                        onClick={handleCreateText} 
                        className='cursor-pointer flex gap-2 items-center px-3 py-2 text-sm rounded transition-colors hover:bg-gray-100'
                      >
                        <PlusCircle className="w-5 h-5 text-gray-500" /> 
                      </button>
                    )}
                  </div>
                  {instancesError && (
                    <p className="text-sm text-red-600">
                      Failed to load available instances: {instancesError.message}
                    </p>
                  )}
                  {instanceError && (
                    <p className="text-sm text-red-600">Failed to load instance: {instanceError.message}</p>
                  )}
                </div>
              )}
            </div>
          </div>

          {/* Related Instances as Cards */}
          {sourceInstanceId && (
            <div className="bg-white rounded-lg border border-gray-200 p-6">
              <div className="flex items-start justify-between mb-4">
                <div className="flex-1">
                  <h3 className="text-lg font-medium text-gray-900 mb-2">
                    Align with Existing Text
                  </h3>
                  <p className="text-sm text-gray-600">
                    Select a related translation or commentary to align with, or create a new one:
                  </p>
                </div>
                <div className="flex gap-2 ml-4">
                  {/* Create Translation Button */}
                  <button
                    onClick={() => handleActionSelection('create-translation')}
                    className="px-4 py-2 bg-blue-600 text-white text-sm font-medium rounded-md hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 transition-colors flex items-center gap-2"
                  >
                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 5h12M9 3v2m1.048 9.5A18.022 18.022 0 016.412 9m6.088 9h7M11 21l5-10 5 10M12.751 5C11.783 10.77 8.07 15.61 3 18.129" />
                    </svg>
                    <span className="hidden sm:inline">Create Translation</span>
                    <span className="sm:hidden">Translation</span>
                  </button>

                  {/* Create Commentary Button */}
                  <button
                    onClick={() => handleActionSelection('create-commentary')}
                    className="px-4 py-2 bg-green-600 text-white text-sm font-medium rounded-md hover:bg-green-700 focus:outline-none focus:ring-2 focus:ring-green-500 focus:ring-offset-2 transition-colors flex items-center gap-2"
                  >
                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
                    </svg>
                    <span className="hidden sm:inline">Create Commentary</span>
                    <span className="sm:hidden">Commentary</span>
                  </button>
                </div>
              </div>

              {isLoadingRelatedInstances ? (
                <div className="flex items-center justify-center py-8">
                  <div className="flex items-center space-x-2 text-sm text-blue-600">
                    <svg className="animate-spin h-5 w-5 text-blue-500" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                      <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                      <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                    </svg>
                    <span>Loading related instances...</span>
                  </div>
                </div>
              ) : relatedInstancesError ? (
                <div className="p-4 bg-red-50 border border-red-200 rounded-md">
                  <p className="text-sm text-red-600">
                    Failed to load related instances: {relatedInstancesError.message}
                  </p>
                </div>
              ) : availableTargetInstances.length === 0 ? (
                <div className="p-4 bg-gray-50 border border-gray-200 rounded-md">
                  <p className="text-sm text-gray-600 text-center">
                    No related instances found
                  </p>
                </div>
              ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                  {availableTargetInstances.map((instance) => {
                    if (!instance) return null;
                    
                    const isNewFormat = 'instance_id' in instance && 'metadata' in instance;
                    const instanceId = instance.instance_id || instance.id;
                    if (!instanceId) return null;
                    
                    const isSelected = selectedTargetInstanceId === instanceId;
                    
                    let title: string;
                    let language: string;
                    let relationship: string;
                    let hasAlignment: boolean = false;
                    
                    if (isNewFormat) {
                      const apiInstance = instance as RelatedInstanceResponse;
                      const titleObj = apiInstance.metadata.title;
                      const firstTitleKey = titleObj ? Object.keys(titleObj)[0] : undefined;
                      title = (firstTitleKey && titleObj[firstTitleKey]) || `Instance ${instanceId}`;
                      language = apiInstance.metadata.language ? ` ${apiInstance.metadata.language}` : '';
                      relationship = apiInstance.relationship ? ` [${apiInstance.relationship}]` : '';
                      hasAlignment = Boolean(apiInstance.annotation);
                    } else {
                      const titleObj = instance.incipit_title;
                      const altTitlesObj = instance.alt_incipit_titles;
                      const titleObjTyped = titleObj && typeof titleObj === 'object' && titleObj !== null ? titleObj as Record<string, string> : null;
                      const altTitlesObjTyped = altTitlesObj && typeof altTitlesObj === 'object' && altTitlesObj !== null ? altTitlesObj as Record<string, string> : null;
                      const firstTitleKey = titleObjTyped ? Object.keys(titleObjTyped)[0] : undefined;
                      const firstAltTitleKey = altTitlesObjTyped ? Object.keys(altTitlesObjTyped)[0] : undefined;
                      
                      title = (firstTitleKey && titleObjTyped?.[firstTitleKey]) || 
                             (firstAltTitleKey && altTitlesObjTyped?.[firstAltTitleKey]) || 
                             `Instance ${instanceId}`;
                      language = '';
                      relationship = '';
                      // Check if instance has alignment annotations
                      const annotations = instance.annotations;
                      hasAlignment = Boolean(
                        annotations && 
                        typeof annotations === 'object' && 
                        Object.values(annotations).some((annArray) => 
                          Array.isArray(annArray) && 
                          annArray.some((ann: unknown) => 
                            typeof ann === 'object' && ann !== null && 'type' in ann && (ann as {type: string}).type === 'alignment'
                          )
                        )
                      );
                    }

                    return (
                      <button
                        key={instanceId}
                        onClick={() => handleTargetInstanceSelection(instanceId)}
                        className={`p-4 border-2 rounded-lg text-left transition-all hover:shadow-md relative ${
                          isSelected
                            ? 'border-blue-500 bg-blue-50 shadow-sm'
                            : 'border-gray-200 bg-white hover:border-gray-300'
                        }`}
                      >
                        <div className="flex items-start justify-between mb-2">
                      
                          {isSelected && (
                            <svg className="w-5 h-5 text-blue-600 shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                            </svg>
                          )}
                        </div>
                        <h4 className={`font-bold mb-1 ${isSelected ? 'text-blue-900' : 'text-gray-900'}`}>
                          {title}
                        </h4>
                        <div className="flex flex-wrap gap-1 mt-2">
                           {language && (
                             <span className="text-xs px-2 py-0.5 rounded bg-purple-100 text-purple-700 font-medium">
                               {getLanguageFromCode(language)}
                             </span>
                           )}
                           {relationship && (
                             <span className="text-xs px-2 py-0.5 rounded bg-amber-100 text-amber-700 font-medium">
                               {relationship.replace(/[[\]]/g, '')}
                             </span>
                           )}    <div className="flex items-center gap-2 flex-1">
                           {!hasAlignment&& (
                             <span className="inline-flex items-center gap-1 text-xs px-2 py-1 rounded bg-gray-100 text-gray-600 font-medium">
                               <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                 <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                               </svg>
                               Not Aligned
                             </span>
                           )}
                         </div>
                        </div>
                      </button>
                    );
                  })}
                </div>
              )}

              {/* Loading indicators */}
              {(isLoadingAlignment || isLoadingSourceInstance || isLoadingTargetInstance) && selectedAnnotationId && (
                <div className="mt-4 space-y-2">
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
                <div className="mt-4 p-4 bg-red-50 border border-red-200 rounded-md">
                  <p className="text-sm text-red-600">
                    Failed to load alignment annotation: {alignmentError.message}
                  </p>
                </div>
              )}
            </div>
          )}
        </div>
      </div>

      {/* Loading Overlay */}
      <LoadingOverlay 
        isVisible={isLoadingAnnotations} 
        message={loadingMessage || 'Processing annotations...'} 
      />
    </div>
  );
}

export default UnifiedSelectionPanel;


