import React from 'react';
import { useTexts, useInstance, useTextInstances } from '../../../hooks/useTexts';
import { useTextSelectionStore } from '../../../stores/textSelectionStore';
import { PlusCircle } from 'lucide-react';
import { CATALOGER_URL } from '../../../config';
import { useSearchParams } from 'react-router-dom';

interface TextSelectionPanelProps {
 readonly editorType: 'source' | 'target' | '';
}

function TextSelectionPanel({ editorType}: TextSelectionPanelProps) {
  const {
    sourceTextId, sourceInstanceId, isSourceLoaded,
    targetTextId, targetInstanceId,
    setSourceText, setTargetText
  } = useTextSelectionStore();
  
  // Get current editor's state from store
  const currentTextId = editorType === 'source' ? sourceTextId : targetTextId;
  const currentInstanceId = editorType === 'source' ? sourceInstanceId : targetInstanceId;
  
  const [selectedTextId, setSelectedTextId] = React.useState<string>(currentTextId || '');
  const [selectedInstanceId, setSelectedInstanceId] = React.useState<string | null>(currentInstanceId || null);
  const [textInput, setTextInput] = React.useState<string>('');
  
  const [, setSearchParams] = useSearchParams();
  
  // React Query hooks
  const { data: availableTexts = [], isLoading: isLoadingTexts, error: textsError } = useTexts({ limit: 50 });
  const { data: instancesData, isLoading: isLoadingInstances, error: instancesError } = useTextInstances(selectedTextId);
  const { data: instanceData, isLoading: isLoadingInstance, error: instanceError } = useInstance(selectedInstanceId);

  const availableInstances = instancesData || [];

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
  const handleInstanceSelection = React.useCallback(async (instanceId: string) => {
    if (!instanceId || !selectedTextId) return;
    
    try {
      if (instanceData) {
        const content = instanceData?.base || '';
        if (editorType === 'source') {
          setSourceText(selectedTextId, instanceId, content);
          handleChangeSearchParams({
            sTextId: selectedTextId,
            sInstanceId: instanceId
          });
        } else {
          setTargetText(selectedTextId, instanceId, content);
          handleChangeSearchParams({
            tTextId: selectedTextId,
            tInstanceId: instanceId
          });
        }
      }
      
      setSelectedInstanceId(instanceId);
    } catch (error) {
      console.error('Error fetching text content:', error);
      alert('Failed to load text content. Please try again.');
    }
  }, [selectedTextId, instanceData, editorType, setSourceText, setTargetText, handleChangeSearchParams]);

  // Handle manual text input
  const handleTextInputSubmit = React.useCallback(() => {
    if (textInput.trim()) {
      // For manual input, we'll use a placeholder ID
      const manualId = `manual-${Date.now()}`;
      
      if (editorType === 'source') {
        setSourceText(manualId, manualId, textInput.trim());
      } else {
        setTargetText(manualId, manualId, textInput.trim());
      }
      
      setTextInput('');
    }
  }, [textInput, editorType, setSourceText, setTargetText]);

  // Handle creating new text (redirect to cataloger)
  const handleCreateText = React.useCallback(() => {
    if (!selectedTextId) return;
    const selected = `${CATALOGER_URL}/create?t_Id=${selectedTextId}`;
    window.open(selected, '_blank');
  }, [selectedTextId]);


  const handleReset = React.useCallback(() => {
    // setSelectedSourceInstanceId(null);
    // setSelectedTargetInstanceId(null);
  }, []);

  if (editorType === '') {
    const selectedsourceInstanceId = "asdfasd";
    const selectedtargetInstanceId = "asdfasdasdfasdfasfd";
    return (
      <div className="bg-white border-b border-gray-200 p-3">
        <div className="flex items-center justify-between gap-4">
          <div className="flex items-center gap-6">
            <div className="flex items-center gap-2">
              <span className="text-sm font-medium text-gray-700">Source:</span>
              <select className="text-sm text-gray-900 border border-gray-300 rounded px-2 py-1">
                <option value={selectedsourceInstanceId}>{selectedsourceInstanceId}</option>
              </select>
            </div>
            <div className="flex items-center gap-2">
              <span className="text-sm font-medium text-gray-700">Target:</span>
              <select className="text-sm text-gray-900 border border-gray-300 rounded px-2 py-1">
                <option value={selectedtargetInstanceId}>{selectedtargetInstanceId}</option>
              </select>
            </div>
          </div>
          <button onClick={handleReset} className="px-3 py-1 text-sm text-gray-700 hover:text-gray-900 hover:bg-gray-100 rounded transition-colors">
            Reset
          </button>
        </div>
      </div>
    );
  }
  return (
    <div className="h-full flex flex-col bg-gray-50 border border-gray-200">
      {/* Header */}
      <div className="p-4 border-b border-gray-200 bg-white">
        <h3 className="text-lg font-medium text-gray-900 capitalize">
          {editorType} Text
        </h3>
        <p className="text-sm text-gray-600 mt-1">
          Select a text from the list, enter your own text, or create a new one
        </p>
      </div>

      {/* Content */}
      <div className="flex-1 p-4 space-y-4">
        {/* Step 1: Text Selection Dropdown */}
        <div className="space-y-2">
          <label htmlFor={`text-select-${editorType}`} className="block text-sm font-medium text-gray-700">
            Step 1: Select {editorType} Text
          </label>
          <select
            id={`text-select-${editorType}`}
            value={selectedTextId}
            onChange={(e) => handleTextSelection(e.target.value)}
            disabled={isLoadingTexts || (editorType === 'target' && !isSourceLoaded)}
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
          {(textsError || instancesError) && (
            <p className="text-sm text-red-600">
              {textsError ? 'Failed to load available texts: ' + textsError.message : 'Failed to load available instances: ' + instancesError.message}
            </p>
          )}
        </div>

        {/* Step 2: Instance Selection Dropdown */}
        {selectedTextId && (
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
                  const firstIncipitKey = instance?.incipit_title ? Object.keys(instance.incipit_title)[0] : null;
                  const firstAltIncipitKey = instance?.alt_incipit_titles ? Object.keys(instance.alt_incipit_titles)[0] : null;
                  const title = instance?.incipit_title?.[firstIncipitKey] || instance?.alt_incipit_titles?.[firstAltIncipitKey] || `Instance ${instance.id}`;

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
                <button title="Create new instance" onClick={handleCreateText} className='cursor-pointer flex gap-2 items-center px-4 py-2 text-sm rounded transition-colors'>
                  <PlusCircle className="w-6 h-6 text-gray-500" /> 
                </button>
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
