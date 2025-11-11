import React from 'react';
import type { ReactCodeMirrorRef } from '@uiw/react-codemirror';
import type { SelectionHandler, TextMapping, EditorType } from '../types';
import { useTextSelectionStore } from '../../../stores/textSelectionStore';
import SourceSelectionPanel from './SourceSelectionPanel';
import TargetSelectionPanel from './TargetSelectionPanel';
import TextEditor from './TextEditor';
import TextLoader from './TextLoader';

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
  const { isSourceLoaded, isTargetLoaded } = useTextSelectionStore();
  
  const isTextLoaded = editorType === 'source' ? isSourceLoaded : isTargetLoaded;
  const bothTextsLoaded = isSourceLoaded && isTargetLoaded;
  
  // Determine whether to show content based on the new prop
  const shouldShowContent = showContentOnlyWhenBothLoaded ? bothTextsLoaded : isTextLoaded;
  return (
    <div className="relative h-full editor-container overflow-hidden">
      {shouldShowContent ? 
        <TextEditor
          ref={ref}
          isEditable={isEditable}
          editorId={editorId}
          editorType={editorType}
          onSelectionChange={onSelectionChange}
          mappings={mappings}
        /> : (
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
