import React from 'react';
import type { ReactCodeMirrorRef } from '@uiw/react-codemirror';
import type { SelectionHandler, TextMapping, EditorType } from '../types';
import { useTextSelectionStore } from '../../../stores/textSelectionStore';
import TextSelectionPanel from './TextSelectionPanel';
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
  return (
    <div className="relative h-full editor-container overflow-hidden">
      {isTextLoaded ? 
        <TextEditor
          ref={ref}
          isEditable={isEditable}
          editorId={editorId}
          editorType={editorType}
          onSelectionChange={onSelectionChange}
          mappings={mappings}
          onTextLoad={onTextLoad}
        /> : (
          <div className="relative h-full">
            <TextSelectionPanel editorType={editorType} />
            {/* Add TextLoader to selection panel for file uploads */}
            {onTextLoad && (
              <div className="absolute top-2 right-2 z-20">
                <TextLoader onTextLoad={(text: string, source: 'file' | 'api') => {
                  // Handle file upload in selection panel
                  if (source === 'file') {
                    onTextLoad(text, source);
                  }
                }} />
              </div>
            )}
          </div>
        )}
    </div>
  );
}


export default Editor;
