import Editor from './components/Editor';
import MappingSidebar from './components/MappingSidebar';
import { Panel, PanelGroup, PanelResizeHandle } from 'react-resizable-panels';
import { root_text, translation_text } from '../../data/text.ts';
import { useMappingState } from './hooks/useMappingState';

function Aligner() {
  const {
    mappings,
    currentSourceSelection,
    currentTargetSelections,
    canCreateMapping,
    selectionHandler,
    createMapping,
    deleteMapping,
    clearAllMappings,
    getMappings,
  } = useMappingState();

  const handleExportMappings = () => {
    const exportData = getMappings();
    console.log('Exported mappings:', exportData);
    
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

  return (
    <div className='w-full h-full'>
      <PanelGroup direction="horizontal" className="h-full">
        {/* Source Editor Panel */}
        <Panel defaultSize={35} minSize={20} maxSize={50}>
          <Editor
            initialValue={root_text}
            ref={null}
            isEditable={true}
            editorId="source-editor"
            editorType="source"
            onSelectionChange={selectionHandler}
            mappings={mappings}
          />
        </Panel>
        
        <PanelResizeHandle className="w-1 bg-gray-300 hover:bg-blue-400 transition-colors duration-200 cursor-col-resize flex items-center justify-center">
          <div className="w-0.5 h-4 bg-gray-500 rounded-full opacity-60"></div>
        </PanelResizeHandle>
        
        {/* Target Editor Panel */}
        <Panel defaultSize={35} minSize={20} maxSize={50}>
          <Editor
            initialValue={translation_text}
            ref={null}
            isEditable={true}
            editorId="target-editor"
            editorType="target"
            onSelectionChange={selectionHandler}
            mappings={mappings}
          />
        </Panel>
        
        <PanelResizeHandle className="w-1 bg-gray-300 hover:bg-blue-400 transition-colors duration-200 cursor-col-resize flex items-center justify-center">
          <div className="w-0.5 h-4 bg-gray-500 rounded-full opacity-60"></div>
        </PanelResizeHandle>
        
        {/* Mapping Sidebar Panel */}
        <Panel defaultSize={20} minSize={20} maxSize={30}>
          <MappingSidebar
            mappings={mappings}
            currentSourceSelection={currentSourceSelection}
            currentTargetSelections={currentTargetSelections}
            canCreateMapping={canCreateMapping}
            onCreateMapping={createMapping}
            onDeleteMapping={deleteMapping}
            onClearAllMappings={clearAllMappings}
            onExportMappings={handleExportMappings}
          />
        </Panel>
      </PanelGroup>
    </div>
  );
}

export default Aligner;
