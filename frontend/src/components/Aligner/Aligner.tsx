import React from 'react';
import Editor from './components/Editor';
import MappingSidebar from './components/MappingSidebar';
import { Panel, PanelGroup, PanelResizeHandle } from 'react-resizable-panels';
import { useMappingState } from './hooks/useMappingState';
import { useTextSelectionStore } from '../../stores/textSelectionStore';
import TextSelectionPanel from './components/TextSelectionPanel';
import { EditorProvider, useEditorContext } from './context';
import TextNavigationBar from './components/TextNavigationBar';

function AlignerContent() {
  const { sourceEditorRef, targetEditorRef } = useEditorContext();
  
  const {
    mappings,
    currentSourceSelection,
    currentTargetSelections,
    canCreateMapping,
    selectionHandler,
    createMapping,
    deleteMapping,
    clearAllMappings,
    clearSelections,
    getMappings,
  } = useMappingState();

  // Use Zustand store for text state
  const {
    isSourceLoaded, isTargetLoaded,
    clearAllSelections
  } = useTextSelectionStore();

  // Always show editors
  const showEditors = true;

  const handleExportMappings = () => {
    const exportData = getMappings();
    
    // Create downloadable JSON file
    const dataStr = JSON.stringify(exportData, null, 2);
    const dataBlob = new Blob([dataStr], { type: 'application/json' });
    const url = URL.createObjectURL(dataBlob);
    
    const link = document.createElement('a');
    link.href = url;
    link.download = `text-mappings-${new Date().toISOString().split('T')[0]}.json`;
    document.body.appendChild(link);
    link.click();
    link.remove();
    URL.revokeObjectURL(url);
  };

  // Handle clearing all data
  const handleClearAll = React.useCallback(() => {
    clearAllSelections();
    clearAllMappings();
    clearSelections();
  }, [clearAllSelections, clearAllMappings, clearSelections]);


  const bothTextLoaded= isSourceLoaded && isTargetLoaded;
  return (
    <div className='w-full h-full flex flex-col'>
      {/* Header */}
         
      {bothTextLoaded && <TextNavigationBar />}
      
      {/* Editors and Sidebar Section - Only show when text is loaded */}
      {showEditors ? (
        <div className="flex-1 min-h-0 container mx-auto">
          <PanelGroup direction="horizontal" className="h-full">
            {/* Source Editor Panel */}
            <Panel 
              defaultSize={bothTextLoaded ? 35 : 50} 
              minSize={20}  
              maxSize={bothTextLoaded ? 50 : 80}
            >
               <Editor
                 ref={sourceEditorRef}
                 isEditable={true}
                 editorId="source-editor"
                 editorType="source"
                 onSelectionChange={selectionHandler}
                 mappings={mappings}
               />
            </Panel>
            
            {/* Resize handle between source and target */}
            <PanelResizeHandle className="w-1 bg-gray-300 hover:bg-blue-400 transition-colors duration-200 cursor-col-resize flex items-center justify-center">
              <div className="w-0.5 h-4 bg-gray-500 rounded-full opacity-60"></div>
            </PanelResizeHandle>
            
            {/* Target Editor Panel */}
            <Panel 
              defaultSize={bothTextLoaded ? 35 : 50} 
              minSize={20} 
              maxSize={bothTextLoaded ? 50 : 80}
            >
               <Editor
                 ref={targetEditorRef}
                 isEditable={true}
                 editorId="target-editor"
                 editorType="target"
                 onSelectionChange={selectionHandler}
                 mappings={mappings}
               />
            </Panel>
            
            {/* Resize handle between editors and sidebar - only show when both texts are loaded */}
            {bothTextLoaded && (
              <PanelResizeHandle className="w-1 bg-gray-300 hover:bg-blue-400 transition-colors duration-200 cursor-col-resize flex items-center justify-center">
                <div className="w-0.5 h-4 bg-gray-500 rounded-full opacity-60"></div>
              </PanelResizeHandle>
            )}
            
            {/* Mapping Sidebar Panel - only show when both texts are loaded */}
            {bothTextLoaded && (
              <Panel 
                defaultSize={30} 
                minSize={25} 
                maxSize={40}
              >
                <MappingSidebar
                  mappings={mappings}
                  currentSourceSelection={currentSourceSelection}
                  currentTargetSelections={currentTargetSelections}
                  canCreateMapping={canCreateMapping}
                  onCreateMapping={createMapping}
                  onDeleteMapping={deleteMapping}
                  onClearAllMappings={clearAllMappings}
                  onExportMappings={handleExportMappings}
                  onClearSelections={clearSelections}
                />
              </Panel>
            )}
          </PanelGroup>
        </div>
      ) : (
        /* Placeholder when no text is loaded */
        <div className="flex-1 min-h-0 flex items-center justify-center bg-gray-50">
          <div className="text-center text-gray-500 max-w-md">
            <div className="mb-4">
              <svg className="w-16 h-16 mx-auto text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
              </svg>
            </div>
            <div className="text-lg font-medium mb-2 text-gray-700">Ready to Align Texts</div>
            <div className="text-sm text-gray-600 mb-4">
              Select or enter texts in the section above to begin creating alignments between source and target texts.
            </div>
            <div className="text-xs text-gray-500 bg-gray-100 rounded-lg p-3">
              <div className="font-medium mb-1">Getting Started:</div>
              <div className="text-left space-y-1">
                <div>1. Enter or upload source text (e.g., Tibetan)</div>
                <div>2. Enter or upload target text (e.g., English)</div>
                <div>3. Click "Load" buttons to display editors</div>
                <div>4. Select text portions to create mappings</div>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

function Aligner() {
  return (
    <EditorProvider>
      <AlignerContent />
    </EditorProvider>
  );
}

export default Aligner;
