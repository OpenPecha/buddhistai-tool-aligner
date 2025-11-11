import React from 'react';
import type { ReactCodeMirrorRef } from '@uiw/react-codemirror';
import type { SelectionHandler, TextMapping, EditorType } from '../types';
import { useTextSelectionStore } from '../../../stores/textSelectionStore';
import SourceSelectionPanel from './SourceSelectionPanel';
import TargetSelectionPanel from './TargetSelectionPanel';
import TextEditor from './TextEditor';
import TextLoader from './TextLoader';
import LoadingOverlay from './LoadingOverlay';

interface EditorProps {
  readonly ref: React.RefObject<ReactCodeMirrorRef | null> | null;
  readonly isEditable: boolean;
  readonly editorId: string;
  readonly editorType: EditorType;
  readonly onSelectionChange?: SelectionHandler;
  readonly mappings?: TextMapping[];
  readonly onTextLoad?: (text: string, source: 'file' | 'api') => void;
  readonly showContentOnlyWhenBothLoaded?: boolean;
}

function Editor({
  ref,
  isEditable,
  editorId,
  editorType,
  onSelectionChange,
  mappings = [],
  onTextLoad,
  showContentOnlyWhenBothLoaded = false
}: EditorProps) {
  // Zustand store
  const { 
    isSourceLoaded, 
    isTargetLoaded, 
    isLoadingAnnotations, 
    loadingMessage,
    annotationsApplied 
  } = useTextSelectionStore();
  
  const isTextLoaded = editorType === 'source' ? isSourceLoaded : isTargetLoaded;
  const bothTextsLoaded = isSourceLoaded && isTargetLoaded;
  
  // Determine whether to show content based on the new prop
  const shouldShowContent = showContentOnlyWhenBothLoaded ? bothTextsLoaded : isTextLoaded;
  
  // Show loading overlay when annotations are being processed and content is loaded
  const shouldShowLoadingOverlay = isLoadingAnnotations && shouldShowContent;
  
  // Debug logging for editor visibility
  React.useEffect(() => {
    console.log(`📺 ${editorType.toUpperCase()} Editor visibility:`, {
      isSourceLoaded,
      isTargetLoaded,
      isTextLoaded,
      bothTextsLoaded,
      showContentOnlyWhenBothLoaded,
      shouldShowContent,
      isLoadingAnnotations,
      annotationsApplied,
      result: shouldShowContent ? 'SHOW EDITOR' : 'SHOW SELECTION PANEL'
    });
  }, [editorType, isSourceLoaded, isTargetLoaded, isTextLoaded, bothTextsLoaded, showContentOnlyWhenBothLoaded, shouldShowContent, isLoadingAnnotations, annotationsApplied]);
  return (
    <div className="relative h-full editor-container overflow-hidden">
      {shouldShowContent ? (
        <>
          <TextEditor
            ref={ref}
            isEditable={isEditable}
            editorId={editorId}
            editorType={editorType}
            onSelectionChange={onSelectionChange}
            mappings={mappings}
          />
          {/* Loading overlay for this specific editor */}
          {shouldShowLoadingOverlay && (
            <LoadingOverlay 
              isVisible={true} 
              message={loadingMessage || 'Processing annotations...'} 
            />
          )}
        </>
      ) : (
        <div className="relative h-full">
          {editorType === 'source' ? (
            <SourceSelectionPanel />
          ) : (
            <TargetSelectionPanel />
          )}
        </div>
      )}
    </div>
  );
}


export default Editor;
