import React from 'react';
import { useTexts, useInstance, useTextInstances, useAnnotation } from '../../../hooks/useTextData';
import { useTextSelectionStore } from '../../../stores/textSelectionStore';
import { useRelatedInstances } from '../hooks/useRelatedInstances';
import { PlusCircle, RotateCcw } from 'lucide-react';
import { CATALOGER_URL } from '../../../config';
import { useSearchParams } from 'react-router-dom';
import { applySegmentation } from '../../../lib/annotation';

interface TextSelectionPanelProps {
  readonly editorType: 'source' | 'target';
}

function TextSelectionPanel({ editorType }: TextSelectionPanelProps) {
  const {
    sourceTextId, sourceInstanceId,
    targetTextId, targetInstanceId,
    setSourceText, setTargetText
  } = useTextSelectionStore();

  // Get current editor's state from store
  const currentTextId = editorType === 'source' ? sourceTextId : targetTextId;
  const currentInstanceId = editorType === 'source' ? sourceInstanceId : targetInstanceId;
  
  const [selectedTextId, setSelectedTextId] = React.useState<string>(currentTextId || '');
  const [selectedInstanceId, setSelectedInstanceId] = React.useState<string | null>(currentInstanceId || null);
  
  const [, setSearchParams] = useSearchParams();
  
  // React Query hooks
  const { data: availableTexts = [], isLoading: isLoadingTexts, error: textsError } = useTexts({ limit: 50 });
  const { data: instancesData, isLoading: isLoadingInstances, error: instancesError } = useTextInstances(selectedTextId);
  const { data: instanceData, isLoading: isLoadingInstance, error: instanceError } = useInstance(selectedInstanceId);
  
  // For target editor, use related instances from source
  const { data: relatedInstances = [], isLoading: isLoadingRelatedInstances, error: relatedInstancesError } = useRelatedInstances(
    editorType === 'target' ? sourceInstanceId : null,
    { enabled: editorType === 'target' && Boolean(sourceInstanceId) }
  );
  
  // Get segmentation annotations from the annotations object
  const segmentationAnnotation = instanceData?.annotations?.filter((annotation: any)=>annotation.type==='segmentation') as Array<{annotation_id: string; type: string}> | undefined;
  const segmentAnnotation = segmentationAnnotation?.[0];
  
  const {data: segmentAnnotationData, isLoading: isLoadingSegmentAnnotation, error: segmentAnnotationError} = useAnnotation(segmentAnnotation?.annotation_id ?? null);
  
  // Determine which instances to show based on editor type
  const availableInstances = React.useMemo(() => {
    if (editorType === 'target' && sourceInstanceId) {
      // For target editor with source selected, show related instances
      return Array.isArray(relatedInstances) ? relatedInstances : [];
    } else if (editorType === 'source') {
      // For source editor, show normal instances
      return Array.isArray(instancesData) ? instancesData : [];
    } else {
      // Target editor without source selected - show empty array
      return [];
    }
  }, [editorType, sourceInstanceId, relatedInstances, instancesData]);
  
  // Check if target editor should be disabled
  const isTargetDisabled = editorType === 'target' && !sourceInstanceId;
  
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
    setSelectedTextId(currentTextId || '');
    setSelectedInstanceId(currentInstanceId || null);
  }, [currentTextId, currentInstanceId]);

  // Handle text selection from dropdown (first step)
  const handleTextSelection = React.useCallback((textId: string) => {
    if (!textId) return;
    
    setSelectedTextId(textId);
    setSelectedInstanceId(null); // Clear instance selection when text changes
  }, []);

  // Handle instance selection from dropdown (second step)
  const handleInstanceSelection = React.useCallback((instanceId: string) => {
    if (!instanceId) return;
    
    // For target editor with related instances, we don't need a selectedTextId
    // For source editor, we need selectedTextId
    if (editorType === 'source' && !selectedTextId) return;
    
    // Just update the selected instance ID
    // The useEffect below will handle setting the text content when instanceData is available
    setSelectedInstanceId(instanceId);
    
    // For target editor, we also need to set a text ID (we can derive it from the instance or use a placeholder)
    if (editorType === 'target' && !selectedTextId) {
      // Find the related instance to get its text information
      const relatedInstance = relatedInstances.find(inst => inst.id === instanceId);
      if (relatedInstance) {
        // Use a placeholder text ID for related instances
        setSelectedTextId(`related-${instanceId}`);
      }
    }
  }, [selectedTextId, editorType, relatedInstances]);

  // Watch for instanceData and segmentAnnotationData changes and update text content when available
  React.useEffect(() => {
    if (!instanceData || !selectedInstanceId || !selectedTextId) return;
    
    // Don't process if we're still loading the annotation
    if (segmentAnnotation && isLoadingSegmentAnnotation) return;
    
    try {
      let content = instanceData.content || '';
      
      // If we have segmentation annotation data, apply it to the content
      if (segmentAnnotationData && Array.isArray(segmentAnnotationData)) {
        console.log(content,segmentAnnotationData);
        content = applySegmentation(content, segmentAnnotationData);
      } else if (segmentAnnotationError) {
        console.error('Error loading segmentation annotation:', segmentAnnotationError);
      }
      
      // Set the text in the editor (either segmented or original)
      if (editorType === 'source') {
        setSourceText(selectedTextId, selectedInstanceId, content, 'database');
        handleChangeSearchParams({
          sTextId: selectedTextId,
          sInstanceId: selectedInstanceId
        });
      } else if (editorType === 'target') {
        setTargetText(selectedTextId, selectedInstanceId, content, 'database');
        handleChangeSearchParams({
          tTextId: selectedTextId,
          tInstanceId: selectedInstanceId
        });
      }
    } catch (error) {
      console.error('Error setting text content:', error);
      alert('Failed to load text content. Please try again.');
    }
  }, [instanceData, segmentAnnotationData, selectedInstanceId, selectedTextId, editorType, setSourceText, setTargetText, handleChangeSearchParams, segmentAnnotation, isLoadingSegmentAnnotation, segmentAnnotationError]);

  // Handle creating new text (redirect to cataloger)
  const handleCreateText = React.useCallback(() => {
    if (!selectedTextId) return;
    const selected = `${CATALOGER_URL}/create?t_Id=${selectedTextId}`;
    window.open(selected, '_blank');
  }, [selectedTextId]);

  // Handle reset - clear both source and target selections
  const handleReset = React.useCallback(() => {
    const { clearAllSelections } = useTextSelectionStore.getState();
    clearAllSelections();
    
    // Also clear local state
    setSelectedTextId('');
    setSelectedInstanceId(null);
    
    // Clear URL parameters
    setSearchParams(new URLSearchParams());
  }, [setSearchParams]);

  return (
    <div className="h-full flex flex-col bg-gray-50 border border-gray-200">
      {/* Header */}
      <div className="p-4 border-b border-gray-200 bg-white">
        <div className="flex items-center justify-between">
          <div>
            <h3 className="text-lg font-medium text-gray-900 capitalize">
              {editorType} Text
            </h3>
            <p className="text-sm text-gray-600 mt-1">
              {/* Show different messages based on current state */}
              {(() => {
                const bothTextsLoaded = sourceInstanceId && targetInstanceId;
                const currentTextLoaded = editorType === 'source' ? sourceInstanceId : targetInstanceId;
                
                if (currentTextLoaded && !bothTextsLoaded) {
                  return `${editorType === 'source' ? 'Source' : 'Target'} text selected. Please select ${editorType === 'source' ? 'target' : 'source'} text to view content.`;
                } else if (editorType === 'target' && !sourceInstanceId) {
                  return 'Please select a source text first to see related target instances';
                } else if (editorType === 'target' && sourceInstanceId) {
                  return 'Select from related instances based on your source text';
                } else {
                  return 'Select a text from the list, enter your own text, or create a new one';
                }
              })()}
            </p>
          </div>
          {/* Reset button - show when there are selections to clear */}
          {(sourceInstanceId || targetInstanceId) && (
            <button 
              title="Reset all text selections" 
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
        {/* Step 1: Text Selection Dropdown - Only show for source or when target has related instances */}
        {(editorType === 'source' || (editorType === 'target' && sourceInstanceId)) && (
          <div className="space-y-2">
            <label htmlFor={`text-select-${editorType}`} className="block text-sm font-medium text-gray-700">
              {editorType === 'target' ? 'Related Target Instances' : `Step 1: Select ${editorType} Text`}
            </label>
            {editorType === 'source' ? (
              <select
                id={`text-select-${editorType}`}
                value={selectedTextId}
                onChange={(e) => handleTextSelection(e.target.value)}
                disabled={isTargetDisabled}
                className="w-full px-3 py-2 border border-gray-300 rounded-md text-sm bg-white disabled:opacity-50 disabled:cursor-not-allowed focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
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
            ) : (
              // For target editor, show related instances directly
              <select
                id={`instance-select-${editorType}`}
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
                  const firstIncipitKey = instance?.incipit_title ? Object.keys(instance.incipit_title)[0] : undefined;
                  const firstAltIncipitKey = instance?.alt_incipit_titles ? Object.keys(instance.alt_incipit_titles)[0] : undefined;
                  const title = (firstIncipitKey && instance?.incipit_title?.[firstIncipitKey]) || (firstAltIncipitKey && instance?.alt_incipit_titles?.[firstAltIncipitKey]) || `Instance ${instance.id}`;

                  return (
                    <option key={instance.id} value={instance.id}>
                      {instance.type || 'Instance'} - {title}
                    </option>
                  );
                })}
              </select>
            )}
            {textsError && (
              <p className="text-sm text-red-600">
                Failed to load available texts: {textsError.message}
              </p>
            )}
            {instancesError && editorType === 'source' && (
              <p className="text-sm text-red-600">
                Failed to load available instances: {instancesError.message}
              </p>
            )}
            {relatedInstancesError && editorType === 'target' && (
              <p className="text-sm text-red-600">
                Failed to load related instances: {relatedInstancesError.message}
              </p>
            )}
          </div>
        )}
        
        {/* Disabled state message for target editor */}
        {isTargetDisabled && (
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

        {/* Step 2: Instance Selection Dropdown - Only for source editor */}
        {selectedTextId && editorType === 'source' && (
          <div className="space-y-2">
            <label htmlFor={`instance-select-${editorType}`} className="block text-sm font-medium text-gray-700">
              Step 2: Select Instance
            </label>
            <div className="flex gap-2 items-center">
              <select
                id={`instance-select-${editorType}`}
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
                  const firstIncipitKey = instance?.incipit_title ? Object.keys(instance.incipit_title)[0] : undefined;
                  const firstAltIncipitKey = instance?.alt_incipit_titles ? Object.keys(instance.alt_incipit_titles)[0] : undefined;
                  const title = (firstIncipitKey && instance?.incipit_title?.[firstIncipitKey]) || (firstAltIncipitKey && instance?.alt_incipit_titles?.[firstAltIncipitKey]) || `Instance ${instance.id}`;

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
                <div className="flex gap-1">
                  <button title="Create new instance" onClick={handleCreateText} className='cursor-pointer flex gap-2 items-center px-3 py-2 text-sm rounded transition-colors hover:bg-gray-100'>
                    <PlusCircle className="w-5 h-5 text-gray-500" /> 
                  </button>
                  <button title="Reset all selections" onClick={handleReset} className='cursor-pointer flex gap-2 items-center px-3 py-2 text-sm rounded transition-colors hover:bg-gray-100 text-red-600 hover:bg-red-50'>
                    <RotateCcw className="w-5 h-5" /> 
                  </button>
                </div>
              )}
            </div>
            {instanceError && (
              <p className="text-sm text-red-600">Failed to load available instances: {instanceError.message}</p>
            )}
          </div>
        )}
      </div>
    </div>
  );
}

export default TextSelectionPanel;