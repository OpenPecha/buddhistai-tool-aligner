import React from 'react';
import type { ReactCodeMirrorRef } from '@uiw/react-codemirror';
import type { SelectionHandler, TextMapping, EditorType } from '../types';
import { useTextSelectionStore } from '../../../stores/textSelectionStore';
import TextSelectionPanel from './TextSelectionPanel';
import TextEditor from './TextEditor';

interface EditorProps {
  readonly ref: React.RefObject<ReactCodeMirrorRef | null> | null;
  readonly isEditable: boolean;
  readonly editorId: string;
  readonly editorType: EditorType;
  readonly onSelectionChange?: SelectionHandler;
  readonly mappings?: TextMapping[];
  readonly onTextLoad?: (text: string, source: 'file' | 'api') => void;
}

function Editor({
  ref,
  isEditable,
  editorId,
  editorType,
  onSelectionChange,
  mappings = [],
  onTextLoad
}: EditorProps) {
  // Zustand store
  const { isSourceLoaded, isTargetLoaded } = useTextSelectionStore();
  
  const isTextLoaded = editorType === 'source' ? isSourceLoaded : isTargetLoaded;

  // const isBothTextLoaded = isSourceLoaded && isTargetLoaded;
  const isBothTextLoaded = true;

  return (
    <div className="relative h-full editor-container overflow-hidden">
    
      {isBothTextLoaded ? 
        <TextEditor
          ref={ref}
          isEditable={isEditable}
          editorId={editorId}
          editorType={editorType}
          onSelectionChange={onSelectionChange}
          mappings={mappings}
          onTextLoad={onTextLoad}
        />:<TextSelectionPanel editorType={editorType} />}
    </div>
  );
}


export default Editor;
